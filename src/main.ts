import { Notice, Plugin, TFile } from 'obsidian';

import ArcanaSettings from './include/ArcanaSettings';
import ArcanaSettingsTab from './components/ArcanaSettingsTab';
import ArcanaAgent from './include/ArcanaAgent';
import ColumbusPlugin from './plugins/Columbus/Columbus';
import StorageManager from './include/StorageManager';
import NostradamusPlugin from './plugins/Nostradamus/Nostradamus';
import ShakespearePlugin from './plugins/Shakespeare/Shakespeares';
import SocratesPlugin from './plugins/Socrates/Socrates';
import FeynmanPlugin from './plugins/Feynman/Feynman';

const DEFAULT_SETTINGS: Partial<ArcanaSettings> = {
  OPEN_AI_API_KEY: '',
  MODEL_TYPE: 'gpt-3.5-turbo',
  PluginSettings: {},
};

export default class ArcanaPlugin extends Plugin {
  private agent: ArcanaAgent;

  fs: StorageManager;
  settings: ArcanaSettings;
  plugins = [
    new ColumbusPlugin(this),
    new NostradamusPlugin(this),
    new ShakespearePlugin(this),
    new SocratesPlugin(this),
    new FeynmanPlugin(this),
  ];

  async onload() {
    // Set up the settings
    await this.loadSettings();

    this.addSettingTab(new ArcanaSettingsTab(this.app, this));

    // Setup the storage first
    this.fs = new StorageManager(this);
    await this.fs.setupStorage();

    this.agent = new ArcanaAgent(this);

    this.addCommand({
      id: 'arcana-force-save',
      name: 'Force save',
      callback: async () => {
        await this.agent.save();
      },
    });

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

    await this.agent.save();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    // Currently only settings are saved.
    await this.saveData(this.settings);
  }

  async search(query: string, k: number): Promise<TFile[]> {
    return await this.agent.getKClosestDocuments(query, k);
  }

  startConversation(sysMessage: string) {
    return this.agent.startConversation(sysMessage);
  }

  async getFileID(file: TFile): Promise<number> {
    return await this.agent.getFileID(file);
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
