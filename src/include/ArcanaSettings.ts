export type AvailableModels =
  | 'gpt-3.5-turbo'
  | 'gpt-4-turbo'
  | 'gpt-4o'
  | 'claude-3-5-sonnet-20240620';

export function isAvailableModel(model: string): model is AvailableModels {
  return (
    model == 'gpt-3.5-turbo' ||
    model == 'gpt-4-turbo' ||
    model == 'gpt-4o' ||
    model == 'claude-3-5-sonnet-20240620'
  );
}

export type Provider = 'openai' | 'anthropic';

export function modelProvider(model: AvailableModels): Provider {
  if (model == 'gpt-3.5-turbo' || model == 'gpt-4-turbo' || model == 'gpt-4o') {
    return 'openai';
  } else {
    return 'anthropic';
  }
}

export default interface ArcanaSettings {
  OPEN_AI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  MODEL_TYPE: AvailableModels;
  INPUT_LANGUAGE: string;
  TEMPERATURE: number;
  TOP_P: number;
  //Plugins
  PluginSettings: {
    [key: string]: any;
  };
}
