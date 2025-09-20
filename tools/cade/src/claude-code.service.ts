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

/**
 * Service for interacting with Claude using the @anthropic-ai/claude-code SDK
 * This uses your subscription authentication automatically
 */
export class ClaudeCodeService {
  private model: string;

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