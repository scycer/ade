# Multi-Turn Chat Implementation

## Overview
The Claude service has been updated to support multi-turn conversations with the Claude Code SDK, featuring session management, hook callbacks, and unlimited turn limits.

## Key Features

### 1. Multi-Turn Conversations with Session Management
- Sessions are automatically created and tracked
- Resume previous sessions using `resumeSessionId`
- Continue the most recent session with `continueSession: true`
- No turn limits by default (`maxTurns: 999`)

### 2. Hook Callback System
All SDK messages can be monitored via the `onHook` callback:
- `system` messages (init, session info)
- `assistant` messages
- `user` messages
- `result` messages (success/error with metadata)

### 3. Streaming Input Support
Support for dynamic, streaming conversations using async generators.

## Usage Examples

### Basic Multi-Turn Chat
```typescript
import { ClaudeChat } from './services/claude.service';

const chat = new ClaudeChat({
  onHook: (type, data) => {
    console.log(`[${type}]`, data);
  }
});

// Send first message
const response1 = await chat.sendMessage('Explain TypeScript generics');
console.log(response1.result);

// Continue conversation in same session
const response2 = await chat.sendMessage('Show me a practical example');
console.log(response2.result);

// Get session ID for later resumption
const sessionId = chat.getSessionId();
```

### Resume Previous Session
```typescript
// Resume a specific session
const resumedChat = new ClaudeChat({ 
  sessionId: 'previous-session-id' 
});

const response = await resumedChat.sendMessage('Continue from where we left off');
```

### Streaming Input (Advanced)
```typescript
import { query } from '@anthropic-ai/claude-code';

async function* generateMessages() {
  yield {
    type: "user",
    message: {
      role: "user",
      content: "First message"
    }
  };
  
  // Dynamic message generation
  await someAsyncOperation();
  
  yield {
    type: "user",
    message: {
      role: "user",
      content: "Follow-up message"
    }
  };
}

for await (const message of query({
  prompt: generateMessages(),
  options: { maxTurns: 999 }
})) {
  if (message.type === "result") {
    console.log(message.result);
  }
}
```

## API Reference

### ClaudeChat Class

#### Constructor
```typescript
new ClaudeChat(options?: {
  onHook?: (type: string, data: any) => void;
  sessionId?: string;
})
```

#### Methods
- `sendMessage(prompt: string, options?: Partial<ClaudeQueryOptions>): Promise<ClaudeResponse>`
- `getSessionId(): string | undefined`
- `getHistory(): Array<{ role: 'user' | 'assistant', content: string }>`
- `clearSession(): void`

### Types

```typescript
interface ClaudeQueryOptions {
  prompt: string | AsyncIterable<any>;
  maxTurns?: number;              // Default: 999 (unlimited)
  allowedTools?: string[];
  onHook?: (type: string, data: any) => void;
  continueSession?: boolean;
  resumeSessionId?: string;
}

interface ClaudeResponse {
  success: boolean;
  result?: string;
  error?: string;
  sessionId?: string;
}
```

## Hook Events

The `onHook` callback receives various message types:

### System Messages
```typescript
{
  type: "system",
  subtype: "init",
  session_id: string,
  tools: string[],
  model: string,
  // ... other metadata
}
```

### Result Messages
```typescript
{
  type: "result",
  subtype: "success" | "error_max_turns" | "error_during_execution",
  result?: string,
  total_cost_usd: number,
  duration_ms: number,
  // ... other metrics
}
```

## Mock Weather Tool Example

While the SDK doesn't directly support custom tool execution in the client, you can define tool schemas for the API:

```typescript
import { getWeatherToolDefinition, getMockWeatherData } from './services/claude.service';

// Tool definition for API
const weatherTool = getWeatherToolDefinition();

// Generate mock data
const weather = getMockWeatherData('San Francisco, CA', 'fahrenheit');
```

## Configuration

The service uses the configuration from `claude.config.ts`:
- Default max turns: 999 (effectively unlimited)
- Executable path auto-detected
- All Claude Code SDK options supported

## Testing

Run the examples:
```bash
# Simple test
bun run src/examples/simple-test.ts

# Full examples (requires API key)
bun run src/examples/multi-turn-chat.example.ts
```

## Notes

- The implementation follows the official Claude Code SDK patterns
- Sessions persist across messages automatically
- No artificial turn limits unless specified
- All SDK message types are accessible via hooks
- Compatible with both string prompts and streaming inputs