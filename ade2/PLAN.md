# Local AI Agent App with TanStack Start, libSQL Vectors, and Mastra

## Project Overview
Build a local-first AI agent application that combines semantic file search (libSQL vectors), LLM orchestration (Mastra), and tool execution with structured outputs. Everything runs locally in dev mode with hot reload for rapid iteration.

## Initial Setup

```bash
# Create TanStack Start project using their CLI
npm create @tanstack/start@latest ai-file-agent
cd ai-file-agent

# Install core dependencies
bun add @libsql/client @mastra/core openai zod
bun add -d @types/bun

# Initialize Mastra using their CLI
npx @mastra/cli init

# This creates:
# - mastra.config.ts
# - src/mastra/agents/
# - src/mastra/tools/
# - .env.example
```

## Environment Configuration

```bash
# .env
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=optional-key
TURSO_URL=file:./agent.db  # Local SQLite file
```

## Database Setup with Vector Support

Create `app/lib/db.ts`:

```typescript
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
```

## Mastra Configuration

Create `mastra.config.ts`:

```typescript
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
```

## Mastra Tools Implementation

Create `app/mastra/tools/file-tools.ts`:

```typescript
import { createTool } from '@mastra/core';
import { z } from 'zod';
import { db } from '../../lib/db';
import { $ } from 'bun';

export const searchFilesTool = createTool({
  id: 'searchFiles',
  description: 'Search files using semantic similarity',
  inputSchema: ToolSchemas.searchFiles,
  execute: async ({ query, limit, fileType }) => {
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
});

export const executeCommandTool = createTool({
  id: 'executeCommand',
  description: 'Execute predefined shell commands',
  inputSchema: ToolSchemas.executeCommand,
  execute: async ({ command, args = [] }) => {
    const commands = {
      'git-status': () => $`git status --short`.text(),
      'git-diff': () => $`git diff ${args[0] || 'HEAD'}`.text(),
      'npm-outdated': () => $`npm outdated`.text(),
      'bundle-size': () => $`du -sh dist/`.text(),
    };

    const result = await commands[command]();
    return { command, output: result };
  }
});
```

## Mastra Agent with Structured Output

Create `app/mastra/agents/file-agent.ts`:

```typescript
import { createAgent } from '@mastra/core';
import { AgentPlanSchema } from '../../../mastra.config';
import { searchFilesTool, executeCommandTool } from '../tools/file-tools';

export const fileAgent = createAgent({
  id: 'file-agent',
  description: 'Manages files with semantic search and analysis',
  tools: [searchFilesTool, executeCommandTool],

  systemPrompt: `You are a file management assistant with vector search capabilities.
    When given a task, create a structured plan using the available tools.
    Always respond with valid JSON matching the AgentPlanSchema.`,

  async generatePlan(query: string) {
    // Get structured output from LLM
    const response = await this.llm.generateStructured({
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: query }
      ],
      schema: AgentPlanSchema,
      schemaName: 'agent_plan'
    });

    return response.object;
  },

  async execute(query: string) {
    // Generate structured plan
    const plan = await this.generatePlan(query);

    // Execute each step
    const results = [];
    for (const step of plan.steps) {
      const tool = this.tools.find(t => t.id === step.tool);
      if (tool) {
        const result = await tool.execute(step.parameters);
        results.push({ step: step.tool, result });
      }
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
});
```

## TanStack Start Server Functions

Create `app/lib/server-functions.ts`:

```typescript
import { createServerFn } from '@tanstack/start';
import { fileAgent } from '../mastra/agents/file-agent';
import { db, initDB } from './db';
import OpenAI from 'openai';

const openai = new OpenAI();

// Initialize on server start
await initDB();

// Generate embeddings
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}

// Index a file
export const indexFile = createServerFn(
  'POST',
  async ({ path, content }: { path: string; content: string }) => {
    // Generate summary using LLM
    const summary = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Summarize this file in 2 sentences' },
        { role: 'user', content: content.slice(0, 4000) }
      ],
      max_tokens: 100,
    });

    const summaryText = summary.choices[0].message.content;
    const embedding = await generateEmbedding(`${path} ${summaryText} ${content}`);

    await db.execute({
      sql: `INSERT OR REPLACE INTO files (path, content, summary, embedding, metadata)
            VALUES (?, ?, ?, vector(?), ?)`,
      args: [
        path,
        content,
        summaryText,
        JSON.stringify(embedding),
        JSON.stringify({
          type: path.split('.').pop(),
          size: content.length,
          lines: content.split('\n').length
        })
      ]
    });

    return { indexed: true, summary: summaryText };
  }
);

// Execute agent query with structured output
export const executeAgentQuery = createServerFn(
  'POST',
  async ({ query }: { query: string }) => {
    const result = await fileAgent.execute(query);
    return result;
  }
);

// Get agent history
export const getAgentHistory = createServerFn(
  'GET',
  async () => {
    const results = await db.execute(
      'SELECT * FROM agent_runs ORDER BY created_at DESC LIMIT 20'
    );
    return results.rows;
  }
);
```

