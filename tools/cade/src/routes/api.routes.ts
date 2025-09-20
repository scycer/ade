import { MessageHandler } from "../handlers/message.handler";
import { ClaudeCodeService } from "../services/claude-code.service";

const messageHandler = new MessageHandler({
  logger: console.log
});

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

  "/api/models": {
    async GET() {
      const response = await messageHandler.getAvailableModels();
      return Response.json(response);
    }
  },
};