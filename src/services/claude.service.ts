import { query } from '@anthropic-ai/claude-code';
import type { ClaudeResponse, ClaudeQueryOptions, ClaudeMessage } from '../types';
import { claudeConfig } from '../config/claude.config';

export async function queryClaude(options: ClaudeQueryOptions): Promise<ClaudeResponse> {
  try {
    let result = '';
    let sessionId = '';
    
    for await (const msg of query({
      prompt: options.prompt,
      options: {
        ...claudeConfig.defaultOptions,
        pathToClaudeCodeExecutable: claudeConfig.pathToClaudeCodeExecutable,
        executable: claudeConfig.executable,
        maxTurns: options.maxTurns === undefined ? 999 : options.maxTurns,
        allowedTools: options.allowedTools,
        continueSession: options.continueSession,
        resumeSessionId: options.resumeSessionId
      }
    })) {
      // Capture session ID from init message
      if (msg.type === "system" && msg.subtype === "init") {
        sessionId = msg.session_id;
      }
      
      // Log all messages if callback provided
      if (options.onHook) {
        options.onHook(msg.type, msg);
      }
      
      if (msg.type === "result") {
        if (msg.subtype === "success") {
          result = msg.result;
          return { success: true, result, sessionId };
        } else {
          return { success: false, error: `Query failed: ${msg.subtype}`, sessionId };
        }
      }
    }
    
    return { success: false, error: 'No result received from Claude', sessionId };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

export function isClaudeAvailable(): boolean {
  try {
    // Check if the Claude Code executable exists
    const fs = require('fs');
    return fs.existsSync(claudeConfig.pathToClaudeCodeExecutable);
  } catch {
    return false;
  }
}

// Helper class for multi-turn chat using session management
export class ClaudeChat {
  private sessionId?: string;
  private onHook?: (type: string, data: any) => void;
  private messageHistory: Array<{ role: 'user' | 'assistant', content: string }> = [];
  
  constructor(options?: {
    onHook?: (type: string, data: any) => void;
    sessionId?: string;
  }) {
    this.onHook = options?.onHook;
    this.sessionId = options?.sessionId;
  }
  
  async sendMessage(prompt: string, options?: Partial<ClaudeQueryOptions>): Promise<ClaudeResponse> {
    const queryOptions: ClaudeQueryOptions = {
      prompt,
      onHook: this.onHook,
      maxTurns: undefined, // No limit by default
      ...options
    };
    
    // Use session continuation if we have a session ID
    if (this.sessionId) {
      queryOptions.resumeSessionId = this.sessionId;
    }
    
    const response = await queryClaude(queryOptions);
    
    // Store the session ID for future messages
    if (response.sessionId) {
      this.sessionId = response.sessionId;
    }
    
    // Track message history
    if (response.success && response.result) {
      this.messageHistory.push({ role: 'user', content: prompt });
      this.messageHistory.push({ role: 'assistant', content: response.result });
    }
    
    return response;
  }
  
  getSessionId(): string | undefined {
    return this.sessionId;
  }
  
  getHistory(): Array<{ role: 'user' | 'assistant', content: string }> {
    return [...this.messageHistory];
  }
  
  clearSession(): void {
    this.sessionId = undefined;
    this.messageHistory = [];
  }
}

// Advanced streaming input for dynamic multi-turn conversations
export async function* createStreamingConversation(
  messages: AsyncIterable<ClaudeMessage> | ClaudeMessage[]
): AsyncGenerator<any> {
  for await (const msg of messages) {
    yield {
      type: "user" as const,
      message: {
        role: msg.role,
        content: msg.content
      }
    };
  }
}

// Mock weather tool helper (for MCP tool demonstration)
export function getWeatherToolDefinition() {
  return {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    input_schema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and state, e.g. San Francisco, CA'
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'The unit of temperature'
        }
      },
      required: ['location']
    }
  };
}

// Mock weather data generator
export function getMockWeatherData(location: string, unit: string = 'fahrenheit'): string {
  const tempF = Math.floor(Math.random() * 30) + 50;
  const tempC = Math.floor((tempF - 32) * 5/9);
  const temp = unit === 'celsius' ? `${tempC}°C` : `${tempF}°F`;
  const conditions = ['sunny', 'cloudy', 'rainy', 'partly cloudy'][Math.floor(Math.random() * 4)];
  const humidity = Math.floor(Math.random() * 50) + 30;
  
  return `Current weather in ${location}: ${temp}, ${conditions}, ${humidity}% humidity`;
}