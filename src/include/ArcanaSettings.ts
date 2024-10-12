import { AvailablePluginSettings } from '@/plugins/AllPlugins';

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

// Plugins should not need to use these settings directly
export interface AgentSettings {
  OPEN_AI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  MODEL_TYPE: AvailableModels;
  INPUT_LANGUAGE: string;
  TEMPERATURE: number;
  TOP_P: number;
}

export default interface ArcanaSettings {
  agentSettings: AgentSettings;
  //Plugins
  pluginSettings: AvailablePluginSettings;
}
export const defaultAgentSettings: AgentSettings = {
  OPEN_AI_API_KEY: '',
  ANTHROPIC_API_KEY: '',
  MODEL_TYPE: 'gpt-3.5-turbo',
  INPUT_LANGUAGE: 'en',
  TEMPERATURE: 0.7,
  TOP_P: 1,
};
