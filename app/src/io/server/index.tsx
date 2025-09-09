import { serve } from "bun";
import index from "../ui/index.html";
import { listFiles, readFile } from "../../domains/files/server";
import { handleChat } from "../../domains/chat/server";

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

    "/api/chat": handleChat,

    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      async GET() {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT() {
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
