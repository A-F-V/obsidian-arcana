import { TFile } from 'obsidian';
import FrontMatterManager from 'src/include/FrontMatterManager';
import { isEmoji } from 'src/include/TextPostProcesssing';
import {
  OpenAITextToSpeechParams,
  OpenAIVoice,
} from 'src/include/TextToSpeech';
import ArcanaPlugin from 'src/main';
import { removeFrontMatter } from 'src/utilities/DocumentCleaner';

// A type representing all the agent data
export type AgentData = {
  name: string;
  initialMessage: string;
  agentEmoji: string;
  userEmoji: string;
  autoSendTranscription: boolean;

  // Text to speech settings
  ttsParams: OpenAITextToSpeechParams;
  autoSpeakReply: boolean;
};

export class AgentDataLoader {
  private static defaultAgentEmoji = '🤖';
  private static defaultUserEmoji = '😀';
  private static defaultAutoSendTranscription = false;
  private static defaultTTSParams: OpenAITextToSpeechParams = {
    voice: 'alloy',
    rate: 1,
  };
  private static defaultAutoSpeakReply = false;

  public static async fromFile(
    arcana: ArcanaPlugin,
    file: TFile
  ): Promise<AgentData | null> {
    const fmm = new FrontMatterManager(arcana);

    // Agent name is name of the file
    const name = file.basename;
    if (!name || name == 'Socrates') return null;

    // Agent Emoji
    let agentEmoji =
      (await fmm.get<string>(file, 'arcana-agent-emoji')) ??
      this.defaultAgentEmoji;
    if (!isEmoji(agentEmoji)) agentEmoji = this.defaultAgentEmoji;
    // User Emoji
    let userEmoji =
      (await fmm.get<string>(file, 'arcana-user-emoji')) ??
      this.defaultUserEmoji;
    if (!isEmoji(userEmoji)) userEmoji = this.defaultUserEmoji;

    // Auto send transcription
    const autoSendTranscription =
      (await fmm.get<boolean>(file, 'arcana-auto-send-transcription')) ??
      this.defaultAutoSendTranscription;

    // Text to speech settings

    const ttsParams: OpenAITextToSpeechParams = {
      voice:
        (await fmm.get<OpenAIVoice>(file, 'arcana-tts-voice')) ??
        this.defaultTTSParams.voice,
      rate:
        (await fmm.get<number>(file, 'arcana-tts-rate')) ??
        this.defaultTTSParams.rate,
    };

    const autoSpeakReply =
      (await fmm.get<boolean>(file, 'arcana-auto-speak-reply')) ??
      this.defaultAutoSpeakReply;

    // initial message is the contents of the file
    const initialMessage = removeFrontMatter(await arcana.app.vault.read(file));

    return {
      name,
      initialMessage,
      agentEmoji,
      userEmoji,
      autoSendTranscription,
      ttsParams,
      autoSpeakReply,
    };
  }
}
