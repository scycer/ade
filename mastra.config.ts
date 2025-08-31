import { Config } from '@mastra/core';
import { z } from 'zod';

export const config: Config = {
  name: 'node-graph-ai',
  
  agents: {
    nodeAssistant: {
      name: 'Node Assistant',
      description: 'Helps generate and enhance node content',
      instructions: `You are a helpful assistant that generates meaningful content for nodes based on user input.
        When given a text prompt, create a thoughtful and relevant response that expands on the idea.
        Keep responses concise but informative.`,
      model: {
        provider: 'OPEN_AI',
        name: 'gpt-4o-mini',
      },
    },
  },

  tools: {
    generateNodeContent: {
      name: 'Generate Node Content',
      description: 'Generate enhanced content for a node based on input text',
      inputSchema: z.object({
        prompt: z.string().describe('The input text to generate content from'),
        type: z.string().optional().describe('The type of node (task, idea, question, etc.)'),
      }),
      outputSchema: z.object({
        content: z.string().describe('The generated content'),
        suggestedType: z.string().describe('Suggested node type based on content'),
      }),
      execute: async ({ prompt, type }) => {
        // This is a placeholder - in production, this would call the LLM
        return {
          content: `Enhanced: ${prompt}`,
          suggestedType: type || 'node',
        };
      },
    },
  },
};