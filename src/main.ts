import { Plugin } from 'obsidian';

import ArcanaSettings, { defaultAgentSettings } from './include/ArcanaSettings';
import ArcanaSettingsTab, {
  AnyArcanaSettingSections as AnyArcanaSettingSections,
} from './components/ArcanaSettingsTab';
import { ArcanaAgent } from './include/ai/ArcanaAgent';

import NostradamusPlugin from './plugins/Nostradamus/Nostradamus';
import ChristiePlugin from './plugins/Christie/Christie';
import FeynmanPlugin from './plugins/Feynman/Feynman';
import SocratesPlugin from './plugins/Socrates/SocratesPlugin';
import DarwinPlugin from './plugins/Darwin/Darwin';
import FordPlugin from './plugins/Ford/Ford';
import PoloPlugin from './plugins/Polo/Polo';

import AgentSettingsSection from './components/AgentSettingsSection';
import {
  AvailablePlugins,
  AvailablePluginSettingsTypes,
  AvailablePluginTypes,
  defaultPluginSettings,
} from './plugins/AllPlugins';

export default class ArcanaPlugin extends Plugin {
  private agent: ArcanaAgent;
  private settings: ArcanaSettings;
  private plugins: Record<AvailablePlugins, AvailablePluginTypes>;

  private makePlugin<T extends AvailablePluginTypes, S extends AvailablePluginSettingsTypes>(
    constructor: new (agent: ArcanaAgent, plugin: Plugin, settings: S, saveSettings: () => Promise<void>) => T,
    settings: S
  ): T {
    return new constructor(this.agent, this, settings, this.saveSettings.bind(this));
  }

  async onload() {
    // Load the settings
    await this.loadSettings();

    // Load the agent
    this.agent = new ArcanaAgent(this.settings.agentSettings);

    // Create the plugins:
    const ps = this.settings.pluginSettings;
    this.plugins = {
      socrates: this.makePlugin(SocratesPlugin, ps['socrates']),
      christie: this.makePlugin(ChristiePlugin, ps['christie']),
      darwin: this.makePlugin(DarwinPlugin, ps['darwin']),
      feynman: this.makePlugin(FeynmanPlugin, ps['feynman']),
      ford: this.makePlugin(FordPlugin, ps['ford']),
      polo: this.makePlugin(PoloPlugin, ps['polo']),
      nostradamus: this.makePlugin(NostradamusPlugin, ps['nostradamus']),
    };
    // Setup the settings tab
    this.setupSettingsTab();
    // Add plugins
    for (const plugin of Object.values(this.plugins)) {
      await plugin.onload();
    }
  }

  private setupSettingsTab() {
    const sections: AnyArcanaSettingSections[] = [];

    // Agent goes on top
    sections.push(new AgentSettingsSection(this.settings.agentSettings, this.saveSettings));

    // Plugins get added in order they are declared
    for (const plugin of Object.values(this.plugins)) {
      const section = plugin.createSettingsSection();
      if (section) {
        sections.push(section);
      }
    }

    this.addSettingTab(new ArcanaSettingsTab(this.app, this, sections));
  }

  async onunload() {
    // Save settings again in case they changed
    await this.saveSettings();
    // Unload plugins
    for (const plugin of Object.values(this.plugins)) {
      await plugin.onunload();
    }
  }

  async loadSettings() {
    const defaultSettings: ArcanaSettings = {
      agentSettings: defaultAgentSettings,
      pluginSettings: defaultPluginSettings,
    };

    this.settings = Object.assign({}, defaultSettings, await this.loadData());

    // TODO: Validate the settings
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
