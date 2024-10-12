import Conversation from 'src/AIFeed';
import OpenAI from 'openai';
import { OpenAITextToSpeech, OpenAITextToSpeechParams } from './TextToSpeech';
import { AgentSettings } from './ArcanaSettings';

export class ArcanaAgent {
  private settings: AgentSettings;

  constructor(settings: AgentSettings) {
    this.settings = settings;
  }

  public startFeed(conversationContext: string): Conversation {
    return new Conversation(this.settings, conversationContext);
  }

  public async complete(
    query: string,
    ctx = 'A conversation with an AI for use in Obsidian.',
    onToken?: (tokens: string) => void,
    onAbort?: () => void
  ): Promise<string> {
    const conversation = this.startFeed(ctx);
    const result = await conversation.askQuestion(query, onToken, onAbort);
    if (result === null) {
      throw new Error('No result');
    }
    return result;
  }

  public async transcribe(file: File): Promise<string> {
    const openai = new OpenAI({
      apiKey: this.settings.OPEN_AI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: this.settings.INPUT_LANGUAGE,
    });
    return transcription.text;
  }

  public async speak(text: string, settings: OpenAITextToSpeechParams): Promise<HTMLAudioElement> {
    return OpenAITextToSpeech.speak(text, this.settings.OPEN_AI_API_KEY, settings);
  }
}
