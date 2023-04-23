import { Low } from "lowdb/lib";
import { JSONFile } from "lowdb/lib/adapters/JSONFile";
// Import JSONFile class
interface VectorStoreData {
	pathToIds: Map<string, number>;
	idsToPaths: Map<number, string>;
	idsToVectors: Map<number, number[]>;
}

export default class VectorStore {
	private store: Low<VectorStoreData>;
	private nextID: number;

	constructor(pathToDB: string) {
		// Configure lowdb to write data to JSON file
		const adapter = new JSONFile<VectorStoreData>(pathToDB);
		/*const defaultData = {
			pathToIds: new Map(),
			idsToPaths: new Map(),
			idsToVectors: new Map(),
		} as VectorStoreData;
    */
		this.store = new Low<VectorStoreData>(adapter);
	}

	async loadStore() {
		await this.store.read();
		if (this.store.data === null) {
			this.store.data = {
				pathToIds: new Map(),
				idsToPaths: new Map(),
				idsToVectors: new Map(),
			} as VectorStoreData;
		}
	}

	async saveStore() {
		await this.store.write();
	}

	private getPathToID(): Map<string, number> {
		return this.store.data.pathToIds;
	}

	private getIDToPath(): Map<number, string> {
		return this.store.data.idsToPaths;
	}

	private getIDToVector(): Map<number, number[]> {
		return this.store.data.idsToVectors;
	}

	private getIDOfPath(path: string): number | undefined {
		return this.getPathToID().get(path);
	}
	private getEmbeddingOfID(id: number): number[] | undefined {
		return this.getIDToVector().get(id);
	}

	addDocument(file: string) {
		this.getPathToID().set(file, this.nextID);
		this.getIDToPath().set(this.nextID, file);
		this.nextID++;
	}

	removeDocument(file: string) {
		const id = this.getIDOfPath(file);
		if (id) {
			this.getPathToID().delete(file);
			this.getIDToPath().delete(id);
			this.getIDToVector().delete(id);
		}
	}

	renameDocument(newFile: string, oldFile: string) {
		const id = this.getIDOfPath(oldFile);
		if (id) {
			this.getPathToID().delete(oldFile);
			this.getPathToID().set(newFile, id);
			this.getIDToPath().set(id, newFile);
		}
	}
	updateDocument(file: string) {
		console.log("updating document " + file);
	}
}
