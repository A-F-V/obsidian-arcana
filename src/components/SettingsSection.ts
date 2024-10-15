export default abstract class SettingsSection<T> {
  public abstract sectionTitle: string;
  protected settings: T;
  protected saveSettings: () => Promise<void>;
  constructor(settings: T, saveSettings: () => Promise<void>) {
    this.settings = settings;
    this.saveSettings = saveSettings;
  }

  abstract display(sectionContainer: HTMLElement): void;
}
