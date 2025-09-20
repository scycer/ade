import { ClaudeCodeService, ClaudeCodeResponse } from "../services/claude-code.service";

export interface MessageRequest {
  message: string;
  model?: string;
}

export interface MessageHandlerDependencies {
  claudeService?: ClaudeCodeService;
  logger?: (message: string) => void;
}

export interface MessageResponse {
  success: boolean;
  response?: string;
  sessionId?: string;
  costUsd?: number;
  model?: string;
  error?: string;
  details?: any;
  timestamp: string;
}

export class MessageHandler {
  private logger: (message: string) => void;

  constructor(dependencies: MessageHandlerDependencies = {}) {
    this.logger = dependencies.logger || console.log;
  }

  async handleMessage(
    request: MessageRequest,
    dependencies: MessageHandlerDependencies = {}
  ): Promise<MessageResponse> {
    const timestamp = new Date().toISOString();
    const { message, model } = request;

    this.logger(`[${timestamp}] Processing message: ${message}`);

    try {
      const claudeService = dependencies.claudeService || new ClaudeCodeService(model);
      const response = await claudeService.sendMessage(message);

      if (response.success) {
        return {
          success: true,
          response: response.response,
          sessionId: response.sessionId,
          costUsd: response.costUsd,
          model: response.model,
          timestamp,
        };
      } else {
        return {
          success: false,
          error: response.error,
          details: response.details,
          timestamp,
        };
      }
    } catch (error) {
      this.logger(`[${timestamp}] Error: ${error}`);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp,
      };
    }
  }

  async getAvailableModels(): Promise<{ models: any[] }> {
    return {
      models: ClaudeCodeService.getAvailableModels()
    };
  }
}