import { AvailablePluginSettings } from '@/plugins/AllPlugins';
import OpenAI from 'openai';

export type AvailableModels =
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'claude-3-5-sonnet-latest'
  | 'claude-3-5-haiku-latest'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | `openrouter:${string}`;
export const ModelDisplayNames: Record<AvailableModels, string> = {
  'gpt-4o-mini': 'GPT4o-mini',
  'gpt-4o': 'GPT4o',
  'claude-3-5-sonnet-latest': 'Claude 3.5 Sonnet',
  'claude-3-5-haiku-latest': 'Claude 3.5 Haiku',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
};

declare module 'openai/resources/models' {
  export interface Model {
    name: string;
  }
}

export async function loadDynamicModels(): Promise<void> {
  const client = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1' });

  const modelIt = client.models.list();

  for await (const model of modelIt) {
    ModelDisplayNames[`openrouter:${model.id}`] = `OpenRouter: ${model.name}`;
  }
}

export function isAvailableModel(model: string): model is AvailableModels {
  return Object.keys(ModelDisplayNames).includes(model);
}

// Plugins should not need to use these settings directly
export interface AgentSettings {
  OPEN_AI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  GEMINI_API_KEY: string;
  OPENROUTER_API_KEY: string;
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
  GEMINI_API_KEY: '',
  OPENROUTER_API_KEY: '',
  MODEL_TYPE: 'gpt-4o-mini',
  INPUT_LANGUAGE: 'en',
  TEMPERATURE: 0.7,
  TOP_P: 1,
};
