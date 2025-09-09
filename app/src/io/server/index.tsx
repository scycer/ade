import { serve } from "bun";
import index from "../ui/index.html";
import { listFiles, readFile } from "./routes/files";
import { assistantAgent } from "../../mastra";

const server = serve({
  routes: {
    // File system API routes
    "/api/files": async (req) => {
      const url = new URL(req.url);
      const path = url.searchParams.get("path") || "/app";

      try {
        const files = await listFiles(path);
        return Response.json({ files });
      } catch (err) {
        return Response.json({
          error: err instanceof Error ? err.message : "Unknown error"
        }, { status: 500 });
      }
    },

    "/api/file": async (req) => {
      const url = new URL(req.url);
      const path = url.searchParams.get("path");

      if (!path) {
        return Response.json({ error: "Path parameter required" }, { status: 400 });
      }

      const result = await readFile(path);
      if (result.error) {
        return Response.json({ error: result.error }, { status: 404 });
      }

      return Response.json({ content: result.content });
    },

    "/api/chat": async (req) => {
      if (req.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
      }

      try {
        const body = await req.json();
        const { message } = body;

        if (!message) {
          return Response.json({ error: "Message is required" }, { status: 400 });
        }

        const result = await assistantAgent.generate([
          {
            role: "user",
            content: message,
          },
        ]);

        return Response.json({
          response: result.text,
          model: Bun.env.DEFAULT_MODEL || 'openai/gpt-4o-mini',
          usage: result.usage,
        });
      } catch (error) {
        console.error("Chat error:", error);
        return Response.json(
          {
            error: error instanceof Error ? error.message : "Failed to process chat request",
            details: Bun.env.NODE_ENV === "development" ? error : undefined
          },
          { status: 500 }
        );
      }
    },

    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  development: Bun.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
