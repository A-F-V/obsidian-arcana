import SettingsSection from '@/components/SettingsSection';
import { Setting } from 'obsidian';
import { ChristieSettings } from './ChristieSettings';

export interface ChristieSettings {
  priorInstruction: string;
}
export class ChristieSettingsSection extends SettingsSection<ChristieSettings> {
  public sectionTitle = 'Christie';
  public display(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("Christie's system message")
      .setDesc('The prior instruction given to Christie')
      .addTextArea(text => {
        text
          .setPlaceholder('')
          .setValue(this.settings.priorInstruction)
          .onChange(async (value: string) => {
            this.settings.priorInstruction = value;
            await this.saveSettings();
          });
      });
  }
}
export const defaultChristieSettings: ChristieSettings = {
  priorInstruction: '',
};
