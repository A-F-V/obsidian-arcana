import { Setting, TFile } from 'obsidian';
import AIFeed from 'src/AIFeed';
import ViewPluginBase from 'src/components/ViewPluginBase';
import ArcanaPlugin from 'src/main';
import { SocratesView } from 'src/plugins/Socrates/SocratesView';
import { removeFrontMatter } from 'src/utilities/DocumentCleaner';
import store from './AgentState';
import { AgentData } from './ConversationAgent';
import {
  EdenTextToSpeechParams,
  TextToSpeechProvider,
} from 'src/include/TextToSpeech';
import { merge } from 'src/include/Functional';

interface SocratesSettings {
  priorInstruction: string;
  agent_folder: string;
  // Speech to Text
  autoSendTranscription: boolean;
  // Text to Speech
  ttsParams: EdenTextToSpeechParams;
}

const defaultSocratesSettings: SocratesSettings = {
  priorInstruction: '',
  agent_folder: 'Arcana/Agents',
  autoSendTranscription: false,
  ttsParams: {
    provider: 'google',
    rate: 0,
    pitch: 0,
    model: 'en-GB-Neural2-D',
    language: 'en-GB',
  },
};
export default class SocratesPlugin extends ViewPluginBase {
  private settings: SocratesSettings = defaultSocratesSettings;

  private getSocratesPriorInstruction(): string {
    return this.settings.priorInstruction;
  }
  private getSocratesAutoSendTranscription(): boolean {
    return this.settings.autoSendTranscription;
  }

  private getSocratesTTSParams(): EdenTextToSpeechParams {
    return this.settings.ttsParams;
  }

  private getAgentFolder(): string {
    return this.settings.agent_folder;
  }

  public async onload(): Promise<void> {
    await super.onload();

    this.settings = merge(
      this.arcana.settings.PluginSettings['Socrates'],
      defaultSocratesSettings
    );

    this.settings.ttsParams ??= defaultSocratesSettings.ttsParams;
  }

  public addSettings(containerEl: HTMLElement) {
    containerEl.createEl('h1', { text: 'Socrates' });

    new Setting(containerEl)
      .setName('Conversation Agent Folder')
      .setDesc('The folder from which to load conversation agent templates.')
      .addText(text => {
        text
          .setPlaceholder('')
          .setValue(this.settings.agent_folder)
          .onChange(async (value: string) => {
            this.settings.agent_folder = value;
            this.arcana.settings.PluginSettings['Socrates'] = this.settings;
            await this.arcana.saveSettings();
          });
      });

    containerEl.createEl('h3', { text: 'Socrates Agent Settings' });

    const saveSocratesAgent = async () => {
      this.arcana.settings.PluginSettings['Socrates'] = this.settings;
      await this.arcana.saveSettings();
      store.dispatch({
        type: 'agent/update',
        agent: this.getSocrates(),
        old_name: 'Socrates',
      });
    };
    new Setting(containerEl)
      .setName("Socrates's System Message")
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
    // Speech to Text
    containerEl.createEl('h4', { text: 'Speech to Text' });

    new Setting(containerEl)
      .setName("Automatically Send Socrates' transcription")
      .setDesc(
        "Whether to automatically send Socrates' transcription after recording"
      )
      .addToggle(toggle => {
        toggle
          .setValue(
            this.settings.autoSendTranscription ??
              defaultSocratesSettings.autoSendTranscription
          )
          .onChange(async (value: boolean) => {
            this.settings.autoSendTranscription = value;
            await saveSocratesAgent();
          });
      });
    // Text to Speech
    containerEl.createEl('h4', { text: 'Text to Speech (TTS)' });

    new Setting(containerEl)
      .setName('TTS Provider')
      .setDesc('The provider to use for text to speech service')
      .addDropdown(dropdown => {
        dropdown
          .addOption('google', 'Google')
          .addOption('amazon', 'Amazon')
          .addOption('microsoft', 'Microsoft')
          .addOption('ibm', 'IBM')
          .setValue(this.settings.ttsParams.provider)
          .onChange(async (value: TextToSpeechProvider) => {
            this.settings.ttsParams.provider = value;
            await saveSocratesAgent();
          });
      });

    new Setting(containerEl)
      .setName('TTS Language')
      .setDesc('The language to use for text to speech service')
      .addDropdown(dropdown => {
        dropdown
          .addOption('en-GB', 'English (GB)')
          .addOption('en-US', 'English (US)')
          .setValue(this.settings.ttsParams.language)
          .onChange(async (value: string) => {
            this.settings.ttsParams.language = value;
            await saveSocratesAgent();
          });
      });

    new Setting(containerEl)
      .setName('TTS Voice')
      .setDesc(
        'The model to use for text to speech service. Look at `Supported Models` on https://docs.edenai.co/reference/audio_text_to_speech_create for supported models.'
      )
      .addText(text => {
        text
          .setPlaceholder('en-GB-Neural2-D')
          .setValue(this.settings.ttsParams.model)
          .onChange(async (value: string) => {
            this.settings.ttsParams.model = value;
            await saveSocratesAgent();
          });
      });

    new Setting(containerEl)
      .setName('TTS Speed Modifier')
      .setDesc(
        'The speed modifier to use for text to speech service from -100% to 100% of normal'
      )
      .addSlider(slider => {
        slider
          .setLimits(-100, 100, 1)
          .setValue(this.settings.ttsParams.rate)
          .onChange(async (value: number) => {
            this.settings.ttsParams.rate = value;
            await saveSocratesAgent();
          });
      });

    new Setting(containerEl)
      .setName('TTS Pitch Modifier')
      .setDesc(
        'The pitch modifier to use for text to speech service from -100% to 100% of normal'
      )
      .addSlider(slider => {
        slider
          .setLimits(-100, 100, 1)
          .setValue(this.settings.ttsParams.pitch)
          .onChange(async (value: number) => {
            this.settings.ttsParams.pitch = value;
            await saveSocratesAgent();
          });
      });

    /*
    new Setting(containerEl)
      .setName('With Web Search')
      .setDesc('Whether to give Socrates access to the web')
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.usingWeb)
          .onChange(async (value: boolean) => {
            this.settings.usingWeb = value;
            this.arcana.settings.PluginSettings['Socrates'] = this.settings;
            await this.arcana.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Serp API Token')
      .setDesc('The Serp API Token to use for web searches')
      .addText(text => {
        text
          .setValue(this.settings.serpApiToken)
          .onChange(async (value: string) => {
            this.settings.serpApiToken = value;
            this.arcana.settings.PluginSettings['Socrates'] = this.settings;
            await this.arcana.saveSettings();
          });
      });
    //.setDisabled(!this.settings.usingWeb);
    */
  }

  private getSocrates(): AgentData {
    return {
      name: 'Socrates',
      initialMessage: this.getSocratesPriorInstruction(),
      agentEmoji: '🤖',
      userEmoji: '😀',
      autoSendTranscription: this.getSocratesAutoSendTranscription(),
      ttsParams: this.getSocratesTTSParams(),
    };
  }

  constructor(arcana: ArcanaPlugin) {
    super(arcana, 'socrates-view', 'brain-cog', 'Socrates', () =>
      SocratesView(
        arcana,
        this.getAgentFolder.bind(this),
        this.getSocrates.bind(this)
      )
    );
  }
}
