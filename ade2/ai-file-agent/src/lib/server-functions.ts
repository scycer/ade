import { createServerFn } from '@tanstack/react-start';
import { fileAgent } from '../mastra/agents/file-agent';
import { db, initDB } from './db';
import OpenAI from 'openai';

// Generate embeddings
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}

// Index a file
export const indexFile = createServerFn({ method: 'POST' })
  .validator((d: { path: string; content: string }) => d)
  .handler(async ({ data }) => {
    await initDB();
    const openai = new OpenAI();
    
    // Generate summary using LLM
    const summary = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Summarize this file in 2 sentences' },
        { role: 'user', content: data.content.slice(0, 4000) }
      ],
      max_tokens: 100,
    });

    const summaryText = summary.choices[0].message.content;
    const embedding = await generateEmbedding(`${data.path} ${summaryText} ${data.content}`);

    await db.execute({
      sql: `INSERT OR REPLACE INTO files (path, content, summary, embedding, metadata)
            VALUES (?, ?, ?, vector(?), ?)`,
      args: [
        data.path,
        data.content,
        summaryText,
        JSON.stringify(embedding),
        JSON.stringify({
          type: data.path.split('.').pop(),
          size: data.content.length,
          lines: data.content.split('\n').length
        })
      ]
    });

    return { indexed: true, summary: summaryText };
  });

// Execute agent query with structured output
export const executeAgentQuery = createServerFn({ method: 'POST' })
  .validator((d: { query: string }) => d)
  .handler(async ({ data }) => {
    await initDB();
    const result = await fileAgent.execute(data.query);
    return result;
  });

// Get agent history
export const getAgentHistory = createServerFn({ method: 'GET' })
  .handler(async () => {
    await initDB();
    const results = await db.execute(
      'SELECT * FROM agent_runs ORDER BY created_at DESC LIMIT 20'
    );
    return results.rows;
  });