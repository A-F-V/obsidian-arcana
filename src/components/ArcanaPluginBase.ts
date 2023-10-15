import ArcanaPlugin from 'src/main';

// Plugin Base for the Arcana plugins (not the main plugin)
export default abstract class ArcanaPluginBase {
  abstract onload(): Promise<void>;
  abstract onunload(): Promise<void>;
  // Override this to add settings
  addSettings(containerEl: HTMLElement) {}

  // Default constructor
  protected arcana: ArcanaPlugin;
  public constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
  }
}
