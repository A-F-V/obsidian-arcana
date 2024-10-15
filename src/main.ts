import { Plugin } from 'obsidian';

import ArcanaSettings, { defaultAgentSettings } from './include/ArcanaSettings';
import ArcanaSettingsTab, {
  AnyArcanaSettingSections as AnyArcanaSettingSections,
} from './components/ArcanaSettingsTab';
import { AIAgent } from './include/ai/AI';

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
  private agent: AIAgent;
  private settings: ArcanaSettings;
  private plugins: Record<AvailablePlugins, AvailablePluginTypes>;

  private makePlugin<T extends AvailablePluginTypes, S extends AvailablePluginSettingsTypes>(
    constructor: new (agent: AIAgent, plugin: Plugin, settings: S, saveSettings: () => Promise<void>) => T,
    settings: S
  ): T {
    return new constructor(this.agent, this, settings, this.saveSettings.bind(this));
  }

  async onload() {
    console.time('loadSetting');
    // Load the settings
    await this.loadSettings();
    console.timeEnd('loadSetting');

    console.time('loadAgent');
    // Load the agent
    this.agent = new AIAgent(this.settings.agentSettings);
    console.timeEnd('loadAgent');

    console.time('createPlugins');
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
    console.timeEnd('createPlugins');

    console.time('setupSettingsTab');
    // Setup the settings tab
    this.setupSettingsTab();
    console.timeEnd('setupSettingsTab');

    console.time('loadPlugins');
    // Add plugins

    for (const [name, plugin] of Object.entries(this.plugins)) {
      console.time(`loadPlugin: ${name}`);
      this.app.workspace.onLayoutReady(() => {
        plugin.onload();
      });
      console.timeEnd(`loadPlugin: ${name}`);
    }

    console.timeEnd('loadPlugins');
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
