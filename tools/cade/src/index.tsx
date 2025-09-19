import { serve } from "bun";
import index from "./index.html";

const server = serve({
  port: 8200,
  routes: {
    "/*": index,

    "/api/message": {
      async POST(req) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] POST /api/message - Action received`);

        const response = {
          message: "Hello from the backend! Your action was received.",
          timestamp,
        };

        console.log(`[${timestamp}] Sending response:`, response);
        return Response.json(response);
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);