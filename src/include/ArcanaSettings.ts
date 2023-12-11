export default interface ArcanaSettings {
  OPEN_AI_API_KEY: string;
  MODEL_TYPE: string;
  TEMPERATURE: number;
  TOP_P: number;
  // Text to Speech
  EDEN_AI_API_KEY: string;

  //Plugins
  PluginSettings: {
    [key: string]: any;
  };
}
export const availableModels = ['gpt-3.5-turbo', 'gpt-4-1106-preview'];
