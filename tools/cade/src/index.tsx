import { serve } from "bun";
import index from "./index.html";
import { ClaudeCodeService } from "./claude-code.service";

const server = serve({
  port: 8200,
  routes: {
    "/*": index,

    "/api/message": {
      async POST(req) {
        const timestamp = new Date().toISOString();
        const body = await req.json();
        const { message, model } = body;

        console.log(`[${timestamp}] POST /api/message - Message: ${message}`);

        try {
          // Use Claude Code SDK (subscription-based, no OAuth needed)
          const service = new ClaudeCodeService(model);
          const response = await service.sendMessage(message);

          if (response.success) {
            return Response.json({
              success: true,
              response: response.response,
              sessionId: response.sessionId,
              costUsd: response.costUsd,
              model: response.model,
              timestamp,
            });
          } else {
            return Response.json({
              success: false,
              error: response.error,
              details: response.details,
              timestamp,
            });
          }
        } catch (error) {
          console.error(`[${timestamp}] Error:`, error);
          return Response.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp,
          });
        }
      }
    },

    "/api/models": {
      async GET() {
        return Response.json({
          models: ClaudeCodeService.getAvailableModels()
        });
      }
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);