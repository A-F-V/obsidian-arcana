import { Low, TextFile } from 'lowdb';
import EmbeddingEncoder from './EmbeddingEncoder';
import { TFile } from 'obsidian';
import { hashDocument } from './DocumentHasher';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from 'langchain/document';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import ArcanaPlugin from 'src/main';
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
export default class VectorStore {
  private store: Low<VectorStoreData>;
  private searchIndex: HNSWLib;
  private arcana: ArcanaPlugin;
  private loaded = false;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
    // Configure lowdb to write data to JSON file
    const adapter = new CompressedVectorStoreAdapter(
      arcana.fs.getPath('embeddingStorage.json')
    );

    this.store = new Low<VectorStoreData>(adapter);
    // Set up the similiarty index
    this.searchIndex = new HNSWLib(
      new OpenAIEmbeddings({ openAIApiKey: arcana.getAPIKey() }),
      { space: 'cosine' }
    );
  }

  private async loadStore(): Promise<VectorStoreData> {
    if (!this.loaded) {
      await this.store.read();
      this.store.data ||= new VectorStoreData();

      // Add all vectors to the search index
      for (const [id, vector] of this.store.data.idsToVectors.entries()) {
        this.addVectorToIndex(id, vector);
      }
      this.loaded = true;
    }
    return this.store.data!;
  }

  private addVectorToIndex(id: number, vector: number[]) {
    this.searchIndex.addVectors(
      [vector],
      [new Document({ pageContent: String(id) })]
    );
  }
  async saveStore() {
    console.log('Saving store');
    console.log('Store data: ', this.store.data);

    await this.store.write();
  }

  private async getStore(): Promise<VectorStoreData> {
    if (this.store.data === null) {
      return await this.loadStore();
    }
    return this.store.data;
  }

  async removeID(id: number) {
    console.log('Removing id ' + id);
    const store = await this.getStore();
    store.idsToVectors.delete(id);
  }

  async hasChanged(id: number, document: string): Promise<boolean> {
    const store = await this.getStore();
    const hash = hashDocument(document);
    const lastHash = store.idsToDocumentHash.get(id);
    if (lastHash === undefined) {
      return true;
    }
    return lastHash != hash;
  }
  async setVector(id: number, vector: number[], document: string) {
    const store = await this.getStore();
    store.idsToVectors.set(id, vector);
    store.idsToDocumentHash.set(id, hashDocument(document));
  }

  async searchForClosestVectors(query: number[], k: number): Promise<number[]> {
    // Ensure everything is loaded
    await this.loadStore();

    console.log(this.searchIndex);

    const topResults = await this.searchIndex.similaritySearchVectorWithScore(
      query,
      k
    );

    const topIds = topResults.map(result => {
      // unpack document and score
      const [document] = result;
      return Number(document.pageContent);
    });
    return topIds;
  }
}
