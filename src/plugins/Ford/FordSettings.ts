import SettingsSection from '@/components/SettingsSection';
import { Setting } from 'obsidian';

export interface FordSettings {
  folder: string;
}
export const defaultFordSettings: FordSettings = { folder: 'FordTemplates' };
export class FordSettingsSection extends SettingsSection<FordSettings> {
  public sectionTitle = 'Ford';

  display(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Ford template folder')
      .setDesc('The folder where templates are stored.')
      .addText(text => {
        text
          .setPlaceholder(defaultFordSettings.folder)
          .setValue(this.settings.folder)
          .onChange(async (value: string) => {
            this.settings.folder = value;
            await this.saveSettings();
          });
      });
  }
}
