import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { AgentSettings, AvailableModels } from '../ArcanaSettings';
import { TokenTextSplitter } from 'langchain/text_splitter';

type Provider = 'openai' | 'anthropic';

function modelProvider(model: AvailableModels): Provider {
  switch (model) {
    case 'gpt-4o-mini':
    case 'gpt-4o':
      return 'openai';
    case 'claude-3-5-sonnet-latest':
    case 'claude-3-5-haiku-latest':
      return 'anthropic';
  }
}

function getAPIKeyForProvider(settings: AgentSettings, provider: Provider): string | null {
  switch (provider) {
    case 'openai':
      return settings.OPEN_AI_API_KEY;
    case 'anthropic':
      return settings.ANTHROPIC_API_KEY;
  }
  return null;
}

export function getLLM(settings: AgentSettings, streaming = true) {
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
        maxRetries: 0,
      });
    case 'openai':
      return new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: model,
        temperature: temperature,
        topP: topP,
        streaming: streaming,
        maxRetries: 0,
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
};

const outputCostRate: Record<AvailableModels, number> = {
  'gpt-4o-mini': 0.6,
  'gpt-4o': 10,
  'claude-3-5-sonnet-latest': 15,
  'claude-3-5-haiku-latest': 4,
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
