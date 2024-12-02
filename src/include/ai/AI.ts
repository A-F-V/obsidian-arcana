import Conversation from '@/include/ai/Conversation';
import OpenAI from 'openai';
import { OpenAITextToSpeech, OpenAITextToSpeechParams } from './TextToSpeech';
import { AgentSettings } from '../ArcanaSettings';
import { requestUrl, RequestUrlParam, RequestUrlResponse } from 'obsidian';

export class AIAgent {
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
    console.log('Transcribing file: ' + file.name + ' (' + (file.size / (1024 * 1024)).toFixed(2) + ' MB)');

    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('model', 'whisper-1');
    formData.append('language', this.settings.INPUT_LANGUAGE);

    // Make a fetch request
    return await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.settings.OPEN_AI_API_KEY}`,
      },
      body: formData,
    })
      .then(async response => {
        if (!response.ok) {
          console.log(response);
          return Promise.reject(new Error(`Request failed with status ${response.status}: ${await response.text()}`));
        }
        const result = await response.json();
        return result.text;
      })
      .catch(reason => {
        console.log(reason);
        return Promise.reject(reason);
      });
  }

  public async speak(text: string, settings: OpenAITextToSpeechParams): Promise<HTMLAudioElement> {
    return OpenAITextToSpeech.speak(text, this.settings.OPEN_AI_API_KEY, settings);
  }
}
