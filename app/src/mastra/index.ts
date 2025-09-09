import { Mastra, Agent } from '@mastra/core';
import { createOpenAI } from '@ai-sdk/openai';

const openrouter = createOpenAI({
  baseURL: Bun.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  apiKey: Bun.env.OPENROUTER_API_KEY || '',
});

export const mastra = new Mastra({
  engine: {
    type: 'memory',
  },
  agents: {
    assistantAgent: new Agent({
      name: 'Assistant Agent',
      model: openrouter(Bun.env.DEFAULT_MODEL || 'openai/gpt-4o-mini'),
      maxSteps: 3,
      instructions: 'You are a helpful AI assistant. Provide concise and accurate responses.',
    }),
  },
});

export const assistantAgent = mastra.getAgent('assistantAgent');