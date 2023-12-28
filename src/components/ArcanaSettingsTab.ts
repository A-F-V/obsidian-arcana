import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import ArcanaPlugin from '../main';
import { AvailableModels } from 'src/include/ArcanaSettings';

export default class ArcanaSettingsTab extends PluginSettingTab {
  plugin: ArcanaPlugin;

  constructor(app: App, plugin: ArcanaPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h1', { text: 'Arcana' });

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
      )
      .addButton(button => {
        button.setButtonText('Test Key').onClick(() => {
          this.plugin
            .complete('Ping (you say "Pong")')
            .then((result: string) => {
              if (result === 'Pong') {
                new Notice('Key is valid');
              } else {
                new Notice('Key is valid but API is not responding correctly');
              }
            }); // The catch case is handled by the complete failing
        });
      });

    new Setting(containerEl)
      .setName('Model type')
      .setDesc('The model to use for generating text')
      .addDropdown(dropdown => {
        dropdown
          .addOption('gpt-3.5-turbo', 'GPT3.5')
          .addOption('gpt-4-1106-preview', 'GPT4')
          .setValue(this.plugin.settings.MODEL_TYPE)
          .onChange(async value => {
            this.plugin.settings.MODEL_TYPE = value as AvailableModels;
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
    // Add the settings for each plugin
    for (const plugin of this.plugin.plugins) {
      plugin.addSettings(containerEl);
    }
  }
}
