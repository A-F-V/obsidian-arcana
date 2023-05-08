import { App, PluginSettingTab, Setting } from 'obsidian';
import ArcanaPlugin from '../main';

export default class ArcanaSettingsTab extends PluginSettingTab {
  plugin: ArcanaPlugin;

  constructor(app: App, plugin: ArcanaPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Arcana Settings' });

    new Setting(containerEl)
      .setName('OpenAI API Key')
      .setDesc('Your OpenAI API key')
      .addText(text =>
        text
          .setPlaceholder('OpenAI API Key')
          .setValue(this.plugin.settings.OPEN_AI_API_KEY)
          .onChange(async value => {
            this.plugin.settings.OPEN_AI_API_KEY = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Model Type')
      .setDesc('The model to use for generating text')
      .addDropdown(dropdown => {
        dropdown
          .addOption('gpt-3.5-turbo', 'GPT3.5')
          .addOption('gpt-4', 'GPT4')
          .setValue(this.plugin.settings.MODEL_TYPE)
          .onChange(async value => {
            this.plugin.settings.MODEL_TYPE = value;
            await this.plugin.saveSettings();
          });
      });

    // Add the settings for each plugin
    for (const plugin of this.plugin.plugins) {
      plugin.addSettings(containerEl);
    }
  }
}
