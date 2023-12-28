import { ConversationChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanChatMessage } from 'langchain/schema';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
  MessagesPlaceholder,
} from 'langchain/prompts';
import { BufferWindowMemory } from 'langchain/memory';
import { Notice } from 'obsidian';
import ArcanaPlugin from './main';
import ArcanaSettings from './include/ArcanaSettings';
import SerializableAborter from './include/Aborter';
import { escapeCurlyBraces } from './include/TextPostProcesssing';
import { TokenTextSplitter } from 'langchain/text_splitter';

class ConvState {
  connected = false;
}

class QuestionState {
  currentAborter: AbortController = new AbortController();
  abortAcknowledged = false;
}

export default class AIFeed {
  private settings: ArcanaSettings;

  private convState: ConvState = new ConvState();
  private currentQuestionState: QuestionState | null = null;
  private conversationContext: string;

  private chain: ConversationChain | null = null;

  // Never fires exception
  constructor(aiSettings: ArcanaSettings, conversationContext: string) {
    this.settings = aiSettings;
    // Clean
    this.conversationContext = escapeCurlyBraces(conversationContext);
  }

  private handleErrors(e: Error) {
    // Sadly, Langchain does not cope well with streaming and exceptions. If an api error happens, it will not return a text/event-stream but instead an application/json with the error message.
    // This will throw that the stream was not returned instead of the error message.
    let errorMessage = `${e.message}`;
    if (errorMessage.includes('401'))
      errorMessage = 'Invalid API Key in Settings';
    else if (errorMessage.contains('key not found'))
      errorMessage = 'Invalid API Key in Settings';

    new Notice(errorMessage);
    console.error(errorMessage);

    this.disconnect();
    throw e;
  }

  private getLLM(streaming = true): ChatOpenAI {
    const apiKey = this.settings.OPEN_AI_API_KEY;
    const model = this.settings.MODEL_TYPE;
    const temperature = this.settings.TEMPERATURE;
    const topP = this.settings.TOP_P;
    return new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: model,
      temperature: temperature,
      topP: topP,
      streaming: streaming,
      maxRetries: 0,
    });
  }
  private async connect() {
    try {
      const chatPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(this.conversationContext),
        new MessagesPlaceholder('history'),
        HumanMessagePromptTemplate.fromTemplate('{input}'),
      ]);

      this.chain = new ConversationChain({
        memory: new BufferWindowMemory({
          returnMessages: true,
          memoryKey: 'history',
          k: 12,
        }),
        prompt: chatPrompt,
        llm: this.getLLM(true),
      });

      // Test if the AI is working
      await this.sendTestMessage();

      this.convState = { ...new ConvState(), connected: true };
    } catch (e) {
      this.handleErrors(e);
    }
  }

  public disconnect() {
    this.chain = null;
    this.convState = new ConvState();
    this.currentQuestionState = null;
  }

  public isConnected(): boolean {
    return this.convState.connected;
  }

  private async sendTestMessage() {
    this.getLLM(false).call([
      new HumanChatMessage('This is a test of the API. Does it work?'),
    ]);
  }

  public setContext(context: string) {
    this.conversationContext = escapeCurlyBraces(context);
  }

  public abortCurrentQuestion() {
    this.currentQuestionState?.currentAborter.abort();
  }

  public isQuestionBeingAsked(): boolean {
    return this.currentQuestionState !== null;
  }

  public async generateRawInputMessage(input: string): Promise<string> {
    const history = await this.chain!.memory!.loadMemoryVariables([
      'history',
    ]).then(vars => vars['history']);

    return (
      this.conversationContext +
      '\n' +
      history.map((msg: any) => msg.text).join('\n') +
      '\n' +
      input
    );
  }

  private async tokenize(input: string): Promise<string[]> {
    const tokenSplitter = new TokenTextSplitter({
      encodingName: 'cl100k_base',
      chunkOverlap: 0,
      chunkSize: 1,
    });
    return await tokenSplitter.splitText(input);
  }

  public async logCost(input: string, output: string) {
    const inputPrice =
      this.settings.MODEL_TYPE == 'gpt-4-1106-preview' ? 0.01 : 0.001;
    const outputPrice =
      this.settings.MODEL_TYPE == 'gpt-4-1106-preview' ? 0.03 : 0.002;

    const inputTokens = await this.tokenize(input);
    const outputTokens = await this.tokenize(output);

    const inputCost = (inputTokens.length / 1000) * inputPrice;
    const outputCost = (outputTokens.length / 1000) * outputPrice;

    const totalCost = inputCost + outputCost;
    const message = `Cost: $${totalCost.toFixed(4)}`;
    // TODO make this threshold a setting
    if (totalCost > 0.05) {
      new Notice(message);
    }
    console.log(message);
  }

  async askQuestion(
    question: string,
    onToken?: (token: string) => void,
    onAborted?: () => void
  ): Promise<string | null> {
    // Must be connected
    if (!this.isConnected()) {
      await this.connect();
    }
    // Cannot ask question while another is being asked
    if (this.isQuestionBeingAsked()) {
      return null;
    }

    const handleErrors = this.handleErrors;
    // Escape curly braces
    question = escapeCurlyBraces(question);
    // Make the call

    const state = new QuestionState();
    this.currentQuestionState = state;
    const stopAsking = (() => {
      this.currentQuestionState = null;
    }).bind(this);

    const inputMessage = await this.generateRawInputMessage(question);

    const response = await this.chain!.call(
      {
        input: question,
      },
      [
        {
          handleLLMNewToken(token: string) {
            if (state.abortAcknowledged) return;
            if (state.currentAborter.signal.aborted) {
              state.abortAcknowledged = true;
              stopAsking();
              onAborted?.();
              return;
            }
            if (onToken) {
              onToken(token);
            }
          },
          handleLLMError(err, runId, parentRunId) {
            handleErrors(err);
          },
        },
      ]
    );

    // If the answer was not prematurely stopped, then the question is now done
    if (!state.abortAcknowledged) this.currentQuestionState = null;

    // Log cost
    await this.logCost(inputMessage, response.response);
    return response.response;
  }

  public getContext(): string {
    return this.conversationContext;
  }
}

export class AIFeedRegistery {
  // AgentName to Conversation
  private static feeds: Map<string, AIFeed> = new Map<string, AIFeed>();

  public static createFeedIfDoesNotExist(
    arcana: ArcanaPlugin,
    name: string
  ): AIFeed {
    let conv = this.getFeed(name);
    if (conv) return conv;
    conv = arcana.startFeed(name);
    this.feeds.set(name, conv);
    return conv;
  }

  public static getFeed(name: string): AIFeed | null {
    return this.feeds.get(name) ?? null;
  }
}
