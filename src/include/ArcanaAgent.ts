import ArcanaPlugin from 'src/main';
import Conversation from 'src/Conversation';
import { ChatOpenAI } from 'langchain/chat_models/openai';

export class ArcanaAgent {
  private arcana: ArcanaPlugin;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
  }

  private getAI(streaming = true): ChatOpenAI {
    const apiKey = this.arcana.settings.OPEN_AI_API_KEY;
    const model = this.arcana.settings.MODEL_TYPE;
    const temperature = this.arcana.settings.TEMPERATURE;
    const topP = this.arcana.settings.TOP_P;
    return new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: model,
      temperature: temperature,
      topP: topP,
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
