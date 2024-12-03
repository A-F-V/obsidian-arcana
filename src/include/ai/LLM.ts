import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentSettings, AvailableModels } from '../ArcanaSettings';
import { TokenTextSplitter } from 'langchain/text_splitter';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

type Provider = 'openai' | 'anthropic' | 'gemini';

function modelProvider(model: AvailableModels): Provider {
  switch (model) {
    case 'gpt-4o-mini':
    case 'gpt-4o':
      return 'openai';
    case 'claude-3-5-sonnet-latest':
    case 'claude-3-5-haiku-latest':
      return 'anthropic';
    case 'gemini-1.5-pro':
    case 'gemini-1.5-flash':
      return 'gemini';
  }
}

function getAPIKeyForProvider(settings: AgentSettings, provider: Provider): string | null {
  switch (provider) {
    case 'openai':
      return settings.OPEN_AI_API_KEY;
    case 'anthropic':
      return settings.ANTHROPIC_API_KEY;
    case 'gemini':
      return settings.GEMINI_API_KEY;
  }
  return null;
}

export function getLLM(settings: AgentSettings, streaming = true): BaseChatModel {
  const model = settings.MODEL_TYPE;
  const temperature = settings.TEMPERATURE;
  const topP = settings.TOP_P;
  const provider = modelProvider(model);

  const apiKey = getAPIKeyForProvider(settings, provider);
  if (!apiKey) {
    throw new Error('No API Key in Settings');
  }

  switch (provider) {
    case 'anthropic':
      return new ChatAnthropic({
        apiKey: apiKey,
        model: model,
        temperature: temperature,
        topP: topP,
        streaming: streaming,
      });
    case 'openai':
      return new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: model,
        temperature: temperature,
        topP: topP,
        streaming: streaming,
      });
    case 'gemini':
      return new ChatGoogleGenerativeAI({
        apiKey: apiKey,
        modelName: model,
        temperature: temperature,
        topP: topP,
        streaming: streaming,
      });
  }
}

async function tokenize(input: string): Promise<string[]> {
  const tokenSplitter = new TokenTextSplitter({
    encodingName: 'cl100k_base',
    chunkOverlap: 0,
    chunkSize: 1,
  });
  return await tokenSplitter.splitText(input);
}

// Cost per million tokens
const inputCostRate: Record<AvailableModels, number> = {
  'gpt-4o': 2.5,
  'gpt-4o-mini': 0.15,
  'claude-3-5-sonnet-latest': 3.0,
  'claude-3-5-haiku-latest': 0.8,
  'gemini-1.5-pro': 1.25,
  'gemini-1.5-flash': 0.075,
};

const outputCostRate: Record<AvailableModels, number> = {
  'gpt-4o-mini': 0.6,
  'gpt-4o': 10,
  'claude-3-5-sonnet-latest': 15,
  'claude-3-5-haiku-latest': 4,
  'gemini-1.5-pro': 5,
  'gemini-1.5-flash': 0.3,
};

export async function calculateLLMCost(model: AvailableModels, input: string, output: string) {
  // TODO log the cost correctly for anthropic
  const inputFee = inputCostRate[model];
  const outputFee = outputCostRate[model];

  const inputTokens = await tokenize(input);
  const outputTokens = await tokenize(output);

  const inputCost = (inputTokens.length / 1000000) * inputFee;
  const outputCost = (outputTokens.length / 1000000) * outputFee;

  const totalCost = inputCost + outputCost;
  return totalCost;
}
