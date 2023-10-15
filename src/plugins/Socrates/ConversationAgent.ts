import { TFile } from 'obsidian';
import FrontMatterManager from 'src/include/FrontMatterManager';
import { isEmoji } from 'src/include/TextPostProcesssing';
import { EdenTextToSpeechParams } from 'src/include/TextToSpeech';
import ArcanaPlugin from 'src/main';
import { removeFrontMatter } from 'src/utilities/DocumentCleaner';

// A type representing all the agent data
export type AgentData = {
  name: string;
  initialMessage: string;
  agentEmoji: string;
  userEmoji: string;
  autoSendTranscription?: boolean;

  // Text to speech settings
  ttsParams: EdenTextToSpeechParams;
};

export class AgentDataLoader {
  private static defaultAgentEmoji = '🤖';
  private static defaultUserEmoji = '😀';
  private static defaultAutoSendTranscription = false;
  private static defaultTTSParams: EdenTextToSpeechParams = {
    provider: 'google',
    language: 'en-US',
    rate: 0,
    pitch: 0,
    model: 'en-US-Neural2-J',
  };

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
    // Provider is same for now
    const convertToModel = (model: string | null): string | null => {
      if (model == null) return null;
      // If its a single letter between A and J, then append it to 	en-US-Neural2-
      model = model.toLowerCase();
      if (model.length == 1 && model >= 'A' && model <= 'J')
        return `en-US-Neural2-${model}`;
      else return null;
    };

    const ttsParams: EdenTextToSpeechParams = {
      provider: 'google',
      rate:
        (await fmm.get<number>(file, 'arcana-tts-rate')) ??
        this.defaultTTSParams.rate,
      pitch:
        (await fmm.get<number>(file, 'arcana-tts-pitch')) ??
        this.defaultTTSParams.pitch,
      model:
        convertToModel(await fmm.get<string>(file, 'arcana-tts-model')) ??
        this.defaultTTSParams.model,
      language:
        (await fmm.get<string>(file, 'arcana-tts-language')) ??
        this.defaultTTSParams.language,
    };

    // initial message is the contents of the file
    const initialMessage = removeFrontMatter(await arcana.app.vault.read(file));

    return {
      name,
      initialMessage,
      agentEmoji,
      userEmoji,
      autoSendTranscription,
      ttsParams,
    };
  }
}
