import { OpenAI } from 'langchain';
//import { HNSWLib, HNSWLibArgs } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import {
  App,
  TFolder,
  TFile,
  normalizePath,
  FileSystemAdapter,
  TAbstractFile,
} from 'obsidian';

import VectorStore from './VectorStore';
import EmbeddingEncoder from './EmbeddingEncoder';
import { assert } from 'console';
import NoteIDer from './NoteIDer';
/*
  TODO: Since cannot remove a vector from store, need to manage custom store:

  - Each file needs to have an id
  - Each id is associated with a vector

  - Upon certain events, vectors are added and removed from the store

*/
export default class ArcanaAgent {
  private app: App;
  private openAI: OpenAI;
  private apiKey: string;
  private readonly storagePath = normalizePath('.arcana');
  private vectorStorePath = normalizePath('.arcana/vectorstore.json');
  private storageFolder: TFolder;

  private vectorStore: VectorStore;
  private idToPath: Map<number, string>;
  private noteIDer: NoteIDer;

  constructor(app: App, apiKey: string) {
    this.app = app;
    this.apiKey = apiKey;
    this.openAI = new OpenAI({ openAIApiKey: this.apiKey });
    this.idToPath = new Map();
    this.noteIDer = new NoteIDer(this.app);
  }

  async init() {
    await this.setupStorage();

    // TODO: Prune tree of deleted files

    app.vault.on('create', async (file: TAbstractFile) => {
      if (file instanceof TFile) {
        const id = await this.noteIDer.idNote(file);
        this.idToPath.set(id, file.path);
      }
    });
    app.vault.on('delete', async (file: TAbstractFile) => {
      if (file instanceof TFile) {
        const id = await this.noteIDer.idNote(file);
        this.idToPath.delete(id);
      }
    });
    app.vault.on('rename', async (file: TAbstractFile, oldPath: string) => {
      // TODO: Rename an entire file
      if (file instanceof TFile) {
        const id = await this.noteIDer.idNote(file);
        this.idToPath.set(id, file.path);
      }
    });
  }

  async save() {
    if (this.vectorStore) await this.vectorStore.saveStore();
  }

  private async setupStorage() {
    // Create the storage path if it does not exist
    await app.vault.adapter.exists(this.storagePath).then((exists: boolean) => {
      if (!exists) {
        (app.vault.adapter as FileSystemAdapter).mkdir(this.storagePath);
      }
    });

    // Create the vector store
    const path =
      (app.vault.adapter as FileSystemAdapter).getBasePath() +
      '/' +
      this.vectorStorePath;
    this.vectorStore = new VectorStore(path);
  }

  public async requestNewEmbedding(file: TFile) {
    // Get the embedding for the file
    const text = await this.app.vault.read(file);
    const id = await this.noteIDer.idNote(file);
    const isDifferent = await this.vectorStore.hasChanged(id, text);
    if (isDifferent) {
      console.log(file.path + ' has changed - fetching new embedding');
      // Get the embedding
      const embedding = new OpenAIEmbeddings({ openAIApiKey: this.apiKey });
      const res = (await embedding.embedDocuments([text]))[0];

      // Save the embedding
      await this.vectorStore.setVector(id, res, text);
    }
  }

  public async destruct() {
    await this.vectorStore.saveStore();
  }
}
