# Claude Code SDK - Complete Documentation

## Overview

Claude Code is an agentic coding tool that integrates with your terminal to understand your codebase and accelerate development through natural language commands. This document provides comprehensive documentation for the Claude Code SDK.

## Package Information

- **Package Name**: `@anthropic-ai/claude-code`
- **Current Version**: 1.0.117
- **License**: See LICENSE in README.md
- **Requirements**: Node.js 18+
- **TypeScript Support**: Full support included

## Installation

### Global Installation (Recommended for CLI)
```bash
npm install -g @anthropic-ai/claude-code
```

### Project Installation (For SDK usage)
```bash
npm install @anthropic-ai/claude-code
```

## Core Features

- **Codebase Understanding**: Analyzes and understands your entire project structure
- **Task Execution**: Performs routine coding tasks automatically
- **Code Explanation**: Provides detailed explanations of complex code
- **Git Workflow Management**: Handles git operations through natural language
- **Natural Language Interface**: Accepts commands in plain English

## SDK Options

### 1. Headless Mode
For CLI scripts and automation workflows

### 2. TypeScript SDK
For Node.js and web applications with full type safety

### 3. Python SDK
For Python applications and data science workflows

## TypeScript SDK API Reference

### Primary Functions

#### `query()` Function
The primary function for interacting with Claude Code.

```typescript
function query({
  prompt,
  options
}: {
  prompt: string | AsyncIterable<SDKUserMessage>;
  options?: Options;
}): Query
```

**Returns**: A Query object that extends `AsyncGenerator<SDKMessage, void>` with additional methods.

**Usage Example**:
```typescript
import { query } from "@anthropic-ai/claude-code";

// Simple usage
for await (const message of query({
  prompt: "Review this code for issues",
  options: {
    systemPrompt: "You are a code review assistant"
  }
})) {
  // Process streaming messages
  console.log(message);
}
```

#### `tool()` Function
Creates a type-safe MCP tool definition for use with SDK MCP servers.

```typescript
function tool<Schema extends ZodRawShape>(
  name: string,
  description: string,
  inputSchema: Schema,
  handler: (
    args: z.infer<ZodObject<Schema>>,
    extra: unknown
  ) => Promise<CallToolResult>
): SdkMcpToolDefinition<Schema>
```

**Example**:
```typescript
import { tool } from "@anthropic-ai/claude-code";
import { z } from "zod";

const analyzeCodeTool = tool(
  "analyze-code",
  "Analyzes code for potential issues",
  {
    filePath: z.string(),
    analysisType: z.enum(["security", "performance", "style"])
  },
  async ({ filePath, analysisType }) => {
    // Tool implementation
    const results = await performAnalysis(filePath, analysisType);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(results)
      }]
    };
  }
);
```

#### `createSdkMcpServer()` Function
Creates an MCP server instance that runs in the same process as your application.

```typescript
function createSdkMcpServer(options: {
  name: string;
  version?: string;
  tools?: Array<SdkMcpToolDefinition<any>>;
}): McpSdkServerConfigWithInstance
```

**Example**:
```typescript
const mcpServer = createSdkMcpServer({
  name: "my-code-assistant",
  version: "1.0.0",
  tools: [analyzeCodeTool, formatCodeTool, lintCodeTool]
});
```

## Message Types

### SDKSystemMessage
Initialization messages for system configuration.

```typescript
interface SDKSystemMessage {
  type: "system";
  content: string;
  timestamp?: number;
}
```

### SDKPartialAssistantMessage
Streaming partial messages (only when `includePartialMessages` is true).

```typescript
interface SDKPartialAssistantMessage {
  type: "partial";
  content: string;
  isComplete: boolean;
}
```

### SDKCompactBoundaryMessage
Marks conversation compaction boundaries.

```typescript
interface SDKCompactBoundaryMessage {
  type: "boundary";
  reason: string;
  timestamp: number;
}
```

### SDKUserMessage
User input messages.

```typescript
interface SDKUserMessage {
  type: "user";
  content: string;
  attachments?: Array<Attachment>;
}
```

### SDKAssistantMessage
Complete assistant responses.

```typescript
interface SDKAssistantMessage {
  type: "assistant";
  content: string;
  toolCalls?: Array<ToolCall>;
}
```

## Configuration Options

### Query Options

