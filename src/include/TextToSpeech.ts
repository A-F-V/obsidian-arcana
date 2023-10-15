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

export class EdenTextToSpeech {
  static async speak(
    text: string,
    api_key: string,
    settings: EdenTextToSpeechParams
  ): Promise<HTMLAudioElement> {
    const body = JSON.stringify({
      providers: settings.provider,
      language: settings.language,
      text,
      rate: settings.rate,
      pitch: settings.pitch,
      settings: { [settings.provider]: settings.model },
    });

    console.log(body);
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
    })
      .then((response: RequestUrlResponse) => {
        if (response.status != 200) {
          throw new Error(response.json);
        }

        console.log(response.json);
        const b64 = response.json[settings.provider]['audio'];
        const url = `data:audio/mp3;base64,${b64}`;
        console.log(url);
        const audio = new Audio(url);
        return audio;
      })
      .catch((error: Error) => {
        console.log(error.message);
        throw error;
      });
    return audio;
  }
}
