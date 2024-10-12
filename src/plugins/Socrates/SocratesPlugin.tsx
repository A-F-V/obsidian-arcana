import * as React from 'react';
import ViewPluginBase from 'src/components/ViewPluginBase';
import ArcanaPlugin from 'src/main';
import { SocratesView } from 'src/plugins/Socrates/SocratesView';
import store from './AgentState';
import { AgentData } from './ConversationAgent';
import { OpenAITextToSpeechParams } from 'src/include/TextToSpeech';
import { MicrophoneContext, MicrophoneContextInfo } from 'src/hooks/context';
import SettingsSection from '@/components/SettingsSection';
import { defaultSocratesSettings, SocratesSettings, SocratesSettingsSection } from './SocratesSettings';

export default class SocratesPlugin extends ViewPluginBase<SocratesSettings> {
  public createSettingsSection(): SettingsSection<SocratesSettings> {
    const onSocratesChange = () => {
      store.dispatch({
        type: 'agent/update',
        agent: this.getSocrates(),
        old_name: 'Socrates',
      });
    };
    return new SocratesSettingsSection(this.settings, this.arcana.getSettingSaver(), onSocratesChange.bind(this));
  }

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

    this.settings.ttsParams ??= defaultSocratesSettings.ttsParams;

    this.arcana.addCommand({
      id: 'activate-transcription',
      name: 'Toggle Chat Agent Microphone',
      callback: () => {
        this.currentMicrophone.toggleMicrophone();
      },
    });
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

  constructor(arcana: ArcanaPlugin, settings: SocratesSettings) {
    super(arcana, settings, 'socrates-view', 'brain-cog', 'Socrates', () => {
      return (
        <React.StrictMode>
          <MicrophoneContext.Provider value={this.currentMicrophone}>
            {SocratesView(arcana, this.getAgentFolder.bind(this), this.getSocrates.bind(this))}
          </MicrophoneContext.Provider>
        </React.StrictMode>
      );
    });
  }
}
