import { ClaudeChat, createStreamingConversation } from '../services/claude.service';
import { query } from '@anthropic-ai/claude-code';
import type { ClaudeMessage } from '../types';

async function main() {
  // Example 1: Multi-turn chat with session management
  const chat = new ClaudeChat({
    onHook: (type, data) => {
      if (type === 'system' && data.subtype === 'init') {
        console.log(`Session started: ${data.session_id}`);
        console.log(`Available tools: ${data.tools.join(', ')}`);
      } else if (type === 'result') {
        console.log(`Result (${data.subtype}): Cost: $${data.total_cost_usd}, Duration: ${data.duration_ms}ms`);
      }
    }
  });
  
  console.log('Starting multi-turn chat with Claude...\n');
  
  // First message - starts a new session
  console.log('User: Help me understand TypeScript generics');
  let response = await chat.sendMessage(
    'Help me understand TypeScript generics',
    { maxTurns: 3 }
  );
  
  if (response.success) {
    console.log(`Assistant: ${response.result}\n`);
    console.log(`Session ID: ${chat.getSessionId()}\n`);
  }
  
  // Continue the same session
  console.log('User: Can you show me a practical example?');
  response = await chat.sendMessage('Can you show me a practical example?');
  
  if (response.success) {
    console.log(`Assistant: ${response.result}\n`);
  }
  
  // Show conversation history
  console.log('\n--- Conversation History ---');
  const history = chat.getHistory();
  history.forEach((msg, index) => {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    console.log(`${index + 1}. ${msg.role}: ${content.substring(0, 100)}...`);
  });
}

// Example 2: Using streaming input for dynamic conversations
async function streamingExample() {
  console.log('\n--- Streaming Input Example ---\n');
  
  // Create an async generator for streaming messages
  async function* generateMessages(): AsyncGenerator<any> {
    yield {
      type: "user" as const,
      message: {
        role: "user" as const,
        content: "Analyze the performance of this TypeScript code: const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);"
      }
    };
    
    // Simulate waiting for additional input
    await new Promise(resolve => setTimeout(resolve, 100));
    
    yield {
      type: "user" as const,
      message: {
        role: "user" as const,
        content: "Now optimize it for large arrays"
      }
    };
  }
  
  // Use streaming input with the query function directly
  for await (const message of query({
    prompt: generateMessages(),
    options: {
      maxTurns: 5,
      allowedTools: ["Read", "Grep"]
    }
  })) {
    if (message.type === "result") {
      console.log('Final result:', message.result);
      console.log(`Total cost: $${message.total_cost_usd}`);
    } else if (message.type === "system" && message.subtype === "init") {
      console.log(`Session initialized: ${message.session_id}`);
    }
  }
}

// Example 3: Continuing a previous session
async function continueSessionExample() {
  console.log('\n--- Continue Session Example ---\n');
  
  // Start a new chat and get the session ID
  const initialChat = new ClaudeChat();
  await initialChat.sendMessage('Explain React hooks briefly');
  const sessionId = initialChat.getSessionId();
  
  if (!sessionId) {
    console.error('No session ID available');
    return;
  }
  
  console.log(`Original session ID: ${sessionId}\n`);
  
  // Later, resume the same session
  const resumedChat = new ClaudeChat({ sessionId });
  const response = await resumedChat.sendMessage(
    'Now explain useEffect in detail',
    { maxTurns: 2 }
  );
  
  if (response.success) {
    console.log('Resumed conversation:', response.result);
  }
}

// Run the examples
if (require.main === module) {
  (async () => {
    await main().catch(console.error);
    await streamingExample().catch(console.error);
    await continueSessionExample().catch(console.error);
  })();
}

export { main, streamingExample, continueSessionExample };