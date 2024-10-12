import { Plugin } from 'obsidian';

import ArcanaSettings, { defaultAgentSettings } from './include/ArcanaSettings';
import ArcanaSettingsTab, {
  AnyArcanaSettingSections as AnyArcanaSettingSections,
} from './components/ArcanaSettingsTab';
import { ArcanaAgent } from './include/ArcanaAgent';
import NostradamusPlugin from './plugins/Nostradamus/Nostradamus';
import ChristiePlugin from './plugins/Christie/Christie';
import FeynmanPlugin from './plugins/Feynman/Feynman';
import SocratesPlugin from './plugins/Socrates/SocratesPlugin';
import DarwinPlugin from './plugins/Darwin/Darwin';
import AIFeed from './AIFeed';
import { OpenAITextToSpeech } from './include/TextToSpeech';
import FordPlugin from './plugins/Ford/Ford';
import PoloPlugin from './plugins/Polo/Polo';
import AgentSettingsSection from './components/AgentSettingsSection';
import { AvailablePlugins, AvailablePluginTypes, defaultPluginSettings } from './plugins/AllPlugins';

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
  public speak: (text: string, settings: OpenAITextToSpeech) => Promise<HTMLAudioElement>;

  settings: ArcanaSettings;
  // TODO: Type this more narrowly
  plugins: Record<AvailablePlugins, AvailablePluginTypes>;

  async onload() {
    // Set up the settings
    await this.loadSettings();

    // Load the agent
    this.agent = new ArcanaAgent(this.settings.agentSettings);
    this.startFeed = this.agent.startFeed.bind(this.agent);
    this.complete = this.agent.complete.bind(this.agent);
    this.transcribe = this.agent.transcribe.bind(this.agent);
    this.speak = this.agent.speak.bind(this.agent);

    // Create the plugins:
    const ps = this.settings.pluginSettings;
    this.plugins = {
      christie: new ChristiePlugin(this, ps['christie']),
      darwin: new DarwinPlugin(this, ps['darwin']),
      feynman: new FeynmanPlugin(this, ps['feynman']),
      ford: new FordPlugin(this, ps['ford']),
      nostradamus: new NostradamusPlugin(this, ps['nostradamus']),
      polo: new PoloPlugin(this, ps['polo']),
      socrates: new SocratesPlugin(this, ps['socrates']),
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
    sections.push(new AgentSettingsSection(this.settings.agentSettings, this.getSettingSaver));

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
    // Unload plugins
    for (const plugin of Object.values(this.plugins)) {
      await plugin.onunload();
    }
    // Release resources
    for (const release of this.openResource) {
      release();
    }
  }

  async loadSettings() {
    const defaultSettings: ArcanaSettings = {
      agentSettings: defaultAgentSettings,
      pluginSettings: defaultPluginSettings,
    };

    // Assign or Merge?
    this.settings = Object.assign({}, defaultSettings, await this.loadData());

    // TODO: Validate the settings
  }

  registerResource(releaseMethod: () => void) {
    this.openResource.push(releaseMethod);
  }

  getSettingSaver() {
    // Currently only settings are saved.
    return (async () => await this.saveData(this.settings)).bind(this);
  }

  getAPIKey(): string {
    return this.settings.agentSettings.OPEN_AI_API_KEY;
  }

  getAIModel(): string {
    return this.settings.agentSettings.MODEL_TYPE;
  }
}
