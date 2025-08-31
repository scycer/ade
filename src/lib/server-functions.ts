import { createServerFn } from '@tanstack/react-start';
import { fileAgent } from '../mastra/agents/file-agent';
import { db, initDB } from './db';
import OpenAI from 'openai';
import fs from 'node:fs/promises';
import path from 'node:path';

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

// List files in a directory
export const listFiles = createServerFn({ method: 'POST' })
  .validator((d: { path?: string }) => d)
  .handler(async ({ data }) => {
    const dirPath = data.path || process.cwd();
    
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      const fileList = await Promise.all(
        files.map(async (file) => {
          const fullPath = path.join(dirPath, file.name);
          let stats = null;
          
          try {
            stats = await fs.stat(fullPath);
          } catch (error) {
            // Handle permission errors
          }
          
          return {
            name: file.name,
            path: fullPath,
            isDirectory: file.isDirectory(),
            isFile: file.isFile(),
            size: stats?.size || 0,
            modified: stats?.mtime || null,
            extension: file.isFile() ? path.extname(file.name) : null,
          };
        })
      );
      
      // Sort: directories first, then files
      fileList.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      
      return {
        currentPath: dirPath,
        parentPath: path.dirname(dirPath),
        files: fileList,
      };
    } catch (error) {
      throw new Error(`Failed to list directory: ${error}`);
    }
  });

// Read file contents
export const readFileContent = createServerFn({ method: 'POST' })
  .validator((d: { path: string }) => d)
  .handler(async ({ data }) => {
    try {
      const content = await fs.readFile(data.path, 'utf-8');
      const stats = await fs.stat(data.path);
      
      return {
        path: data.path,
        content,
        size: stats.size,
        modified: stats.mtime,
        extension: path.extname(data.path),
      };
    } catch (error) {
      throw new Error(`Failed to read file: ${error}`);
    }
  });

// Delete a file
export const deleteFile = createServerFn({ method: 'POST' })
  .validator((d: { path: string }) => d)
  .handler(async ({ data }) => {
    try {
      await fs.unlink(data.path);
      return { success: true, message: `Deleted ${data.path}` };
    } catch (error) {
      throw new Error(`Failed to delete file: ${error}`);
    }
  });

// Create a new file
export const createFile = createServerFn({ method: 'POST' })
  .validator((d: { path: string; content: string }) => d)
  .handler(async ({ data }) => {
    try {
      await fs.writeFile(data.path, data.content, 'utf-8');
      return { success: true, path: data.path };
    } catch (error) {
      throw new Error(`Failed to create file: ${error}`);
    }
  });

// Upload file (base64 encoded)
export const uploadFile = createServerFn({ method: 'POST' })
  .validator((d: { filename: string; content: string; encoding: string }) => d)
  .handler(async ({ data }) => {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      // Ensure uploads directory exists
      await fs.mkdir(uploadDir, { recursive: true });
      
      const filePath = path.join(uploadDir, data.filename);
      
      if (data.encoding === 'base64') {
        const buffer = Buffer.from(data.content, 'base64');
        await fs.writeFile(filePath, buffer);
      } else {
        await fs.writeFile(filePath, data.content, 'utf-8');
      }
      
      return { 
        success: true, 
        path: filePath,
        size: (await fs.stat(filePath)).size
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error}`);
    }
  });