import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.TURSO_URL || 'file:./agent.db',
});

// Initialize schema with vector support
export async function initDB() {
  // Files with embeddings
  await db.execute(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE,
      content TEXT,
      summary TEXT,
      embedding F32_BLOB(1536),
      metadata JSON,
      indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Vector index for similarity search
  await db.execute(`
    CREATE INDEX IF NOT EXISTS files_embedding_idx
    ON files(libsql_vector_idx(embedding))
  `);

  // Agent conversations & tool calls
  await db.execute(`
    CREATE TABLE IF NOT EXISTS agent_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT,
      structured_plan JSON,
      tools_executed JSON,
      result TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}