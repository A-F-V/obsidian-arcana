import { TFile } from 'obsidian';

import ArcanaPlugin from 'src/main';
import Conversation from 'src/Conversation';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanChatMessage, SystemChatMessage } from 'langchain/schema';
/*
  TODO: Rename File to Arcanagent
  - Each file needs to have an id
  - Each id is associated with a vector

  - Upon certain events, vectors are added and removed from the store

*/
export type ArcanaSearchResult = {
  file: TFile;
  id: number;
  score: number;
};
export class ArcanaAgent {
  private arcana: ArcanaPlugin;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
  }

  private getAI() {
    return new ChatOpenAI({
      openAIApiKey: this.arcana.getAPIKey(),
      modelName: this.arcana.getAIModel(),
      streaming: true,
    });
  }
  public startConversation(conversationContext: string) {
    return new Conversation(this.getAI(), conversationContext);
  }

  public async complete(
    question: string,
    context: string,
    tokenHandler: (token: string) => void,
    withEscAborter = true
  ) {
    // Set up aborter
    let aborted = false;
    // When the esc key is pressed, abort the request
    const aborter = (e: any) => {
      if (e.key === 'Escape') {
        aborted = true;
      }
    };
    window.addEventListener('keydown', aborter);
    // Register resource with Arcana
    const releaser = () => window.removeEventListener('keydown', aborter);

    this.arcana.registerResource(releaser);
    const response = await this.getAI().call(
      [new SystemChatMessage(context), new HumanChatMessage(question)],
      undefined,
      [
        {
          handleLLMNewToken(token: string) {
            if (!aborted || !withEscAborter) {
              tokenHandler(token);
            }
          },
        },
      ]
    );
    releaser();
    return response.text;
  }
}
