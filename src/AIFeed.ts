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

class ConvState {
  currentAborter: AbortController = new AbortController();
  engaged = false;
}

export default class AIFeed {
  private settings: ArcanaSettings;

  private convState: ConvState = new ConvState();
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

    this.disengage();
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

  private async engage() {
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

      this.convState = new ConvState();
      this.convState.engaged = true;
    } catch (e) {
      this.handleErrors(e);
    }
  }

  private async sendTestMessage() {
    this.getLLM(false).call([
      new HumanChatMessage('This is a test of the API. Does it work?'),
    ]);
  }

  public disengage() {
    this.chain = null;
    this.convState = new ConvState();
  }

  private isEngaged(): boolean {
    return this.convState.engaged;
  }

  public setContext(context: string) {
    this.conversationContext = escapeCurlyBraces(context);
  }

  public abortQuestion() {
    this.convState.currentAborter.abort();
  }

  async askQuestion(
    question: string,
    onToken?: (token: string) => void,
    onAborted?: () => void
  ): Promise<string | null> {
    if (this.isEngaged()) {
      return null;
    }

    this.engage();

    const handleErrors = this.handleErrors;
    // Escape curly braces
    question = escapeCurlyBraces(question);
    // Make the call
    const response = await this.chain!.call(
      {
        input: question,
        signal: this.convState.currentAborter.signal,
      },
      [
        {
          handleLLMNewToken(token: string) {
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

    if (this.convState.currentAborter.signal.aborted && onAborted) {
      onAborted();
    }

    this.disengage();

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
    let conv = this.getConversation(name);
    if (conv) return conv;
    conv = arcana.startFeed(name);
    this.feeds.set(name, conv);
    return conv;
  }

  public static getConversation(name: string): AIFeed | null {
    return this.feeds.get(name) ?? null;
  }
}
