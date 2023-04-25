import { Low, TextFile } from 'lowdb';
import EmbeddingEncoder from './EmbeddingEncoder';
import { TFile } from 'obsidian';
// Import JSONFile class
/*
TODO: More consistency checks
*/
class VectorStoreData {
  //pathToIds: Map<string, number>;
  //idsToPaths: Map<number, string>;
  idsToVectors: Map<number, number[]>;

  constructor() {
    // this.pathToIds = new Map();
    //this.idsToPaths = new Map();
    this.idsToVectors = new Map();
  }

  toJSON() {
    return {
      // pathToIds: Object.fromEntries(this.pathToIds),
      // idsToPaths: Object.fromEntries(this.idsToPaths),
      idsToVectors: Object.fromEntries(
        Array.from(this.idsToVectors.entries()).map(([k, v]) => [
          k,
          EmbeddingEncoder.encode(v),
        ])
      ),
    };
  }
  fromJSON(json: any) {
    /*
    this.pathToIds = new Map(
      Object.entries(json.pathToIds).map(([k, v]) => [k, Number(v)])
    );
    this.idsToPaths = new Map(
      Object.entries(json.idsToPaths).map(([k, v]) => [Number(k), String(v)])
    );
    */
    this.idsToVectors = new Map(
      Object.entries(json.idsToVectors).map(([k, v]) => [
        Number(k),
        EmbeddingEncoder.decode(String(v)),
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

  updateDocument(file: string) {
    console.log('updating document ' + file);
  }

  async setVector(id: number, vector: number[]) {
    const store = await this.getStore();
    store.idsToVectors.set(id, vector);
  }
}
