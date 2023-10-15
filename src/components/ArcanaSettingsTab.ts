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

    containerEl.createEl('h3', { text: 'Arcana' });

    new Setting(containerEl)
      .setName('OpenAI API key')
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
      .setName('Model type')
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

    new Setting(containerEl)
      .setName('Temperature')
      .setDesc('The randomness of the generated text')
      .addSlider(slider =>
        slider
          .setLimits(0, 2, 0.01)
          .setValue(this.plugin.settings.TEMPERATURE)
          .onChange(async value => {
            this.plugin.settings.TEMPERATURE = value;
            await this.plugin.saveSettings();
          })
          .setDynamicTooltip()
          .showTooltip()
      );

    new Setting(containerEl)
      .setName('Top P')
      .setDesc('The diversity of the generated text')
      .addSlider(slider =>
        slider
          .setLimits(0, 1, 0.01)
          .setValue(this.plugin.settings.TOP_P)
          .onChange(async value => {
            this.plugin.settings.TOP_P = value;
            await this.plugin.saveSettings();
          })
          .setDynamicTooltip()
          .showTooltip()
      );
    // Create h2 for Text to Speech
    containerEl.createEl('h2', { text: 'Text to Speech' });

    new Setting(containerEl)
      .setName('Eden AI API key')
      .setDesc('Your Eden AI API key')
      .addText(text =>
        text
          .setPlaceholder('Eden AI API Key')
          .setValue(this.plugin.settings.EDEN_AI_API_KEY)
          .onChange(async value => {
            this.plugin.settings.EDEN_AI_API_KEY = value;
            await this.plugin.saveSettings();
          })
      );
    // Add the settings for each plugin
    for (const plugin of this.plugin.plugins) {
      plugin.addSettings(containerEl);
    }
  }
}
