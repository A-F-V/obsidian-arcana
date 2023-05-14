import { ConversationChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanChatMessage } from 'langchain/schema';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
  MessagesPlaceholder,
} from 'langchain/prompts';
import { BufferMemory } from 'langchain/memory';
import { Notice } from 'obsidian';

export default class AIConversation {
  private fetchModel: (streaming: boolean) => ChatOpenAI;
  private conversationContext: string;
  private chain: ConversationChain | null = null;

  private escapeCurlyBraces(text: string): string {
    return text.replace('{', '{{').replace('}', '}}');
  }

  // Never fires exception
  constructor(
    fetchModel: (streaming: boolean) => ChatOpenAI,
    conversationContext: string
  ) {
    this.fetchModel = fetchModel;
    // Clean
    this.conversationContext = this.escapeCurlyBraces(conversationContext);
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

  private async engage() {
    try {
      const chatPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(this.conversationContext),
        new MessagesPlaceholder('history'),
        HumanMessagePromptTemplate.fromTemplate('{input}'),
      ]);

      this.chain = new ConversationChain({
        memory: new BufferMemory({
          returnMessages: true,
          memoryKey: 'history',
        }),
        prompt: chatPrompt,
        llm: this.fetchModel(true),
      });

      // Test if the AI is working
      await this.sendTestMessage();
    } catch (e) {
      this.handleErrors(e);
    }
  }

  private async sendTestMessage() {
    this.fetchModel(false).call([
      new HumanChatMessage('This is a test of the API. Does it work?'),
    ]);
  }

  public disengage() {
    this.chain = null;
  }

  private isEngaged(): boolean {
    return this.chain !== null;
  }

  async askQuestion(
    question: string,
    handleToken?: (token: string) => void,
    aborter?: () => boolean
  ): Promise<string> {
    // Engage if not engaged
    if (!this.isEngaged()) {
      await this.engage();
    }
    // Escape curly braces
    question = this.escapeCurlyBraces(question);
    // Make the call
    const response = await this.chain!.call(
      {
        input: question,
      },
      [
        {
          handleLLMNewToken(token: string) {
            if (handleToken) {
              handleToken(token);
            }
          },
          handleLLMError(err, runId, parentRunId) {
            this.handleErrors(err);
          },
        },
      ]
    );

    return response.response;
  }

  public getContext(): string {
    return this.conversationContext;
  }
}
