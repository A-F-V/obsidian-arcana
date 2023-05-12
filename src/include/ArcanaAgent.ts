//import { HNSWLib, HNSWLibArgs } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { TFile, Notice } from 'obsidian';

import { VectorSearchResult, VectorStore } from './VectorStore';
import NoteIDer from './NoteIDer';
import ArcanaPlugin from 'src/main';
import { removeFrontMatter } from 'src/utilities/DocumentCleaner';
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
  private disableEmbedding: boolean;
  private vectorStore: VectorStore;
  private noteIDer: NoteIDer;

  constructor(arcana: ArcanaPlugin, disableEmbedding = false) {
    this.arcana = arcana;
    this.disableEmbedding = disableEmbedding;
    if (!disableEmbedding) {
      this.noteIDer = new NoteIDer(arcana);

      this.vectorStore = new VectorStore(arcana);

      this.setupEmbeddingPolicy();
    }
  }

  private setupEmbeddingPolicy() {
    // Request Embeddings periodically
    // Every 2 minutes
    // Create Resource
    this.arcana.registerInterval(
      window.setInterval(async () => {
        const files = this.arcana.app.vault.getMarkdownFiles();
        await this.requestNewEmbeddings(files);
        await this.save();
      }, 120000)
    );

    // Set up the commands to force trigger
    this.arcana.addCommand({
      id: 'request-embedding-for-current-file',
      name: 'Request embedding for current file',
      callback: () => {
        const currentFile = app.workspace.getActiveFile();
        if (!currentFile) {
          new Notice('No file is currently open');
          return;
        } else {
          this.requestNewEmbeddings([currentFile]);
        }
      },
    });

    this.arcana.addCommand({
      id: 'request-embedding-for-all-files',
      name: 'Request embedding for all files',
      callback: async () => {
        const files = this.arcana.app.vault.getMarkdownFiles();
        await this.requestNewEmbeddings(files);
        await this.save();
      },
    });
  }

  async save() {
    if (this.disableEmbedding) return;
    await this.vectorStore.saveStore();
  }

  // TODO: Move the file hashes into another file so that they are not managed by the vector stores
  private async requestNewEmbeddings(files: TFile[]) {
    if (this.disableEmbedding) return;

    // Construct the text used to embed
    const getIDText = async (file: TFile) => {
      // Get the embedding for the file
      let text = await this.arcana.app.vault.read(file);
      text = removeFrontMatter(text);
      //text = surroundWithMarkdown(text);
      text = `# ${file.basename}\n\n${text}`;
      const id = await this.noteIDer.getNoteID(file);
      const isDifferent = await this.vectorStore.hasChanged(id, text);
      if (isDifferent && text !== '' && file.extension === 'md') {
        return { id, text };
      } else {
        return null;
      }
    };
    // Create the batch
    const batch = (await Promise.all(files.map(getIDText)))
      // Filter out nulls
      .filter(x => x !== null) as { id: number; text: string }[];

    if (batch.length != 0) {
      const embedding = new OpenAIEmbeddings({
        openAIApiKey: this.arcana.getAPIKey(),
      });
      // Get the embeddings
      const embeddings = await embedding
        .embedDocuments(batch.map(res => res.text))
        .catch(err => {
          console.log(err);
          return [];
        });
      // Save the embeddings
      for (let i = 0; i < batch.length; i++) {
        const id = batch[i].id;
        const text = batch[i].text;
        const embedding = embeddings[i];
        await this.vectorStore.setVector(id, embedding, text);
      }
    }
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
    tokenHandler: (token: string) => void
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
            if (!aborted) {
              tokenHandler(token);
            }
          },
        },
      ]
    );
    releaser();
    return response.text;
  }
  public async getKClosestDocuments(
    text: string,
    k: number
  ): Promise<ArcanaSearchResult[]> {
    if (this.disableEmbedding) return [];
    // Get embedding
    const embedding = new OpenAIEmbeddings({
      openAIApiKey: this.arcana.getAPIKey(),
    });
    const res = (await embedding.embedDocuments([text]))[0];
    // Get closest documents
    const vectorResults: VectorSearchResult[] =
      await this.vectorStore.searchForClosestVectors(res, k);
    // Get the files
    const maybeResults = await Promise.all(
      vectorResults.map(async result => {
        return {
          file: await this.noteIDer.getDocumentWithID(result.id),
          id: result.id,
          score: result.score,
        };
      })
    );
    // Filter out the ones where the file is not found (null)
    return maybeResults.filter(
      result => result.file !== null
    ) as ArcanaSearchResult[];
  }

  public async getFileID(file: TFile): Promise<number> {
    if (this.disableEmbedding) return -1;
    return await this.noteIDer.getNoteID(file);
  }
}
