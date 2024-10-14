import { OpenAITextToSpeechParams, OpenAIVoice } from '@/include/ai/TextToSpeech';
import SettingsSection from '@/components/SettingsSection';
import { Setting } from 'obsidian';

export interface SocratesSettings {
  priorInstruction: string;
  agent_folder: string;
  socratesMemorySize: number;
  // Speech to Text
  autoSendTranscription: boolean;
  // Text to Speech
  ttsParams: OpenAITextToSpeechParams;
  autoSpeakReply: boolean;
}
export const defaultSocratesSettings: SocratesSettings = {
  priorInstruction: '',
  agent_folder: 'Arcana/Agents',
  autoSendTranscription: false,
  socratesMemorySize: 10,
  ttsParams: {
    voice: 'alloy',
    rate: 1.0,
  },
  autoSpeakReply: false,
};
export class SocratesSettingsSection extends SettingsSection<SocratesSettings> {
  public sectionTitle = 'Socrates';
  private onSocratesChange: () => void;

  constructor(settings: SocratesSettings, saveSettings: () => Promise<void>, onSocratesChange: () => void) {
    super(settings, saveSettings);
    this.onSocratesChange = onSocratesChange;
  }

  display(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Conversation agent folder')
      .setDesc('The folder from which to load conversation agent templates.')
      .addText(text => {
        text
          .setPlaceholder('')
          .setValue(this.settings.agent_folder)
          .onChange(async (value: string) => {
            this.settings.agent_folder = value;
            await this.saveSettings();
          });
      });

    new Setting(containerEl).setName('Socrates agent settings').setHeading();

    const saveSocratesAgent = async () => {
      await this.saveSettings();
      this.onSocratesChange();
    };
    new Setting(containerEl)
      .setName("Socrates's system message")
      .setDesc('The prior instruction given to Socrates')
      .addTextArea(text => {
        text
          .setPlaceholder('')
          .setValue(this.settings.priorInstruction)
          .onChange(async (value: string) => {
            this.settings.priorInstruction = value;
            await saveSocratesAgent();
          });
      });

    new Setting(containerEl)
      .setName("Socrates's memory size")
      .setDesc('The most recent number of messages to remember. Fewer is faster and cheaper but less accurate.')
      .addSlider(slider => {
        slider
          .setLimits(0, 100, 1)
          .setValue(this.settings.socratesMemorySize)
          .onChange(async (value: number) => {
            this.settings.socratesMemorySize = value;
            await saveSocratesAgent();
          })
          .setDynamicTooltip()
          .showTooltip();
      });
    // Speech to Text
    new Setting(containerEl).setName('Speech to text').setHeading();

    new Setting(containerEl)
      .setName('Automatically send transcription')
      .setDesc("Whether to automatically send Socrates' transcription after recording")
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.autoSendTranscription ?? defaultSocratesSettings.autoSendTranscription)
          .onChange(async (value: boolean) => {
            this.settings.autoSendTranscription = value;
            await saveSocratesAgent();
          });
      });
    // Text to Speech
    new Setting(containerEl).setName('Text to speech (TTS)').setHeading();

    new Setting(containerEl)
      .setName('TTS voice')
      .setDesc('The voice to use for text to speech')
      .addDropdown(dropdown => {
        dropdown
          .addOption('alloy', 'Alloy')
          .addOption('echo', 'Echo')
          .addOption('fable', 'Fable')
          .addOption('onyx', 'Onyx')
          .addOption('nova', 'Nova')
          .addOption('shimmer', 'Shimmer')
          .setValue(this.settings.ttsParams.voice)
          .onChange(async (value: OpenAIVoice) => {
            this.settings.ttsParams.voice = value;
            await saveSocratesAgent();
          });
      });

    new Setting(containerEl)
      .setName('TTS speed modifier')
      .setDesc('The speed modifier to use for text to speech relative to normal')
      .addDropdown(dropdown => {
        dropdown
          .addOptions({
            [(0.25).toFixed(2)]: '0.25x',
            [(0.5).toFixed(2)]: '0.5x',
            [(0.75).toFixed(2)]: '0.75x',
            [(1.0).toFixed(2)]: '1.0x',
            [(1.25).toFixed(2)]: '1.25x',
            [(1.5).toFixed(2)]: '1.5x',
            [(1.75).toFixed(2)]: '1.75x',
            [(2.0).toFixed(2)]: '2.0x',
            [(2.25).toFixed(2)]: '2.25x',
            [(2.5).toFixed(2)]: '2.5x',
            [(2.75).toFixed(2)]: '2.75x',
            [(3.0).toFixed(2)]: '3.0x',
          })
          .setValue(
            // Take number and convert to strin
            this.settings.ttsParams.rate.toFixed(2)
          )
          .onChange(async (value: string) => {
            // Parse the value
            this.settings.ttsParams.rate = Number(value);
            await saveSocratesAgent();
          });
      });
    new Setting(containerEl)
      .setName('TTS auto speak reply')
      .setDesc('Whether to automatically speak the reply once Socrates has finished replying')
      .addToggle(toggle => {
        toggle.setValue(this.settings.autoSpeakReply).onChange(async (value: boolean) => {
          this.settings.autoSpeakReply = value;
          await saveSocratesAgent();
        });
      });
  }
}
