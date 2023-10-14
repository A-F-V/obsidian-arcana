import { Plugin } from 'obsidian';

import ArcanaSettings from './include/ArcanaSettings';
import ArcanaSettingsTab from './components/ArcanaSettingsTab';
import { ArcanaAgent } from './include/ArcanaAgent';
//import CarterPlugin from './plugins/Carter/Carter';
import StorageManager from './include/StorageManager';
import NostradamusPlugin from './plugins/Nostradamus/Nostradamus';
import ChristiePlugin from './plugins/Christie/Christie';
import FeynmanPlugin from './plugins/Feynman/Feynman';
import ArcanaPluginBase from './components/ArcanaPluginBase';
import SocratesPlugin from './plugins/Socrates/SocratesPlugin';
import DarwinPlugin from './plugins/Darwin/Darwin';
import AIFeed from './AIFeed';

const DEFAULT_SETTINGS: Partial<ArcanaSettings> = {
  OPEN_AI_API_KEY: '',
  MODEL_TYPE: 'gpt-3.5-turbo',
  TEMPERATURE: 0.7,
  TOP_P: 1,
  PluginSettings: {},
};

export default class ArcanaPlugin extends Plugin {
  private agent: ArcanaAgent;
  private openResource: (() => void)[] = [];
  public startFeed: (conversationContext: string) => AIFeed;
  public complete: (
    query: string,
    ctx?: string,
    handleTokens?: (tokens: string) => void,
    aborter?: () => boolean
  ) => Promise<string>;
  public transcribe: (file: File) => Promise<string>;

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
    // Load the agent
    this.agent = new ArcanaAgent(this);
    this.startFeed = this.agent.startFeed.bind(this.agent);
    this.complete = this.agent.complete.bind(this.agent);
    this.transcribe = this.agent.transcribe.bind(this.agent);

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

  getAPIKey(): string {
    return this.settings.OPEN_AI_API_KEY;
  }

  getAIModel(): string {
    return this.settings.MODEL_TYPE;
  }
}
