//import { HNSWLib, HNSWLibArgs } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import {
  TFolder,
  TFile,
  normalizePath,
  FileSystemAdapter,
  TAbstractFile,
  Notice,
} from 'obsidian';

import VectorStore from './VectorStore';
import NoteIDer from './NoteIDer';
import ArcanaPlugin from 'src/main';
import {
  removeFrontMatter,
  surroundWithMarkdown,
} from 'src/utilities/DocumentCleaner';
import Conversation from 'src/Conversation';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanChatMessage, SystemChatMessage } from 'langchain/schema';
import { release } from 'os';
/*
  TODO: Rename File to Arcanagent
  - Each file needs to have an id
  - Each id is associated with a vector

  - Upon certain events, vectors are added and removed from the store

*/
export default class ArcanaAgent {
  private arcana: ArcanaPlugin;

  private vectorStore: VectorStore;
  private noteIDer: NoteIDer;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;

    this.noteIDer = new NoteIDer(arcana);

    this.vectorStore = new VectorStore(arcana);

    this.setupEmbeddingPolicy();
  }

  private setupEmbeddingPolicy() {
    // Request Embeddings periodically
    // Every 2 minutes
    setInterval(async () => {
      const files = this.arcana.app.vault.getMarkdownFiles();
      for (const file of files) {
        await this.requestNewEmbedding(file);
      }
      await this.save();
    }, 120000);

    // Set up the commands to force trigger
    this.arcana.addCommand({
      id: 'arcana-request-embedding-for-current-file',
      name: 'Request embedding for current file',
      callback: () => {
        const currentFile = app.workspace.getActiveFile();
        if (!currentFile) {
          new Notice('No file is currently open');
          return;
        } else {
          this.requestNewEmbedding(currentFile);
        }
      },
    });

    this.arcana.addCommand({
      id: 'arcana-request-embedding-for-all-files',
      name: 'Request embedding for all files',
      callback: async () => {
        this.arcana.app.vault.getMarkdownFiles().forEach(async file => {
          await this.requestNewEmbedding(file);
        });
        await this.save();
      },
    });
  }

  async save() {
    await this.vectorStore.saveStore();
  }

  // TODO: Move the file hashes into another file so that they are not managed by the vector stores
  private async requestNewEmbedding(file: TFile) {
    // Get the embedding for the file
    let text = await this.arcana.app.vault.read(file);
    text = removeFrontMatter(text);
    text = surroundWithMarkdown(text);
    const id = await this.noteIDer.getNoteID(file);
    const isDifferent = await this.vectorStore.hasChanged(id, text);
    if (isDifferent && text !== '' && file.extension === 'md') {
      console.log(file.path + ' has changed - fetching new embedding'); // Get the embedding
      const embedding = new OpenAIEmbeddings({
        openAIApiKey: this.arcana.getAPIKey(),
      });
      const res = (
        await embedding.embedDocuments([text]).catch(err => {
          console.log(err);
          return [];
        })
      )[0];

      // Save the embedding
      await this.vectorStore.setVector(id, res, text);
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
  public async getKClosestDocuments(text: string, k: number): Promise<TFile[]> {
    // Get embedding
    const embedding = new OpenAIEmbeddings({
      openAIApiKey: this.arcana.getAPIKey(),
    });
    const res = (await embedding.embedDocuments([text]))[0];
    // Get closest documents
    const closestIds = await this.vectorStore.searchForClosestVectors(res, k);
    // Get the files
    const closestFiles = closestIds.map(async id => {
      return await this.noteIDer.getDocumentWithID(id);
    });

    return (await Promise.all(closestFiles)).filter(
      file => file != null
    ) as TFile[];
  }

  public async getFileID(file: TFile): Promise<number> {
    return await this.noteIDer.getNoteID(file);
  }
}
