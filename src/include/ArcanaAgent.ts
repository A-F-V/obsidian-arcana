import ArcanaPlugin from 'src/main';
import Conversation from 'src/AIFeed';
import { ChatOpenAI } from 'langchain/chat_models/openai';

export class ArcanaAgent {
  private arcana: ArcanaPlugin;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
  }

  public startFeed(conversationContext: string): Conversation {
    return new Conversation(this.arcana.settings, conversationContext);
  }

  public async complete(
    query: string,
    ctx = 'A conversation with an AI for use in Obsidian.',
    onToken?: (tokens: string) => void,
    onAbort?: () => void
  ): Promise<string> {
    const conversation = this.startFeed(ctx);
    return (await conversation.askQuestion(query, onToken, onAbort))!;
  }
}
