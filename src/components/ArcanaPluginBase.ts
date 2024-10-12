import { ArcanaAgent } from '@/include/ArcanaAgent';
import SettingsSection from './SettingsSection';
import { App, Plugin } from 'obsidian';

// Plugin Base for the Arcana plugins (not the main plugin)
export default abstract class ArcanaPluginBase<SettingsType> {
  abstract onload(): Promise<void>;
  abstract onunload(): Promise<void>;

  protected settings: SettingsType;
  protected saveSettings: () => Promise<void>;
  protected agent: ArcanaAgent;
  protected plugin: Plugin;
  protected app: App;
  public createSettingsSection(): SettingsSection<SettingsType> | null {
    return null;
  }
  // Default constructor
  public constructor(agent: ArcanaAgent, plugin: Plugin, settings: SettingsType, saveSettings: () => Promise<void>) {
    this.agent = agent;
    this.plugin = plugin;
    this.app = plugin.app;
    this.settings = settings;
    this.saveSettings = saveSettings;
  }
}
