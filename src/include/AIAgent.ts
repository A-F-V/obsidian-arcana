import { OpenAI } from "langchain";
//import { HNSWLib, HNSWLibArgs } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { App, TFolder, TFile, normalizePath } from "obsidian";

import VectorStore from "./VectorStore";
import EmbeddingEncoder from "./EmbeddingEncoder";
import { assert } from "console";
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
	private readonly storagePath = normalizePath(".arcana");
	private vectorStorePath = normalizePath(".arcana/vectorstore.json");
	private storageFolder: TFolder;

	private vectorStore: VectorStore;

	constructor(app: App, apiKey: string) {
		this.app = app;
		this.apiKey = apiKey;
		this.openAI = new OpenAI({ openAIApiKey: this.apiKey });
	}

	async init() {
		await this.setupStorage();

		app.vault.on("create", (file: TFile) => {
			this.vectorStore.addDocument(file.path);
		});
		app.vault.on("delete", (file: TFile) => {
			this.vectorStore.removeDocument(file.path);
		});
		app.vault.on("rename", (file: TFile, oldPath: string) => {
			this.vectorStore.renameDocument(file.path, oldPath);
		});
		app.vault.on("modify", (file: TFile) => {
			this.vectorStore.updateDocument(file.path);
		});
	}

	private async setupStorage() {
		// Setup the storage folder

		// Create storage folder if it doesn't exist
		await app.vault.adapter.exists(this.storagePath).then((exists) => {
			if (!exists) {
				app.vault.adapter.mkdir(this.storagePath);
			}
		});

		// Create the Vector Store
		app.vault.adapter.getResourcePath(this.storagePath) +
			this.vectorStorePath;
		this.vectorStore = new VectorStore("deleteME.json");
	}

	public async requestNewEmbedding(file: TFile) {
		// Get the embedding for the file
		const text = await this.app.vault.read(file);
		const embedding = new OpenAIEmbeddings({ openAIApiKey: this.apiKey });
		const res = (await embedding.embedDocuments([text]))[0];

		// Save it in the vector store

		await this.app.fileManager.processFrontMatter(file, (frontMatter) => {
			const encoded = EmbeddingEncoder.encode(res);
			frontMatter.arcana = {
				embedding: encoded,
			};
			assert(EmbeddingEncoder.decode(encoded) === res);
			return frontMatter;
		});
	}

	public async destruct() {
		await this.vectorStore.saveStore();
	}
}
