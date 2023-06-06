import { Setting, TFile } from 'obsidian';
import ViewPluginBase from 'src/components/ViewPluginBase';
import ArcanaPlugin from 'src/main';
import { SocratesView } from 'src/plugins/Socrates/SocratesView';
import { removeFrontMatter } from 'src/utilities/DocumentCleaner';

export default class SocratesPlugin extends ViewPluginBase {
  private priorInstruction = '';

  private getPriorInstruction(): string {
    return this.priorInstruction;
  }

  public async onload(): Promise<void> {
    await super.onload();
    this.priorInstruction =
      this.arcana.settings.PluginSettings['Socrates']?.priorInstruction ?? '';
  }

  public addSettings(containerEl: HTMLElement) {
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
      SocratesView(this.getPriorInstruction.bind(this))
    );
  }
}
