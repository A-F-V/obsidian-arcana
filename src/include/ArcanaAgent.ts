import { Notice } from 'obsidian';

import ArcanaPlugin from 'src/main';
import Conversation from 'src/Conversation';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanChatMessage } from 'langchain/dist/schema';

export class ArcanaAgent {
  private arcana: ArcanaPlugin;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
  }

  private getAI(streaming = true): ChatOpenAI {
    return new ChatOpenAI({
      openAIApiKey: this.arcana.getAPIKey(),
      modelName: this.arcana.getAIModel(),
      streaming: streaming,
      maxRetries: 0,
    });
  }

  public startConversation(conversationContext: string): Conversation {
    return new Conversation(
      (streaming: boolean) => this.getAI(streaming),
      conversationContext
    );
  }

  public async complete(
    query: string,
    ctx = 'A conversation with an AI for use in Obsidian.',
    handleTokens?: (tokens: string) => void,
    aborter?: () => boolean
  ): Promise<string> {
    const conversation = this.startConversation(ctx);
    return await conversation.askQuestion(query, handleTokens, aborter);
  }
}
