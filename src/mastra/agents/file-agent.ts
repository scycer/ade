import { AgentPlanSchema } from '../../../mastra.config';
import { searchFiles, executeCommand } from '../tools/file-tools';
import { db } from '../../lib/db';
import OpenAI from 'openai';

export const fileAgent = {
  id: 'file-agent',
  description: 'Manages files with semantic search and analysis',
  
  systemPrompt: `You are a file management assistant with vector search capabilities.
    When given a task, create a structured plan using the available tools.
    Always respond with valid JSON matching the AgentPlanSchema.
    Available tools: searchFiles, analyzeCode, executeCommand, writeFile`,

  async generatePlan(query: string) {
    const openai = new OpenAI();
    
    // For now, create a simple plan without calling the LLM
    // This is a placeholder - in production you'd use structured output from OpenAI
    const plan = {
      understanding: `Process the query: ${query}`,
      steps: [
        {
          tool: 'searchFiles' as const,
          parameters: { query: query, limit: 5 },
          reasoning: 'Search for relevant files'
        }
      ],
      expectedOutcome: 'Provide relevant search results'
    };

    return plan;
  },

  async execute(query: string) {
    // Generate structured plan
    const plan = await this.generatePlan(query);

    // Execute each step
    const results = [];
    for (const step of plan.steps) {
      let result;
      if (step.tool === 'searchFiles') {
        result = await searchFiles(step.parameters);
      } else if (step.tool === 'executeCommand') {
        result = await executeCommand(step.parameters as any);
      }
      results.push({ step: step.tool, result });
    }

    // Store in database
    await db.execute({
      sql: `INSERT INTO agent_runs (query, structured_plan, tools_executed, result)
            VALUES (?, ?, ?, ?)`,
      args: [
        query,
        JSON.stringify(plan),
        JSON.stringify(results),
        plan.expectedOutcome
      ]
    });

    return { plan, results };
  }
};