## Main UI Component

Create `app/routes/index.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { executeAgentQuery, getAgentHistory, indexFile } from '../lib/server-functions';

export const Route = createFileRoute('/')({
  component: AgentInterface,
});

function AgentInterface() {
  const [query, setQuery] = useState('');
  const [currentPlan, setCurrentPlan] = useState(null);

  const { data: history } = useQuery({
    queryKey: ['agent-history'],
    queryFn: getAgentHistory,
  });

  const executeMutation = useMutation({
    mutationFn: executeAgentQuery,
    onSuccess: (data) => {
      setCurrentPlan(data);
    },
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI File Agent</h1>

      {/* Query Input */}
      <div className="mb-8">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask the agent: Find all React components with hooks, Show git changes in TypeScript files, etc."
          className="w-full p-4 border rounded-lg h-24"
        />
        <button
          onClick={() => executeMutation.mutate({ query })}
          disabled={!query || executeMutation.isPending}
          className="mt-2 px-6 py-2 bg-blue-500 text-white rounded-lg"
        >
          {executeMutation.isPending ? 'Agent Thinking...' : 'Execute'}
        </button>
      </div>

      {/* Current Plan Display */}
      {currentPlan && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Execution Plan</h2>
          <div className="space-y-2">
            <p><strong>Understanding:</strong> {currentPlan.plan.understanding}</p>
            <div>
              <strong>Steps:</strong>
              {currentPlan.plan.steps.map((step, i) => (
                <div key={i} className="ml-4 mt-2 p-2 bg-white rounded">
                  <div className="font-medium">{step.tool}</div>
                  <div className="text-sm text-gray-600">{step.reasoning}</div>
                  <pre className="text-xs mt-1 p-1 bg-gray-100 rounded">
                    {JSON.stringify(step.parameters, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="mt-4">
            <strong>Results:</strong>
            <pre className="mt-2 p-2 bg-white rounded text-sm">
              {JSON.stringify(currentPlan.results, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Recent Queries</h2>
        <div className="space-y-2">
          {history?.map((run: any) => (
            <div key={run.id} className="p-3 border rounded-lg">
              <div className="font-medium">{run.query}</div>
              <div className="text-sm text-gray-500">
                {new Date(run.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Development Workflow

```bash
# 1. Start the dev server with hot reload
bun dev

# 2. In another terminal, watch for Mastra changes
npx @mastra/cli dev

# 3. The app runs at http://localhost:3000
# All changes hot reload instantly
```

## Example Agent Queries

The agent understands natural language and creates structured plans:

- "Find all TypeScript files that use React hooks and show their complexity"
- "Search for authentication-related code and check git status"
- "Analyze performance bottlenecks in components folder"
- "Show me files similar to auth.ts and their recent changes"

## Key Features

1. **Vector Search**: Semantic file search using libSQL native vectors
2. **Structured LLM Output**: Always returns valid JSON matching schemas
3. **Tool Execution**: Agent executes tools based on structured plans
4. **Hot Reload**: Everything updates instantly in dev mode
5. **Single File DB**: All data in one SQLite file (agent.db)
6. **Agent Memory**: Stores all queries and executions for learning

## Architecture Benefits

- **No Build Step**: Runs directly with Bun in dev mode
- **Type Safety**: Full TypeScript with Zod schemas
- **Local First**: Everything runs on your machine
- **Instant Changes**: Edit code while using the app
- **Single DB File**: Easy backup/restore of entire system