import { Notice, Plugin } from 'obsidian';

import ArcanaSettings from './include/ArcanaSettings';
import ArcanaSettingsTab from './components/ArcanaSettingsTab';
import ArcanaAgent from './include/AIAgent';
import Polaris from './plugins/Polaris/Polaris';

const DEFAULT_SETTINGS: Partial<ArcanaSettings> = {
  OPEN_AI_API_KEY: '',
};

export default class ArcanaPlugin extends Plugin {
  settings: ArcanaSettings;
  agent: ArcanaAgent;
  plugins: any[];

  async onload() {
    // Set up the settings
    await this.loadSettings();

    this.addSettingTab(new ArcanaSettingsTab(this.app, this));

    // Check if the API key is correct with OpenAI by issuing a request
    this.agent = new ArcanaAgent(this.app, this.settings.OPEN_AI_API_KEY);
    await this.agent.init();

    // Set up the commands
    this.addCommand({
      id: 'arcana-request-embedding-for-current-file',
      name: 'Request embedding for current file',
      callback: () => {
        const currentFile = app.workspace.getActiveFile();
        if (!currentFile) {
          new Notice('No file is currently open');
          return;
        } else {
          this.agent.requestNewEmbedding(currentFile);
        }
      },
    });

    this.addCommand({
      id: 'arcana-request-embedding-for-all-files',
      name: 'Request embedding for all files',
      callback: () => {
        this.app.vault.getMarkdownFiles().forEach(async file => {
          await this.agent.requestNewEmbedding(file);
        });
      },
    });

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
    await this.saveData(this.settings);
  }
}
