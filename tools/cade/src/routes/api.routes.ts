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
        let intermediateSteps: string[] = [];

        // Execute the conversation
        for await (const msg of service.conversation(message, {
          sessionId,
          allowFileOperations,
          workingDirectory: process.cwd(),
          onToolUse: (tool, args) => {
            console.log(`🔧 Tool used: ${tool}`, args);
          }
        })) {
          // Log all message types for debugging
          if (msg.type === "assistant_intermediate") {
            console.log(`💬 Intermediate: ${msg.content}`);
            intermediateSteps.push(msg.content);
          }

          if (msg.type === "tool_use") {
            const toolInfo = `🛠️ Used ${msg.tool}: ${JSON.stringify(msg.args).substring(0, 100)}...`;
            console.log(toolInfo);
            intermediateSteps.push(toolInfo);
          }

          if (msg.type === "result") {
            response = msg.response;
            toolsUsed = msg.toolsUsed || [];
            costUsd = msg.costUsd || 0;
            newSessionId = msg.sessionId;

            // Add tool usage to intermediate steps
            if (toolsUsed.length > 0) {
              toolsUsed.forEach((tool: any) => {
                const toolStr = `🔧 ${tool.name}(${JSON.stringify(tool.input || {}).substring(0, 50)}...)`;
                intermediateSteps.push(toolStr);
              });
            }

            // Store service for session continuity
            if (newSessionId) {
              sessions.set(newSessionId, service);
            }
          }
        }

        // Log final response details
        console.log(`\n📝 Final Response: ${response}`);
        if (intermediateSteps.length > 0) {
          console.log(`📊 Steps taken (${intermediateSteps.length}):`);
          intermediateSteps.forEach((step, i) => console.log(`  ${i + 1}. ${step.substring(0, 100)}...`));
        }

        return Response.json({
          success: true,
          response,
          sessionId: newSessionId,
          costUsd,
          model,
          toolsUsed,
          intermediateSteps  // Include intermediate steps for the UI
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