import { query } from "@anthropic-ai/claude-code";

export interface ClaudeCodeResponse {
  success: boolean;
  response?: string;
  sessionId?: string;
  costUsd?: number;
  model?: string;
  error?: string;
  details?: any;
}

export interface ConversationMessage {
  type: "user" | "assistant" | "system";
  content: string;
  toolCalls?: any[];
}

export interface ConversationOptions {
  sessionId?: string;
  allowFileOperations?: boolean;
  workingDirectory?: string;
  onToolUse?: (tool: string, args: any) => void;
  onPartialMessage?: (content: string) => void;
}

/**
 * Service for interacting with Claude using the @anthropic-ai/claude-code SDK
 * Supports multi-turn conversations with file system access
 */
export class ClaudeCodeService {
  private model: string;
  private conversationHistory: ConversationMessage[] = [];
  private currentSessionId?: string;

  constructor(model?: string) {
    // Default to Claude Opus 4.1 (latest and most capable)
    this.model = model || "claude-opus-4-1-20250805";
  }

  /**
   * Send a message to Claude and get a response
   */
  async sendMessage(message: string): Promise<ClaudeCodeResponse> {
    try {
      let response = "";
      let sessionId = "";
      let costUsd = 0;
      let actualModel = this.model;
      let messageCount = 0;

      // Execute the query
      for await (const msg of query({
        prompt: message,
        options: {
          model: this.model
        }
      })) {
        messageCount++;

        // Capture initialization info
        if (msg.type === "system" && (msg as any).subtype === "init") {
          sessionId = (msg as any).session_id || "";
          actualModel = (msg as any).model || this.model;
        }

        // Capture the assistant's response
        if (msg.type === "assistant") {
          const content = (msg as any).message?.content?.[0];
          if (content && content.type === "text") {
            response = content.text;
          }
        }

        // Capture result with cost info
        if (msg.type === "result") {
          const resultMsg = msg as any;

          // Use the result as response if we don't have one yet
          if (!response && resultMsg.result) {
            response = resultMsg.result;
          }

          // Capture session and cost info
          if (resultMsg.session_id) {
            sessionId = resultMsg.session_id;
          }
          if (resultMsg.total_cost_usd) {
            costUsd = resultMsg.total_cost_usd;
          }

          // Check for errors
          if (resultMsg.is_error) {
            throw new Error(resultMsg.result || "Query failed");
          }
        }
      }

      if (!response) {
        throw new Error("No response received from Claude");
      }

      return {
        success: true,
        response,
        sessionId,
        costUsd,
        model: actualModel
      };

    } catch (error) {
      console.error("ClaudeCodeService error:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error
      };
    }
  }

  /**
   * Start a new conversation session with Claude
   * Supports multi-turn conversations with file system access
   */
  async *conversation(
    userMessage: string,
    options: ConversationOptions = {}
  ): AsyncGenerator<any, void, unknown> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        type: "user",
        content: userMessage
      });

      // Use the raw message - bypassPermissions mode handles everything
      const prompt = userMessage;

      // Configure query options with CORRECT permission mode
      // Use "bypassPermissions" to skip all permission checks
      const queryOptions: any = {
        model: this.model,
        permissionMode: "bypassPermissions"  // This bypasses all permission prompts!
      };

      // Only add session ID if provided
      if (options.sessionId) {
        queryOptions.sessionId = options.sessionId;
      }

      // Set environment variables as backup
      process.env.CLAUDE_CODE_AUTO_APPROVE = "1";
      process.env.CLAUDE_CODE_PERMISSION_MODE = "allow";
      process.env.CLAUDE_AUTO_APPROVE_TOOLS = "true";

      console.log("Configured with FULL UNRESTRICTED permissions - all tools auto-approved");

      let assistantResponse = "";
      let toolCalls: any[] = [];
      let sessionCaptured = false;
      let costUsd = 0;

      try {
        // Execute the query and stream results
        const queryGenerator = query({ prompt, options: queryOptions });

        for await (const msg of queryGenerator) {
          // Capture session ID from init message
          if (msg.type === "system" && (msg as any).subtype === "init") {
            this.currentSessionId = (msg as any).session_id || options.sessionId;
            sessionCaptured = true;
          }

          // Handle partial messages for streaming
          if (msg.type === "partial" && options.onPartialMessage) {
            options.onPartialMessage((msg as any).content);
          }

          // Handle tool use notifications
          if (msg.type === "tool_use") {
            const toolMsg = msg as any;
            if (options.onToolUse) {
              options.onToolUse(toolMsg.name, toolMsg.input);
            }
            toolCalls.push({
              name: toolMsg.name,
              input: toolMsg.input,
              output: toolMsg.output
            });
            yield {
              type: "tool_use",
              tool: toolMsg.name,
              args: toolMsg.input,
              result: toolMsg.output
            };
          }

          // Capture assistant's message
          if (msg.type === "assistant") {
            const msgContent = (msg as any).message || (msg as any);
            if (msgContent.content) {
              // Handle content array
              if (Array.isArray(msgContent.content)) {
                const textContent = msgContent.content.find((c: any) => c.type === "text");
                if (textContent) {
                  assistantResponse = textContent.text;
                }
              } else if (typeof msgContent.content === "string") {
                assistantResponse = msgContent.content;
              }
            }
            // Also capture tool calls from assistant message
            if (msgContent.tool_calls) {
              toolCalls = msgContent.tool_calls;
            }
          }

          // Handle result messages
          if (msg.type === "result") {
            const resultMsg = msg as any;

            // Use result as response if we don't have one
            if (!assistantResponse && resultMsg.result) {
              assistantResponse = resultMsg.result;
            }

            if (resultMsg.total_cost_usd) {
              costUsd = resultMsg.total_cost_usd;
            }

            if (resultMsg.session_id) {
              this.currentSessionId = resultMsg.session_id;
              sessionCaptured = true;
            }

            // Don't yield the SDK's result message - we'll create our own
            continue;
          }

          // Pass through other message types
          yield msg;
        }
      } catch (queryError: any) {
        // Handle query-specific errors
        console.error("Query execution error:", queryError);

        // The query might have completed with an error response
        // Try to extract any response that was generated
        if (queryError.message && !assistantResponse) {
          assistantResponse = `Error: ${queryError.message}`;
        }
      }

      // Always add the response to history if we got one
      if (assistantResponse) {
        this.conversationHistory.push({
          type: "assistant",
          content: assistantResponse,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined
        });
      }

      // Always yield a final result
      yield {
        type: "result",
        response: assistantResponse || "No response generated",
        sessionId: this.currentSessionId,
        costUsd: costUsd,
        toolsUsed: toolCalls
      };

    } catch (error) {
      console.error("Conversation error:", error);
      yield {
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        details: error
      };
    }
  }

  /**
   * Clear the conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    this.currentSessionId = undefined;
  }

  /**
   * Get the current conversation history
   */
  getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Get available models for the subscription
   */
  static getAvailableModels() {
    return [
      { id: "claude-opus-4-1-20250805", name: "Claude Opus 4.1 (Latest)", default: true },
      { id: "claude-opus-4-20250514", name: "Claude Opus 4" },
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
      { id: "claude-3-7-sonnet-20250219", name: "Claude Sonnet 3.7" },
      { id: "claude-3-5-haiku-20241022", name: "Claude Haiku 3.5 (Fast)" }
    ];
  }
}