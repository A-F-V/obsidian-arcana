import SettingsSection from '@/components/SettingsSection';
import { Setting } from 'obsidian';

export interface FeynmanSettings {
  folder: string;
}
export const defaultFeynmanSettings: FeynmanSettings = {
  folder: 'FeynmanFlashcards',
};
export class FeynmanSettingsSection extends SettingsSection<FeynmanSettings> {
  public sectionTitle = 'Feynman';
  public display(containerEl: HTMLElement): void {
    containerEl.createEl('h1', { text: 'Feynman' });
    new Setting(containerEl)
      .setName('Feynman flashcard folder')
      .setDesc('The folder where the flashcards will be stored')
      .addText(text => {
        text
          .setPlaceholder('Flashcards')
          .setValue(this.settings.folder)
          .onChange(async (value: string) => {
            this.settings.folder = value;
            await this.saveSettings();
          });
      });
  }
}
