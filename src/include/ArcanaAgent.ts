import ArcanaPlugin from 'src/main';
import Conversation from 'src/AIFeed';
import OpenAI from 'openai';
import { OpenAIWhisperAudio } from 'langchain/document_loaders/fs/openai_whisper_audio';
import { OpenAITextToSpeech, OpenAITextToSpeechParams } from './TextToSpeech';

export class ArcanaAgent {
  private arcana: ArcanaPlugin;

  constructor(arcana: ArcanaPlugin) {
    this.arcana = arcana;
  }

  public startFeed(conversationContext: string): Conversation {
    return new Conversation(this.arcana.settings, conversationContext);
  }

  public async complete(
    query: string,
    ctx = 'A conversation with an AI for use in Obsidian.',
    onToken?: (tokens: string) => void,
    onAbort?: () => void
  ): Promise<string> {
    const conversation = this.startFeed(ctx);
    return (await conversation.askQuestion(query, onToken, onAbort))!;
  }

  public async transcribe(file: File): Promise<string> {
    const openai = new OpenAI({
      apiKey: this.arcana.settings.OPEN_AI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: this.arcana.settings.INPUT_LANGUAGE,
    });
    return transcription.text;
  }

  public async speak(
    text: string,
    settings: OpenAITextToSpeechParams
  ): Promise<HTMLAudioElement> {
    return OpenAITextToSpeech.speak(
      text,
      this.arcana.settings.OPEN_AI_API_KEY,
      settings
    );
  }
}
