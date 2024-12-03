import { ConversationChain } from 'langchain/chains';

import { HumanMessage } from '@langchain/core/messages';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { BufferWindowMemory } from 'langchain/memory';
import { Notice } from 'obsidian';
import { AgentSettings } from '@/include/ArcanaSettings';
import { escapeCurlyBraces } from '@/include/TextPostProcesssing';
import { AIAgent } from './AI';
import { calculateLLMCost, getLLM } from './LLM';

class ConvState {
  connected = false;
}

class QuestionState {
  currentAborter: AbortController = new AbortController();
  abortAcknowledged = false;
}

export default class AIFeed {
  private settings: AgentSettings;

  private convState: ConvState = new ConvState();
  private currentQuestionState: QuestionState | null = null;
  private conversationContext: string;
  private memorySize = 6;

  private chain: ConversationChain | null = null;

  // Never fires exception
  constructor(aiSettings: AgentSettings, conversationContext: string) {
    this.settings = aiSettings;
    // Clean
    this.conversationContext = escapeCurlyBraces(conversationContext);
  }

  private handleErrors(e: Error) {
    // Sadly, Langchain does not cope well with streaming and exceptions. If an api error happens, it will not return a text/event-stream but instead an application/json with the error message.
    // This will throw that the stream was not returned instead of the error message.
    let errorMessage = `${e.message}`;
    if (errorMessage.includes('401')) errorMessage = 'Invalid API Key in Settings';
    else if (errorMessage.contains('key not found')) errorMessage = 'Invalid API Key in Settings';

    new Notice(errorMessage);
    console.error(errorMessage);

    this.disconnect();
    throw e;
  }

  private async connect() {
    try {
      const chatPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(this.conversationContext),
        new MessagesPlaceholder('history'),
        HumanMessagePromptTemplate.fromTemplate('{input}'),
      ]);

      this.chain = new ConversationChain({
        memory: new BufferWindowMemory({
          returnMessages: true,
          memoryKey: 'history',
          k: this.memorySize,
        }),
        prompt: chatPrompt,
        llm: getLLM(this.settings, true),
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
    getLLM(this.settings, false).invoke([new HumanMessage('This is a test of the API. Does it work?')]);
  }

  public setContext(context: string) {
    this.conversationContext = escapeCurlyBraces(context);
  }
  public setMemorySize(size: number) {
    this.memorySize = size;
  }

  public abortCurrentQuestion() {
    this.currentQuestionState?.currentAborter.abort();
  }

  public isQuestionBeingAsked(): boolean {
    return this.currentQuestionState !== null;
  }

  public async generateRawInputMessage(input: string): Promise<string> {
    const memory = this.chain?.memory;
    if (!memory) {
      throw new Error('No memory');
    }
    const history = await memory.loadMemoryVariables(['history']).then(vars => vars['history']);

    return (
      this.conversationContext +
      '\n' +
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      history.map((msg: any) => msg.text).join('\n') +
      '\n' +
      input
    );
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

    const chain = this.chain;
    if (!chain) {
      throw new Error('No chain');
    }
    const response = await chain.call(
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

  async logCost(input: string, output: string) {
    const totalCost = await calculateLLMCost(this.settings.MODEL_TYPE, input, output);
    const message = `Cost: ~$${totalCost.toFixed(4)}`;
    // TODO make this threshold a setting
    if (totalCost > 0.05) {
      new Notice(message);
    }
    console.log(message);
  }
  public getContext(): string {
    return this.conversationContext;
  }
}

export class AIFeedRegistery {
  // AgentName to Conversation
  private static feeds: Map<string, AIFeed> = new Map<string, AIFeed>();

  public static createFeedIfDoesNotExist(agent: AIAgent, name: string): AIFeed {
    let conv = this.getFeed(name);
    if (conv) return conv;
    conv = agent.startFeed(name);
    this.feeds.set(name, conv);
    return conv;
  }

  public static getFeed(name: string): AIFeed | null {
    return this.feeds.get(name) ?? null;
  }
}
