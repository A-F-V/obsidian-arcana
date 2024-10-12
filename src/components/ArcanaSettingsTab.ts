import { App, Plugin, PluginSettingTab } from 'obsidian';
import SettingsSection from './SettingsSection';

export default class ArcanaSettingsTab extends PluginSettingTab {
  plugin: Plugin;
  sections: SettingsSection<any>[];

  constructor(
    app: App,
    plugin: Plugin,
    sections: SettingsSection<any>[] // TODO: Type this more narrowly
  ) {
    super(app, plugin);
    this.plugin = plugin;
    this.sections = sections;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h1', { text: 'Arcana' });

    for (const section of this.sections) {
      containerEl.createEl('h2', { text: section.sectionTitle });
      section.display(containerEl);
    }
  }
}
