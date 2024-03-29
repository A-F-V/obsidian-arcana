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
  socratesMemorySize: number;
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
  socratesMemorySize: 10,
  ttsParams: {
    voice: 'alloy',
    rate: 1.0,
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

  private getSocratesMemorySize(): number {
    return this.settings.socratesMemorySize;
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
      name: 'Toggle Chat Agent Microphone',
      // Alt + R
      hotkeys: [{ modifiers: ['Alt'], key: 'r' }],
      callback: () => {
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

    new Setting(containerEl)
      .setName("Socrates's Memory Size")
      .setDesc(
        'The most recent number of messages to remember. Fewer is faster and cheaper but less accurate.'
      )
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
        'The speed modifier to use for text to speech relative to normal'
      )
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
      memorySize: this.getSocratesMemorySize(),
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
