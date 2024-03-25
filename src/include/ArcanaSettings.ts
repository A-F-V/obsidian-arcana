export type AvailableModels = 'gpt-3.5-turbo' | 'gpt-4-1106-preview';

export function isAvailableModel(model: string): model is AvailableModels {
  return model == 'gpt-3.5-turbo' || model == 'gpt-4-1106-preview';
}

export default interface ArcanaSettings {
  OPEN_AI_API_KEY: string;
  MODEL_TYPE: AvailableModels;
  INPUT_LANGUAGE: string;
  TEMPERATURE: number;
  TOP_P: number;
  //Plugins
  PluginSettings: {
    [key: string]: any;
  };
}
