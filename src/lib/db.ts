import { createClient } from '@libsql/client';

// Only initialize database on server side
let db: ReturnType<typeof createClient> | null = null;

if (typeof window === 'undefined') {
  // Server-side only imports
  const { config } = await import('dotenv');
  config();
  
  // Initialize database client
  db = createClient({
    url: process.env.DATABASE_URL || 'file:./local.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
}

export { db };

// Initialize database schema
export async function initializeDatabase() {
  if (!db) return;
  
  try {
    // Create nodes table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        type TEXT DEFAULT 'node'
      )
    `);

    // Create edges table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS edges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sourceId INTEGER NOT NULL,
        targetId INTEGER NOT NULL,
        createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sourceId) REFERENCES nodes(id) ON DELETE CASCADE,
        FOREIGN KEY (targetId) REFERENCES nodes(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(sourceId)
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(targetId)
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Node CRUD operations
export const nodeOperations = {
  async create(text: string, type: string = 'node') {
    if (!db) throw new Error('Database not initialized');
    const result = await db.execute({
      sql: 'INSERT INTO nodes (text, type) VALUES (?, ?)',
      args: [text, type],
    });
    return result;
  },

  async getAll() {
    if (!db) throw new Error('Database not initialized');
    const result = await db.execute('SELECT * FROM nodes ORDER BY createdDate DESC');
    return result.rows;
  },

  async getById(id: number) {
    if (!db) throw new Error('Database not initialized');
    const result = await db.execute({
      sql: 'SELECT * FROM nodes WHERE id = ?',
      args: [id],
    });
    return result.rows[0];
  },

  async update(id: number, text: string) {
    if (!db) throw new Error('Database not initialized');
    const result = await db.execute({
      sql: 'UPDATE nodes SET text = ?, updatedDate = CURRENT_TIMESTAMP WHERE id = ?',
      args: [text, id],
    });
    return result;
  },

  async delete(id: number) {
    if (!db) throw new Error('Database not initialized');
    const result = await db.execute({
      sql: 'DELETE FROM nodes WHERE id = ?',
      args: [id],
    });
    return result;
  },
};

// Edge CRUD operations
export const edgeOperations = {
  async create(sourceId: number, targetId: number) {
    if (!db) throw new Error('Database not initialized');
    const result = await db.execute({
      sql: 'INSERT INTO edges (sourceId, targetId) VALUES (?, ?)',
      args: [sourceId, targetId],
    });
    return result;
  },

  async getAll() {
    if (!db) throw new Error('Database not initialized');
    const result = await db.execute('SELECT * FROM edges');
    return result.rows;
  },

  async getByNodeId(nodeId: number) {
    if (!db) throw new Error('Database not initialized');
    const result = await db.execute({
      sql: 'SELECT * FROM edges WHERE sourceId = ? OR targetId = ?',
      args: [nodeId, nodeId],
    });
    return result.rows;
  },

  async delete(id: number) {
    if (!db) throw new Error('Database not initialized');
    const result = await db.execute({
      sql: 'DELETE FROM edges WHERE id = ?',
      args: [id],
    });
    return result;
  },

  async deleteByNodes(sourceId: number, targetId: number) {
    if (!db) throw new Error('Database not initialized');
    const result = await db.execute({
      sql: 'DELETE FROM edges WHERE sourceId = ? AND targetId = ?',
      args: [sourceId, targetId],
    });
    return result;
  },
};