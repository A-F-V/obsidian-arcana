import { Low, TextFile } from 'lowdb';
import EmbeddingEncoder from './EmbeddingEncoder';
import { TFile } from 'obsidian';
import { hashDocument } from './DocumentHasher';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from 'langchain/document';
import ArcanaPlugin from 'src/main';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Mutex } from 'async-mutex';
// Import JSONFile class
/*
TODO: More consistency checks
*/
class VectorStoreData {
  version = 1;
  idsToVectors: Map<number, number[]>;
  idsToDocumentHash: Map<number, string>;

  constructor() {
    this.idsToVectors = new Map();
    this.idsToDocumentHash = new Map();
  }

  toJSON() {
    return {
      version: this.version,
      idsToVectors: Object.fromEntries(
        Array.from(this.idsToVectors.entries()).map(([k, v]) => [
          k,
          EmbeddingEncoder.encode(v),
        ])
      ),
      idsToLastModified: Object.fromEntries(this.idsToDocumentHash),
    };
  }
  fromJSON(json: any) {
    // The version of the new file is always upgraded to the most recent
    // Versioned files
    if (json.version >= 1) {
      this.idsToVectors = new Map(
        Object.entries(json.idsToVectors).map(([k, v]) => [
          Number(k),
          EmbeddingEncoder.decode(String(v)),
        ])
      );
      this.idsToDocumentHash = new Map(
        Object.entries(json.idsToLastModified).map(([k, v]) => [
          Number(k),
          String(v),
        ])
      );
    }
  }
}

class CompressedVectorStoreAdapter {
  private adapter: TextFile;
  constructor(filename: string) {
    this.adapter = new TextFile(filename);
  }

  async read(): Promise<VectorStoreData | null> {
    const data = await this.adapter.read();
    if (data === null) {
      return null;
    } else {
      const store = new VectorStoreData();
      store.fromJSON(JSON.parse(data));
      return store;
    }
  }

  async write(obj: VectorStoreData) {
    return this.adapter.write(JSON.stringify(obj));
  }
}
// Confusing naming of store
export type VectorSearchResult = {
  id: number;
  score: number;
};
export class VectorStore {
  private store: Low<VectorStoreData>;
  private searchIndex: MemoryVectorStore;
  private arcana: ArcanaPlugin;
  private loaded = false;
  private loadMutex = new Mutex();

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
    // Configure lowdb to write data to JSON file
    const path = arcana.fs.getPath('embeddingStorage.json');
    const adapter = new CompressedVectorStoreAdapter(path);

    this.store = new Low<VectorStoreData>(adapter);
    this.store.data = new VectorStoreData();
    // Set up the similiarty index
  }

  private async loadStore(): Promise<VectorStoreData> {
    const release = await this.loadMutex.acquire();
    if (!this.loaded) {
      console.log('Loading store from disk');
      // Log the stack trace
      await this.store.read();

      this.store.data ||= new VectorStoreData();

      // Add all vectors to the search index
      this.searchIndex = new MemoryVectorStore(
        new OpenAIEmbeddings({ openAIApiKey: this.arcana.getAPIKey() })
      );
      for (const [id, vector] of this.store.data.idsToVectors.entries()) {
        this.addVectorToIndex(id, vector);
      }
      this.loaded = true;
    }
    release();
    return this.store.data!;
  }

  private addVectorToIndex(id: number, vector: number[]) {
    this.searchIndex.addVectors(
      [vector],
      [new Document({ pageContent: String(id) })]
    );
  }
  async saveStore() {
    // If we have not loaded anything, then we have nothing to store.
    if (!this.loaded) {
      return;
    }

    await this.store.write();
  }

  async hasChanged(id: number, document: string): Promise<boolean> {
    const store = await this.loadStore();
    const hash = hashDocument(document);
    const lastHash = store.idsToDocumentHash.get(id);
    if (lastHash === undefined) {
      return true;
    }
    return lastHash != hash;
  }
  async setVector(id: number, vector: number[], document: string) {
    const store = await this.loadStore();
    const newID = !store.idsToVectors.has(id);

    store.idsToVectors.set(id, vector);
    store.idsToDocumentHash.set(id, hashDocument(document));
    if (newID) {
      this.addVectorToIndex(id, vector);
    } else {
      // Clear the index and re-add all vectors
      this.searchIndex = new MemoryVectorStore(
        new OpenAIEmbeddings({ openAIApiKey: this.arcana.getAPIKey() })
      );
      for (const [id, vector] of store.idsToVectors.entries()) {
        this.addVectorToIndex(id, vector);
      }
    }
  }

  async searchForClosestVectors(
    query: number[],
    k: number
  ): Promise<VectorSearchResult[]> {
    // Ensure everything is loaded
    await this.loadStore();

    const topResults = await this.searchIndex.similaritySearchVectorWithScore(
      query,
      k
    );

    return topResults.map(result => {
      // unpack document and score
      const [document, score] = result;
      return { id: Number(document.pageContent), score };
    });
  }
}
