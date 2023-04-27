import { Notice, Plugin, TFile } from 'obsidian';

import ArcanaSettings from './include/ArcanaSettings';
import ArcanaSettingsTab from './components/ArcanaSettingsTab';
import ArcanaAgent from './include/ArcanaAgent';
import Polaris from './plugins/Polaris/Polaris';
import StorageManager from './include/StorageManager';

const DEFAULT_SETTINGS: Partial<ArcanaSettings> = {
  OPEN_AI_API_KEY: '',
};

export default class ArcanaPlugin extends Plugin {
  private agent: ArcanaAgent;

  fs: StorageManager;
  settings: ArcanaSettings;
  plugins: any[];

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
    this.plugins = [new Polaris(this)];
  }

  async onunload() {
    console.log('Unloading plugin');
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

  async complete(query: string): Promise<string> {
    return await this.agent.queryAndComplete(query);
  }

  getAPIKey(): string {
    return this.settings.OPEN_AI_API_KEY;
  }
}
