import { Notice, Plugin } from "obsidian";

import ArcanaSettings from "./include/ArcanaSettings";
import ArcanaSettingsTab from "./components/ArcanaSettingsTab";
import ArcanaAgent from "./include/AIAgent";

const DEFAULT_SETTINGS: Partial<ArcanaSettings> = {
	OPEN_AI_API_KEY: "",
};

export default class ArcanaPlugin extends Plugin {
	settings: ArcanaSettings;
	agent: ArcanaAgent;

	async onload() {
		// Set up the settings
		await this.loadSettings();
		new Notice("Arcana plugin loaded");
		new Notice("API key: " + this.settings.OPEN_AI_API_KEY);
		this.addSettingTab(new ArcanaSettingsTab(this.app, this));

		// Check if the API key is correct with OpenAI by issuing a request
		this.agent = new ArcanaAgent(this.app, this.settings.OPEN_AI_API_KEY);
		await this.agent.testAPIKey();
	}

	onunload() {
		console.log("Unloading plugin");
		this.agent.saveVectorStore();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
