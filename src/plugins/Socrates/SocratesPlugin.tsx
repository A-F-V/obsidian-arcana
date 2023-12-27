import { Setting } from 'obsidian';
import ViewPluginBase from 'src/components/ViewPluginBase';
import ArcanaPlugin from 'src/main';
import { SocratesView } from 'src/plugins/Socrates/SocratesView';
import store from './AgentState';
import { AgentData } from './ConversationAgent';
import {
  OpenAITextToSpeechParams,
  OpenAIVoice,
} from 'src/include/TextToSpeech';
import { merge } from 'src/include/Functional';
import { MicrophoneContext, MicrophoneContextInfo } from 'src/hooks/context';
import React from 'react';

interface SocratesSettings {
  priorInstruction: string;
  agent_folder: string;
  // Speech to Text
  autoSendTranscription: boolean;
  // Text to Speech
  ttsParams: OpenAITextToSpeechParams;
  autoSpeakReply: boolean;
}

const defaultSocratesSettings: SocratesSettings = {
  priorInstruction: '',
  agent_folder: 'Arcana/Agents',
  autoSendTranscription: false,
  ttsParams: {
    voice: 'alloy',
    rate: 1,
  },
  autoSpeakReply: false,
};
export default class SocratesPlugin extends ViewPluginBase {
  private settings: SocratesSettings = defaultSocratesSettings;
  private currentMicrophone: MicrophoneContextInfo = {
    toggleMicrophone: () => {},
  };

  private getSocratesPriorInstruction(): string {
    return this.settings.priorInstruction;
  }
  private getSocratesAutoSendTranscription(): boolean {
    return this.settings.autoSendTranscription;
  }

  private getSocratesTTSParams(): OpenAITextToSpeechParams {
    return this.settings.ttsParams;
  }

  private getSocratesAutoSpeakReply(): boolean {
    return this.settings.autoSpeakReply;
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

    this.arcana.addCommand({
      id: 'activate-transcription',
      name: 'Toggle Microphone',
      callback: () => {
        console.debug(
          `activate-transcription command triggered\nCurrent microphone info is ${JSON.stringify(
            this.currentMicrophone
          )}`
        );
        this.currentMicrophone.toggleMicrophone();
      },
    });
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
      .setName('TTS Voice')
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
      .setName('TTS Speed Modifier')
      .setDesc(
        'The speed modifier to use for text to speech from 0.25x to 4x normal'
      )
      .addDropdown(dropdown => {
        dropdown
          .addOptions({
            '0.25': '0.25x',
            '0.5': '0.5x',
            '0.75': '0.75x',
            '1': '1x',
            '1.25': '1.25x',
            '1.5': '1.5x',
            '1.75': '1.75x',
            '2': '2x',
            '2.25': '2.25x',
            '2.5': '2.5x',
            '2.75': '2.75x',
            '3': '3x',
            '3.25': '3.25x',
            '3.5': '3.5x',
            '3.75': '3.75x',
            '4': '4x',
          })
          .setValue(String(this.settings.ttsParams.rate))
          .onChange(async (value: string) => {
            // Parse the value
            this.settings.ttsParams.rate = Number(value);
            await saveSocratesAgent();
          });
      });
    new Setting(containerEl)
      .setName('TTS Auto Speak Reply')
      .setDesc(
        'Whether to automatically speak the reply once Socrates has finished replying'
      )
      .addToggle(toggle => {
        toggle
          .setValue(this.settings.autoSpeakReply)
          .onChange(async (value: boolean) => {
            this.settings.autoSpeakReply = value;
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
      autoSpeakReply: this.getSocratesAutoSpeakReply(),
    };
  }

  constructor(arcana: ArcanaPlugin) {
    super(arcana, 'socrates-view', 'brain-cog', 'Socrates', () => {
      return (
        <React.StrictMode>
          <MicrophoneContext.Provider value={this.currentMicrophone}>
            {SocratesView(
              arcana,
              this.getAgentFolder.bind(this),
              this.getSocrates.bind(this)
            )}
          </MicrophoneContext.Provider>
        </React.StrictMode>
      );
    });
  }
}
