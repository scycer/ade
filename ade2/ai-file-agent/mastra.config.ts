import { Mastra } from '@mastra/core';
import { z } from 'zod';

// Define tool schemas for structured outputs
export const ToolSchemas = {
  searchFiles: z.object({
    query: z.string().describe("Semantic search query"),
    limit: z.number().optional().default(5),
    fileType: z.string().optional()
  }),

  analyzeCode: z.object({
    filePath: z.string(),
    analysis: z.enum(['complexity', 'dependencies', 'security', 'performance'])
  }),

  executeCommand: z.object({
    command: z.enum(['git-status', 'git-diff', 'npm-outdated', 'bundle-size']),
    args: z.array(z.string()).optional()
  }),

  writeFile: z.object({
    path: z.string(),
    content: z.string(),
    mode: z.enum(['create', 'append', 'overwrite'])
  })
};

// Structured plan schema for LLM
export const AgentPlanSchema = z.object({
  understanding: z.string().describe("What the user wants to accomplish"),
  steps: z.array(z.object({
    tool: z.enum(['searchFiles', 'analyzeCode', 'executeCommand', 'writeFile']),
    parameters: z.record(z.any()),
    reasoning: z.string()
  })),
  expectedOutcome: z.string()
});

export const mastra = new Mastra({
  llm: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    temperature: 0.1, // Low temp for structured outputs
  }
});