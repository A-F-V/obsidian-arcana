import SettingsSection from '@/components/SettingsSection';
import { Setting } from 'obsidian';

export interface PoloSettings {
  priorInstruction: string;
  showFilesInFolderStructure: boolean;
  showFileContent: boolean;
}
export const defaultPoloSettings: PoloSettings = {
  priorInstruction: '',
  showFilesInFolderStructure: false,
  showFileContent: false,
};
export class PoloSettingsSection extends SettingsSection<PoloSettings> {
  public sectionTitle = 'Polo';

  display(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("Polo's additional context")
      .setDesc('The prior instruction given to Polo')
      .addTextArea(text => {
        text
          .setPlaceholder('')
          .setValue(this.settings.priorInstruction)
          .onChange(async (value: string) => {
            this.settings.priorInstruction = value;
            await this.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Show files in folder structure')
      .setDesc('Whether to show files in the folder structure (costs more tokens)')
      .addToggle(toggle => {
        toggle.setValue(this.settings.showFilesInFolderStructure).onChange(async (value: boolean) => {
          this.settings.showFilesInFolderStructure = value;
          await this.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Show file content')
      .setDesc('Whether to show the contents of files (costs more tokens)')
      .addToggle(toggle => {
        toggle.setValue(this.settings.showFileContent).onChange(async (value: boolean) => {
          this.settings.showFileContent = value;
          await this.saveSettings();
        });
      });
  }
}
