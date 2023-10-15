import { requestUrl, RequestUrlResponse } from 'obsidian';

export interface EdenTextToSpeechParams {}

export class EdenTextToSpeech {
  static async speak(
    text: string,
    api_key: string,
    settings: EdenTextToSpeechParams
  ): Promise<HTMLAudioElement> {
    const body = JSON.stringify({
      providers: 'amazon',
      language: 'en',
      text,
      option: 'FEMALE',
    });

    console.log(body);
    const audio = await requestUrl({
      method: 'POST',
      url: 'https://api.edenai.run/v2/audio/text_to_speech',
      contentType: 'application/json',
      body,
      throw: true,
      headers: {
        authorization: `Bearer ${api_key}`,
        Accept: 'application/json',
      },
    })
      .then((response: RequestUrlResponse) => {
        console.log(response.json);
        const b64 = response.json['amazon']['audio'];
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
