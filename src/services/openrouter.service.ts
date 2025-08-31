import OpenAI from 'openai';
import { Agent, createTool } from '@mastra/core';

// OpenRouter configuration
export const openRouterConfig = {
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  model: 'openai/gpt-oss-120b', // The model you requested
  siteUrl: 'http://localhost:3000', // Optional: helps OpenRouter filter content
  appName: 'ADE-CLI' // Optional: shows in OpenRouter dashboard
};

// Create OpenAI client configured for OpenRouter
export const openRouterClient = new OpenAI({
  apiKey: openRouterConfig.apiKey,
  baseURL: openRouterConfig.baseURL,
  defaultHeaders: {
    'HTTP-Referer': openRouterConfig.siteUrl,
    'X-Title': openRouterConfig.appName,
  }
});

// Direct OpenRouter query function (without Mastra)
export async function queryOpenRouter(prompt: string, options?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}) {
  try {
    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });
    
    const completion = await openRouterClient.chat.completions.create({
      model: options?.model || openRouterConfig.model,
      messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 1000,
    });
    
    return {
      success: true,
      result: completion.choices[0]?.message?.content || '',
      usage: completion.usage,
      model: completion.model
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to query OpenRouter'
    };
  }
}

// Create Mastra Agent with OpenRouter
export function createOpenRouterAgent(name: string = 'openrouter-agent') {
  return new Agent({
    name,
    instructions: 'You are a helpful AI assistant powered by GPT-OSS-120B through OpenRouter.',
    model: {
      provider: 'OPEN_AI',
      name: openRouterConfig.model,
      toolChoice: 'auto'
    },
    // Custom model configuration for OpenRouter
    modelConfig: {
      apiKey: openRouterConfig.apiKey,
      baseURL: openRouterConfig.baseURL,
      headers: {
        'HTTP-Referer': openRouterConfig.siteUrl,
        'X-Title': openRouterConfig.appName,
      }
    }
  });
}

// Weather tool for Mastra agent (similar to Claude's mock tool)
export const weatherTool = createTool({
  name: 'get_weather',
  description: 'Get the current weather for a location',
  inputSchema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city and state, e.g. San Francisco, CA'
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'Temperature unit'
      }
    },
    required: ['location']
  },
  execute: async ({ location, unit = 'fahrenheit' }) => {
    // Mock weather data
    const tempF = Math.floor(Math.random() * 30) + 50;
    const tempC = Math.floor((tempF - 32) * 5/9);
    const temp = unit === 'celsius' ? `${tempC}°C` : `${tempF}°F`;
    const conditions = ['sunny', 'cloudy', 'rainy', 'partly cloudy'][Math.floor(Math.random() * 4)];
    const humidity = Math.floor(Math.random() * 50) + 30;
    
    return `Weather in ${location}: ${temp}, ${conditions}, ${humidity}% humidity`;
  }
});

// Multi-turn chat with OpenRouter
export class OpenRouterChat {
  private messages: OpenAI.ChatCompletionMessageParam[] = [];
  private model: string;
  
  constructor(options?: {
    model?: string;
    systemPrompt?: string;
  }) {
    this.model = options?.model || openRouterConfig.model;
    
    if (options?.systemPrompt) {
      this.messages.push({ role: 'system', content: options.systemPrompt });
    }
  }
  
  async sendMessage(content: string, options?: {
    temperature?: number;
    maxTokens?: number;
  }) {
    this.messages.push({ role: 'user', content });
    
    try {
      const completion = await openRouterClient.chat.completions.create({
        model: this.model,
        messages: this.messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000,
      });
      
      const assistantMessage = completion.choices[0]?.message;
      if (assistantMessage) {
        this.messages.push(assistantMessage);
      }
      
      return {
        success: true,
        result: assistantMessage?.content || '',
        usage: completion.usage,
        model: completion.model
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send message'
      };
    }
  }
  
  getHistory() {
    return [...this.messages];
  }
  
  clearHistory() {
    this.messages = this.messages.filter(m => m.role === 'system');
  }
}

// Check if OpenRouter API key is configured
export function isOpenRouterAvailable(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

// Get available models from OpenRouter
export async function getAvailableModels() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${openRouterConfig.apiKey}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return [];
  }
}