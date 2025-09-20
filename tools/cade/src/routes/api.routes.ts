import { MessageHandler } from "../handlers/message.handler";
import { ClaudeCodeService } from "../services/claude-code.service";

const messageHandler = new MessageHandler({
  logger: console.log
});

// Store service instances per session
const sessions = new Map<string, ClaudeCodeService>();

export const apiRoutes = {
  "/api/message": {
    async POST(req: Request) {
      const body = await req.json();

      const response = await messageHandler.handleMessage(
        {
          message: body.message,
          model: body.model
        },
        {
          claudeService: new ClaudeCodeService(body.model),
          logger: console.log
        }
      );

      return Response.json(response);
    }
  },

  "/api/conversation": {
    async POST(req: Request) {
      const body = await req.json();
      const { message, model, sessionId, allowFileOperations } = body;

      try {
        // Get or create service for this session
        let service: ClaudeCodeService;
        if (sessionId && sessions.has(sessionId)) {
          service = sessions.get(sessionId)!;
        } else {
          service = new ClaudeCodeService(model);
        }

        // Collect all messages from the conversation
        let response = "";
        let toolsUsed: any[] = [];
        let costUsd = 0;
        let newSessionId = sessionId;

        // Execute the conversation
        for await (const msg of service.conversation(message, {
          sessionId,
          allowFileOperations,
          workingDirectory: process.cwd(),
          onToolUse: (tool, args) => {
            console.log(`Tool used: ${tool}`, args);
          }
        })) {
          if (msg.type === "result") {
            response = msg.response;
            toolsUsed = msg.toolsUsed || [];
            costUsd = msg.costUsd || 0;
            newSessionId = msg.sessionId;

            // Store service for session continuity
            if (newSessionId) {
              sessions.set(newSessionId, service);
            }
          }
        }

        return Response.json({
          success: true,
          response,
          sessionId: newSessionId,
          costUsd,
          model,
          toolsUsed
        });

      } catch (error) {
        console.error("Conversation error:", error);
        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  },

  "/api/models": {
    async GET() {
      const response = await messageHandler.getAvailableModels();
      return Response.json(response);
    }
  },

  "/api/clear-session": {
    async POST(req: Request) {
      const body = await req.json();
      const { sessionId } = body;

      if (sessionId && sessions.has(sessionId)) {
        const service = sessions.get(sessionId)!;
        service.clearHistory();
        sessions.delete(sessionId);
      }

      return Response.json({ success: true });
    }
  },
};