// Plugin Base for the Arcana plugins (not the main plugin)
export default abstract class ArcanaPluginBase {
  abstract onload(): Promise<void>;
  abstract onunload(): Promise<void>;
  // Override this to add settings
  addSettings(containerEl: HTMLElement) {}
}