```typescript
interface Options {
  // System configuration
  systemPrompt?: string;

  // Model settings
  model?: "claude-3-opus" | "claude-3-sonnet" | "claude-3-haiku";
  temperature?: number; // 0.0 to 1.0
  maxTokens?: number;

  // Streaming options
  includePartialMessages?: boolean;
  streamInterval?: number; // milliseconds

  // Tool configuration
  allowedTools?: string[];
  disallowedTools?: string[];
  permissionMode?: "allow" | "deny" | "ask";

  // Session management
  sessionId?: string;
  resumeFrom?: string; // Resume from specific message ID

  // Memory and context
  maxContextSize?: number;
  persistMemory?: boolean;
  memoryPath?: string; // Default: "./CLAUDE.md"

  // Hooks
  hooks?: {
    preToolUse?: (tool: string, args: any) => Promise<void>;
    postToolUse?: (tool: string, result: any) => Promise<void>;
    userPromptSubmit?: (prompt: string) => Promise<string>;
    sessionStart?: () => Promise<void>;
  };
}
```

## Authentication

### Claude API Key (Default)
```typescript
// Set environment variable
process.env.ANTHROPIC_API_KEY = "your-api-key";

// Or pass directly
const result = query({
  prompt: "...",
  options: {
    apiKey: "your-api-key" // Not recommended for production
  }
});
```

### Amazon Bedrock
```typescript
process.env.CLAUDE_CODE_USE_BEDROCK = "1";
process.env.AWS_ACCESS_KEY_ID = "your-access-key";
process.env.AWS_SECRET_ACCESS_KEY = "your-secret-key";
process.env.AWS_REGION = "us-east-1";
```

### Google Vertex AI
```typescript
process.env.CLAUDE_CODE_USE_VERTEX = "1";
process.env.GOOGLE_APPLICATION_CREDENTIALS = "/path/to/credentials.json";
process.env.VERTEX_PROJECT_ID = "your-project-id";
process.env.VERTEX_LOCATION = "us-central1";
```

## Tool Permissions

### Allow Specific Tools
```typescript
const result = query({
  prompt: "Analyze this code",
  options: {
    permissionMode: "deny",
    allowedTools: ["read_file", "list_files", "run_command"]
  }
});
```

### Block Specific Tools
```typescript
const result = query({
  prompt: "Help me code",
  options: {
    permissionMode: "allow",
    disallowedTools: ["delete_file", "write_file"]
  }
});
```

### Interactive Permission Mode
```typescript
const result = query({
  prompt: "Refactor this project",
  options: {
    permissionMode: "ask" // Prompts user for each tool use
  }
});
```

## Hooks System

### Available Hooks

#### PreToolUse Hook
Called before any tool execution.

```typescript
hooks: {
  preToolUse: async (toolName, args) => {
    console.log(`About to use tool: ${toolName}`);
    console.log("Arguments:", args);

    // Validation example
    if (toolName === "delete_file" && args.path.includes("critical")) {
      throw new Error("Cannot delete critical files");
    }
  }
}
```

#### PostToolUse Hook
Called after tool execution completes.

```typescript
hooks: {
  postToolUse: async (toolName, result) => {
    console.log(`Tool ${toolName} completed`);
    console.log("Result:", result);

    // Logging example
    await logToolUsage(toolName, result);
  }
}
```

#### UserPromptSubmit Hook
Modifies user prompts before processing.

```typescript
hooks: {
  userPromptSubmit: async (originalPrompt) => {
    // Add context to every prompt
    return `Project: ${projectName}\n${originalPrompt}`;
  }
}
```

#### SessionStart Hook
Initializes session-specific resources.

```typescript
hooks: {
  sessionStart: async () => {
    console.log("New session started");
    await initializeProjectContext();
  }
}
```

## Advanced Features

### Multi-turn Conversations

```typescript
import { query } from "@anthropic-ai/claude-code";

async function interactiveSession() {
  const messages = [];

  // First turn
  for await (const msg of query({
    prompt: "What files are in this project?"
  })) {
    messages.push(msg);
    if (msg.type === "assistant") {
      console.log(msg.content);
    }
  }

  // Continue conversation
  for await (const msg of query({
    prompt: messages.concat([{
      type: "user",
      content: "Now analyze the main file"
    }])
  })) {
    if (msg.type === "assistant") {
      console.log(msg.content);
    }
  }
}
```

