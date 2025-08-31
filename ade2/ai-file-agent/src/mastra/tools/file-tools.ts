import { db } from '../../lib/db';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import OpenAI from 'openai';

const execAsync = promisify(exec);

// Helper function to generate embeddings
async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}

export async function searchFiles({ query, limit = 5, fileType }: { query: string; limit?: number; fileType?: string }) {
  // Generate embedding for query
  const embedding = await generateEmbedding(query);

  // Vector search with optional filter
  const sql = fileType
    ? `SELECT * FROM vector_top_k('files_embedding_idx', vector(?), ?) AS v
       JOIN files f ON f.rowid = v.id
       WHERE json_extract(f.metadata, '$.type') = ?`
    : `SELECT * FROM vector_top_k('files_embedding_idx', vector(?), ?) AS v
       JOIN files f ON f.rowid = v.id`;

  const args = fileType
    ? [JSON.stringify(embedding), limit, fileType]
    : [JSON.stringify(embedding), limit];

  const results = await db.execute({ sql, args });
  return results.rows;
}

export async function executeCommand({ command, args = [] }: { command: string; args?: string[] }) {
  const commands: Record<string, () => Promise<string>> = {
    'git-status': async () => {
      const { stdout } = await execAsync('git status --short');
      return stdout;
    },
    'git-diff': async () => {
      const { stdout } = await execAsync(`git diff ${args[0] || 'HEAD'}`);
      return stdout;
    },
    'npm-outdated': async () => {
      const { stdout } = await execAsync('npm outdated');
      return stdout;
    },
    'bundle-size': async () => {
      const { stdout } = await execAsync('du -sh dist/');
      return stdout;
    },
  };

  if (commands[command]) {
    const result = await commands[command]();
    return { command, output: result };
  }
  
  throw new Error(`Unknown command: ${command}`);
}