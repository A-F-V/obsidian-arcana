import ArcanaPlugin from 'src/main';
import SettingsSection from './SettingsSection';

// Plugin Base for the Arcana plugins (not the main plugin)
export default abstract class ArcanaPluginBase<SettingsType> {
  abstract onload(): Promise<void>;
  abstract onunload(): Promise<void>;

  protected settings: SettingsType;
  protected arcana: ArcanaPlugin;

  public createSettingsSection(): SettingsSection<SettingsType> | null {
    return null;
  }
  // Default constructor
  public constructor(arcana: ArcanaPlugin, settings: SettingsType) {
    this.arcana = arcana;
    this.settings = settings;
  }
}
