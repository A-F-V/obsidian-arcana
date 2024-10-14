import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import SettingsSection from './SettingsSection';
import { AvailablePlugins, AvailablePluginSettings } from '@/plugins/AllPlugins';
import { AgentSettings } from '@/include/ArcanaSettings';

export type AnyArcanaSettingSections = SettingsSection<AvailablePluginSettings[AvailablePlugins] | AgentSettings>;

export default class ArcanaSettingsTab extends PluginSettingTab {
  plugin: Plugin;
  sections: AnyArcanaSettingSections[];

  constructor(app: App, plugin: Plugin, sections: AnyArcanaSettingSections[]) {
    super(app, plugin);
    this.plugin = plugin;
    this.sections = sections;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl).setName('Arcana AI').setHeading();

    for (const section of this.sections) {
      new Setting(containerEl).setName(section.sectionTitle).setHeading();
      section.display(containerEl);
    }
  }
}