### Session Management

```typescript
// Start a new session
const sessionId = generateSessionId();

const firstQuery = query({
  prompt: "Start a code review",
  options: { sessionId }
});

// Resume the same session later
const resumedQuery = query({
  prompt: "Continue the review",
  options: {
    sessionId,
    resumeFrom: lastMessageId
  }
});
```

### Custom MCP Tools

```typescript
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-code";
import { z } from "zod";

// Define custom tools
const customTools = [
  tool(
    "database-query",
    "Execute database queries",
    {
      query: z.string(),
      database: z.enum(["production", "staging", "development"])
    },
    async ({ query, database }) => {
      const results = await executeQuery(query, database);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(results)
        }]
      };
    }
  ),

  tool(
    "deploy-code",
    "Deploy code to environment",
    {
      environment: z.enum(["staging", "production"]),
      version: z.string()
    },
    async ({ environment, version }) => {
      const deployResult = await deploy(environment, version);
      return {
        content: [{
          type: "text",
          text: `Deployed ${version} to ${environment}`
        }]
      };
    }
  )
];

// Create server with custom tools
const server = createSdkMcpServer({
  name: "custom-dev-tools",
  version: "1.0.0",
  tools: customTools
});
```

### Stream Processing

```typescript
import { query } from "@anthropic-ai/claude-code";

async function processStream() {
  const generator = query({
    prompt: "Generate a comprehensive test suite",
    options: {
      includePartialMessages: true,
      streamInterval: 100 // Update every 100ms
    }
  });

  for await (const message of generator) {
    switch (message.type) {
      case "partial":
        // Update UI with partial response
        updateProgress(message.content);
        break;

      case "assistant":
        // Final complete message
        displayResult(message.content);
        break;

      case "tool_use":
        // Tool being used
        logToolUsage(message);
        break;
    }
  }
}
```

## Subagents

Subagents are specialized agents stored in `./.claude/agents/` that handle specific tasks.

### Creating a Subagent

```typescript
// .claude/agents/security-reviewer.js
export default {
  name: "security-reviewer",
  description: "Reviews code for security vulnerabilities",
  systemPrompt: `You are a security expert.
    Focus on identifying potential vulnerabilities,
    insecure patterns, and security best practices.`,
  tools: ["read_file", "search_code", "analyze_dependencies"],

  async process(prompt, context) {
    // Custom processing logic
    return await analyzeSecurityIssues(prompt, context);
  }
};
```

### Using Subagents

```typescript
const result = query({
  prompt: "@security-reviewer Check this authentication code",
  options: {
    // Subagent configuration is automatically loaded
  }
});
```

## Slash Commands

Custom slash commands extend Claude Code's functionality.

### Defining Slash Commands

```typescript
// .claude/commands/test.js
export default {
  name: "test",
  description: "Run project tests",

  async execute(args, context) {
    const testType = args[0] || "all";

    switch (testType) {
      case "unit":
        return await runUnitTests();
      case "integration":
        return await runIntegrationTests();
      case "all":
        return await runAllTests();
      default:
        throw new Error(`Unknown test type: ${testType}`);
    }
  }
};
```

### Using Slash Commands

```typescript
const result = query({
  prompt: "/test unit"
});
```

## Memory Management

### Persistent Memory with CLAUDE.md

Claude Code uses `CLAUDE.md` files to maintain context across sessions.

```typescript
const result = query({
  prompt: "Remember this project uses TypeScript strict mode",
  options: {
    persistMemory: true,
    memoryPath: "./CLAUDE.md" // Default location
  }
});
```

### Memory File Structure
```markdown
# Project Context

## Configuration
- TypeScript strict mode enabled
- ESLint with Airbnb config
- Jest for testing

## Recent Decisions
- 2024-01-15: Migrated to ESM modules
- 2024-01-20: Added CI/CD pipeline

## Known Issues
- Performance bottleneck in data processing module
- Flaky test in authentication suite
```

## Error Handling

### Basic Error Handling

