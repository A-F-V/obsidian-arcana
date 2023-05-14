import { Plugin, TFile } from 'obsidian';

import ArcanaSettings from './include/ArcanaSettings';
import ArcanaSettingsTab from './components/ArcanaSettingsTab';
import { ArcanaAgent, ArcanaSearchResult } from './include/ArcanaAgent';
//import CarterPlugin from './plugins/Carter/Carter';
import StorageManager from './include/StorageManager';
import NostradamusPlugin from './plugins/Nostradamus/Nostradamus';
import ChristiePlugin from './plugins/Christie/Christie';
import FeynmanPlugin from './plugins/Feynman/Feynman';
import ArcanaPluginBase from './components/ArcanaPluginBase';
import SocratesPlugin from './plugins/Socrates/SocratesPlugin';
import DarwinPlugin from './plugins/Darwin/Darwin';

const DEFAULT_SETTINGS: Partial<ArcanaSettings> = {
  OPEN_AI_API_KEY: '',
  MODEL_TYPE: 'gpt-3.5-turbo',
  PluginSettings: {},
};

export default class ArcanaPlugin extends Plugin {
  private agent: ArcanaAgent;
  private openResource: (() => void)[] = [];

  fs: StorageManager;
  settings: ArcanaSettings;
  plugins: ArcanaPluginBase[] = [
    //new CarterPlugin(this),
    new SocratesPlugin(this),
    new NostradamusPlugin(this),
    new ChristiePlugin(this),
    new FeynmanPlugin(this),
    new DarwinPlugin(this),
  ];

  async onload() {
    // Set up the settings
    await this.loadSettings();

    this.addSettingTab(new ArcanaSettingsTab(this.app, this));

    // Add plugins
    for (const plugin of this.plugins) {
      await plugin.onload();
    }
  }

  async onunload() {
    // Unload plugins
    for (const plugin of this.plugins) {
      await plugin.onunload();
    }
    // Release resources
    for (const release of this.openResource) {
      release();
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  registerResource(releaseMethod: () => void) {
    this.openResource.push(releaseMethod);
  }

  async saveSettings() {
    // Currently only settings are saved.
    await this.saveData(this.settings);
  }

  startConversation(sysMessage: string) {
    return this.agent.startConversation(sysMessage);
  }

  async complete(
    query: string,
    ctx = 'A conversation with an AI for use in Obsidian.',
    handleTokens: (tokens: string) => void = () => {}
  ): Promise<string> {
    return await this.agent.complete(query, ctx, handleTokens);
  }

  getAPIKey(): string {
    return this.settings.OPEN_AI_API_KEY;
  }

  getAIModel(): string {
    return this.settings.MODEL_TYPE;
  }
}
