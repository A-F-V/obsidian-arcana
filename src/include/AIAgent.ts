import { OpenAI } from "langchain";
import { HNSWLib, HNSWLibArgs } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

import { App, TFolder, normalizePath } from "obsidian";

export default class ArcanaAgent {
	private app: App;
	private openAI: OpenAI;
	private apiKey: string;
	private readonly storagePath = normalizePath("arcana");
	private readonly vectorStorePath = normalizePath("arcana/vectorstore");
	private storageFolder: TFolder;
	private vectorStore: HNSWLib;

	constructor(app: App, apiKey: string) {
		this.app = app;
		this.apiKey = apiKey;
		this.openAI = new OpenAI({ openAIApiKey: this.apiKey });

		this.setupStorage();
	}

	setupStorage(): void {
		// Setup the storage folder
		const folder = app.vault.getAbstractFileByPath(this.storagePath);

		if (!folder) {
			app.vault.createFolder(this.storagePath);
		}

		this.storageFolder = app.vault.getAbstractFileByPath(
			this.storagePath
		) as TFolder;

		// Setup the vector store
		const embeddings = new OpenAIEmbeddings();

		const vectorStoreFile = app.vault.getAbstractFileByPath(
			this.vectorStorePath
		);
		if (vectorStoreFile) {
			HNSWLib.load(vectorStoreFile.path, embeddings).then(
				(vectorStore) => {
					this.vectorStore = vectorStore;
				}
			);
		} else {
			this.vectorStore = new HNSWLib(embeddings, {
				space: "cosine",
			} as HNSWLibArgs);
		}
	}

	async saveVectorStore(): Promise<void> {
		await this.vectorStore.save(this.vectorStorePath);
	}

	async testAPIKey(): Promise<boolean> {
		// TODO:
		return false;
	}
}
