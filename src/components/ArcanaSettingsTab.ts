import { App, PluginSettingTab, Setting } from "obsidian";
import ArcanaPlugin from "../main";

export default class ArcanaSettingsTab extends PluginSettingTab {
	plugin: ArcanaPlugin;

	constructor(app: App, plugin: ArcanaPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		console.log("ArcanaSettingsTab constructor called");
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Arcana Settings" });

		new Setting(containerEl)
			.setName("OpenAI API Key")
			.setDesc("Your OpenAI API key")
			.addText((text) =>
				text
					.setPlaceholder("OpenAI API Key")
					.setValue(this.plugin.settings.OPEN_AI_API_KEY)
					.onChange(async (value) => {
						this.plugin.settings.OPEN_AI_API_KEY = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
