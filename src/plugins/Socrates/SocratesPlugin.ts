import { Setting, TFile } from 'obsidian';
import ViewPluginBase from 'src/components/ViewPluginBase';
import ArcanaPlugin from 'src/main';
import { SocratesView } from 'src/plugins/Socrates/SocratesView';
import { removeFrontMatter } from 'src/utilities/DocumentCleaner';

export default class SocratesPlugin extends ViewPluginBase {
  private priorInstruction = '';

  private async createSystemMessage(
    arcana: ArcanaPlugin,
    file: TFile
  ): Promise<string> {
    let text = await arcana.app.vault.read(file);
    text = removeFrontMatter(text);
    const title = file.basename;
    console.log(`Prior instruction: ${this.priorInstruction}`);
    return `The user has presented you with a file called ${title}. The file contains the following text:\n ${text}.\n${this.priorInstruction}`;
  }

  public addSettings(containerEl: HTMLElement) {
    this.priorInstruction =
      this.arcana.settings.PluginSettings['Socrates']?.priorInstruction ?? '';

    containerEl.createEl('h2', { text: 'Socrates Think' });
    new Setting(containerEl)
      .setName("Socrates's System Message")
      .setDesc('The prior instruction given to Socrates')
      .addTextArea(text => {
        text
          .setPlaceholder('')
          .setValue(this.priorInstruction)
          .onChange(async (value: string) => {
            this.priorInstruction = value;
            this.arcana.settings.PluginSettings['Socrates'] = {
              priorInstruction: value,
            };
            await this.arcana.saveSettings();
          });
      });
  }

  constructor(arcana: ArcanaPlugin) {
    super(arcana, 'socrates-view', 'brain-cog', 'Socrates', () =>
      SocratesView(this.createSystemMessage.bind(this, arcana))
    );
  }
}
