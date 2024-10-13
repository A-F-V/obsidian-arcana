import { requestUrl, RequestUrlResponse } from 'obsidian';

// Provider Typedef
export type TextToSpeechProvider = 'google' | 'microsoft' | 'ibm' | 'amazon';
export interface EdenTextToSpeechParams {
  provider: TextToSpeechProvider;
  rate: number;
  pitch: number;
  model: string;
  language: string;
}

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface OpenAITextToSpeechParams {
  voice: OpenAIVoice;
  rate: number;
}
export class OpenAITextToSpeech {
  static async speak(text: string, api_key: string, settings: OpenAITextToSpeechParams) {
    // Make a Rest Request body
    const body = JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: settings.voice,
      speed: settings.rate,
    });

    const request = {
      method: 'POST',
      url: 'https://api.openai.com/v1/audio/speech',
      contentType: 'application/json',
      body,
      throw: false,
      headers: {
        Authorization: `Bearer ${api_key}`,
      },
    };
    // Make a Rest Request
    return await requestUrl(request)
      .then((response: RequestUrlResponse) => {
        // A OpenAI error
        if (response.status != 200) {
          console.log(response);
          return Promise.reject(new Error(`Request failed with status ${response.status}: ${response.text}`));
        }
        // Everything is good
        // Construct an audio object from an mp3 arrayBuffer
        // Assuming `data` is your ArrayBuffer
        const blob = new Blob([response.arrayBuffer], { type: 'audio/mp3' }); // Replace 'audio/mpeg' with the actual MIME type of your data
        const url = URL.createObjectURL(blob);
        return new Audio(url);
      })
      .catch(reason => {
        console.log(reason);
        return Promise.reject(reason);
      });
  }
}

export class EdenTextToSpeech {
  static async speak(text: string, api_key: string, settings: EdenTextToSpeechParams): Promise<HTMLAudioElement> {
    const body = JSON.stringify({
      providers: settings.provider,
      language: settings.language,
      text,
      rate: settings.rate,
      pitch: settings.pitch,
      settings: { [settings.provider]: settings.model },
    });

    const audio = await requestUrl({
      method: 'POST',
      url: 'https://api.edenai.run/v2/audio/text_to_speech',
      contentType: 'application/json',
      body,
      throw: false,
      headers: {
        authorization: `Bearer ${api_key}`,
        Accept: 'application/json',
      },
    }).then((response: RequestUrlResponse) => {
      // A EdenAI error
      if (response.status != 200) {
        return Promise.reject(new Error(`Request failed with status ${response.status}: ${response.text}`));
      }
      // A provider error
      if (response.json[settings.provider]['status'] == 'fail') {
        const errorMessage = response.json[settings.provider]['error']['message'];
        console.log(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      // Everything is good
      const b64 = response.json[settings.provider]['audio'];
      const url = `data:audio/mp3;base64,${b64}`;
      const audio = new Audio(url);
      return audio;
    });
    return audio;
  }
}
