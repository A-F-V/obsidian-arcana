import { Low, TextFile } from 'lowdb';
import EmbeddingEncoder from './EmbeddingEncoder';
import { TFile } from 'obsidian';
import { hashDocument } from './DocumentHasher';
// Import JSONFile class
/*
TODO: More consistency checks
*/
class VectorStoreData {
  // TODO: Versioning Info

  idsToVectors: Map<number, number[]>;
  idsToDocumentHash: Map<number, string>;

  constructor() {
    this.idsToVectors = new Map();
    this.idsToDocumentHash = new Map();
  }

  toJSON() {
    return {
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

  constructor(pathToDB: string) {
    // Configure lowdb to write data to JSON file
    const adapter = new CompressedVectorStoreAdapter(pathToDB);

    this.store = new Low<VectorStoreData>(adapter);
  }

  private async loadStore(): Promise<VectorStoreData> {
    await this.store.read();
    this.store.data ||= new VectorStoreData();
    console.log(this.store.data);

    return this.store.data;
  }

  async saveStore() {
    console.log('Saving store');
    console.log('Store data: ', this.store.data);

    await this.store.write();
  }

  async getStore(): Promise<VectorStoreData> {
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
}
