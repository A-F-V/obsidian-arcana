import { OpenAI } from 'langchain';
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
/*
  TODO: Rename File to Arcanagent
  - Each file needs to have an id
  - Each id is associated with a vector

  - Upon certain events, vectors are added and removed from the store

*/
export default class ArcanaAgent {
  private arcana: ArcanaPlugin;
  private openAI: OpenAI;

  private vectorStore: VectorStore;
  private noteIDer: NoteIDer;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;

    this.openAI = new OpenAI({
      openAIApiKey: this.arcana.getAPIKey(),
      modelName: 'gpt-3.5-turbo',
    });
    this.noteIDer = new NoteIDer(arcana);

    this.vectorStore = new VectorStore(arcana);

    // Setup file system callbacks
    app.vault.on('create', async (file: TAbstractFile) => {
      if (file instanceof TFile) {
        await this.requestNewEmbedding(file);
      }
    });
    app.vault.on('delete', async (file: TAbstractFile) => {});
    app.vault.on('rename', async (file: TAbstractFile, oldPath: string) => {
      if (file instanceof TFile) {
        await this.requestNewEmbedding(file);
      }
    });

    this.setupEmbeddingPolicy();
  }

  private setupEmbeddingPolicy() {
    // Request Embeddings periodically
    // TODO:

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
      callback: () => {
        this.arcana.app.vault.getMarkdownFiles().forEach(async file => {
          await this.requestNewEmbedding(file);
        });
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
    console.log('Requesting embedding for ' + file.path + ' - ' + isDifferent);
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

  public queryAndComplete(query: string): Promise<string> {
    return this.openAI.call(query);
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
}
