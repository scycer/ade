# LanceDB Documentation for JavaScript/TypeScript

## Overview
LanceDB is a serverless, low-latency vector database for AI applications. It's designed for fast, scalable, and production-ready vector search, built on top of the Lance columnar format.

## Installation

### Recommended Package (New)
```bash
npm install @lancedb/lancedb
```

### Legacy Package (Deprecated)
```bash
npm install vectordb
```

Note: The `vectordb` package is deprecated. Use `@lancedb/lancedb` for new projects.

## Platform Support
- Linux (x86_64 and aarch64)
- MacOS (Intel and ARM/M1/M2)
- Windows (x86_64 only)
- NOT supported: musl-based Linux (Alpine), aarch64 Windows

## Basic Usage

### Import and Connect
```typescript
import * as lancedb from "@lancedb/lancedb";

// Connect to database
const db = await lancedb.connect("data/sample-lancedb");
```

### Create Table with Data
```typescript
const table = await db.createTable("my_table", [
  { id: 1, vector: [0.1, 1.0], item: "foo", price: 10.0 },
  { id: 2, vector: [3.9, 0.5], item: "bar", price: 20.0 },
]);
```

### Create Empty Table with Schema
```typescript
import { LanceSchema, func, Utf8 } from "@lancedb/lancedb";

const schema = LanceSchema({
  text: func.sourceField(new Utf8()),
  vector: func.vectorField()
});

const emptyTable = await db.createEmptyTable("words", schema);
```

### Add Data to Table
```typescript
await table.add([
  { id: 3, vector: [1.3, 1.4], item: "fizz", price: 100.0 },
  { id: 4, vector: [9.5, 56.2], item: "buzz", price: 200.0 }
]);
```

### Vector Search
```typescript
// Basic vector search
const results = await table.vectorSearch([0.1, 0.3])
  .limit(20)
  .toArray();

// Alternative syntax (new client)
const results = await table.search([100, 100])
  .limit(2)
  .toArray();
```

## Configuration for Next.js/Vercel

For Next.js applications and Vercel deployments, configure webpack to exclude LanceDB:

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
  webpack(config) {
    // For new package
    config.externals.push({ '@lancedb/lancedb': '@lancedb/lancedb' })
    // For legacy package
    // config.externals.push({ vectordb: 'vectordb' })
    return config;
  }
}
```

## Yarn Users Note
If using Yarn, manually install Apache Arrow as Yarn doesn't automatically resolve peer dependencies:
```bash
yarn add apache-arrow
```

## Brain Architecture Integration Pattern

### Dependencies Interface
```typescript
interface BrainDependencies {
  db: {
    createNode: (data: DbNodeInput) => Promise<DbNode>;
    updateNode: (id: string, data: DbNodeUpdate) => Promise<DbNode>;
    getNode: (id: string) => Promise<DbNode | null>;
    queryNodes: (filter: DbQueryFilter) => Promise<DbNode[]>;
    createEdge: (from: string, to: string, type: string) => Promise<void>;
  };
  llm: {
    generateSuggestion: (content: string, hint?: string) => Promise<AiSuggestion | null>;
    refineContent: (content: string, prompt: string) => Promise<string>;
  };
}
```

### Node Schema for LanceDB
```typescript
interface DbNode {
  id: string;
  type: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];  // Vector for semantic search
  created_at: Date;
  updated_at: Date;
}

interface DbEdge {
  from_id: string;
  to_id: string;
  type: string;
  metadata?: Record<string, any>;
  created_at: Date;
}
```

### LanceDB Adapter Implementation Example
```typescript
class LanceDBAdapter {
  private db: any;
  private nodesTable: any;
  private edgesTable: any;

  async connect(uri: string) {
    this.db = await lancedb.connect(uri);

    // Initialize tables
    try {
      this.nodesTable = await this.db.openTable("nodes");
      this.edgesTable = await this.db.openTable("edges");
    } catch {
      // Create tables if they don't exist
      await this.createTables();
    }
  }

  private async createTables() {
    // Create nodes table with vector field
    this.nodesTable = await this.db.createTable("nodes", [
      {
        id: "init",
        type: "system",
        content: "Initial node",
        metadata: {},
        embedding: new Array(1536).fill(0), // OpenAI embedding dimension
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Create edges table
    this.edgesTable = await this.db.createTable("edges", [
      {
        from_id: "init",
        to_id: "init",
        type: "self",
        metadata: {},
        created_at: new Date()
      }
    ]);
  }

  async createNode(data: DbNodeInput): Promise<DbNode> {
    const node = {
      id: crypto.randomUUID(),
      ...data,
      embedding: data.embedding || new Array(1536).fill(0),
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.nodesTable.add([node]);
    return node;
  }

  async queryNodesByVector(vector: number[], limit: number = 10): Promise<DbNode[]> {
    const results = await this.nodesTable
      .vectorSearch(vector)
      .limit(limit)
      .toArray();
    return results;
  }

  async queryNodes(filter: DbQueryFilter): Promise<DbNode[]> {
    // For non-vector queries, use filter conditions
    const results = await this.nodesTable
      .query()
      .where(filter)
      .toArray();
    return results;
  }
}
```

## Best Practices

1. **Connection Management**: Keep database connections alive during the application lifecycle
2. **Vector Dimensions**: Ensure consistent vector dimensions across your application
3. **Indexing**: Create indices for frequently queried fields
4. **Batch Operations**: Use batch inserts for better performance
5. **Error Handling**: Always wrap database operations in try-catch blocks

## Common Use Cases

1. **Semantic Search**: Store text embeddings for similarity search
2. **Recommendation Systems**: Find similar items based on vector representations
3. **RAG (Retrieval Augmented Generation)**: Retrieve relevant context for LLM prompts
4. **Multi-modal Search**: Store and search across text, images, and other data types

## Troubleshooting

### Module Not Found Error
- Ensure you've installed the correct package: `@lancedb/lancedb`
- For Next.js, check webpack configuration

### Platform Compatibility
- Alpine Linux users: Use a different base image (LanceDB doesn't support musl)
- Windows ARM users: Not yet supported

### Vector Dimension Mismatch
- Ensure all vectors have the same dimension
- Check embedding model output dimensions

## Resources

- GitHub: https://github.com/lancedb/lancedb
- Documentation: https://lancedb.github.io/lancedb/
- NPM (new): https://www.npmjs.com/package/@lancedb/lancedb
- NPM (legacy): https://www.npmjs.com/package/vectordb
- Examples: https://github.com/lancedb/vectordb-recipes