```typescript
try {
  for await (const message of query({ prompt: "..." })) {
    // Process messages
  }
} catch (error) {
  if (error.code === "RATE_LIMIT") {
    console.error("Rate limit exceeded");
    await delay(error.retryAfter);
  } else if (error.code === "INVALID_API_KEY") {
    console.error("Invalid API key");
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### Tool Error Handling

```typescript
hooks: {
  postToolUse: async (toolName, result) => {
    if (result.error) {
      console.error(`Tool ${toolName} failed:`, result.error);

      // Retry logic
      if (result.retryable) {
        return await retryTool(toolName, result.originalArgs);
      }
    }
  }
}
```

## Best Practices

### 1. Security
- Never hardcode API keys
- Use environment variables for sensitive data
- Implement tool permission restrictions
- Validate tool inputs in hooks

### 2. Performance
- Use streaming for long-running operations
- Implement proper error retry logic
- Cache frequently accessed data
- Limit context size for better performance

### 3. User Experience
- Provide clear prompts
- Use partial messages for progress updates
- Implement proper error messages
- Log important operations

### 4. Code Organization
- Organize subagents by functionality
- Keep slash commands focused
- Maintain clean CLAUDE.md files
- Document custom tools thoroughly

## Production Deployment

### Environment Setup

```typescript
// production.config.js
export default {
  api: {
    key: process.env.ANTHROPIC_API_KEY,
    endpoint: process.env.API_ENDPOINT || "https://api.anthropic.com",
    timeout: 30000,
    retries: 3
  },

  tools: {
    permissionMode: "deny",
    allowedTools: [
      "read_file",
      "search_code",
      "run_tests"
    ]
  },

  memory: {
    persist: true,
    path: "/var/claude/memory",
    maxSize: "10MB"
  },

  logging: {
    level: "info",
    destination: "/var/log/claude-code"
  }
};
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

ENV NODE_ENV=production
ENV ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

CMD ["node", "server.js"]
```

### Monitoring

```typescript
import { query } from "@anthropic-ai/claude-code";
import { metrics } from "./monitoring";

const monitoredQuery = async (prompt, options) => {
  const startTime = Date.now();

  try {
    const result = await query({ prompt, options });

    metrics.recordSuccess({
      duration: Date.now() - startTime,
      promptLength: prompt.length
    });

    return result;
  } catch (error) {
    metrics.recordError({
      error: error.message,
      code: error.code
    });

    throw error;
  }
};
```

## Troubleshooting

### Common Issues

#### 1. Rate Limiting
```typescript
// Implement exponential backoff
async function queryWithRetry(prompt, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await query({ prompt, options });
    } catch (error) {
      if (error.code === "RATE_LIMIT" && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

#### 2. Context Overflow
```typescript
// Manage context size
const result = query({
  prompt: "...",
  options: {
    maxContextSize: 100000, // Limit context to 100K tokens
    compactAfter: 50000 // Compact when reaching 50K tokens
  }
});
```

#### 3. Tool Failures
```typescript
// Graceful tool failure handling
hooks: {
  postToolUse: async (tool, result) => {
    if (result.error) {
      // Log error
      console.error(`Tool ${tool} failed:`, result.error);

      // Fallback strategy
      if (tool === "primary_tool") {
        return await useFallbackTool(result.originalArgs);
      }
    }
  }
}
```

## Migration Guide

### From CLI to SDK

```typescript
// CLI command
// $ claude "review this code"

// Equivalent SDK usage
import { query } from "@anthropic-ai/claude-code";

for await (const message of query({
  prompt: "review this code"
})) {
  if (message.type === "assistant") {
    console.log(message.content);
  }
}
```

### From v0.x to v1.x

```typescript
// Old API (v0.x)
const result = await claude.ask("...");

// New API (v1.x)
for await (const message of query({ prompt: "..." })) {
  // Process streaming messages
}
```

## Support and Resources

- **Documentation**: https://docs.anthropic.com/claude-code
- **NPM Package**: https://www.npmjs.com/package/@anthropic-ai/claude-code
- **GitHub Issues**: Report bugs via `/bug` command in CLI
- **Community**: Join discussions on Discord/Slack

## Data Privacy

- Usage feedback is collected to improve the service
- User feedback transcripts are stored for 30 days
- Feedback is not used for model training
- All data handling follows Anthropic's privacy policy

## License

See LICENSE in README.md for full license information.

---

*Note: Claude Code is currently in beta. Features and APIs may change. Always refer to the latest documentation for the most up-to-date information.*