import { serve } from "bun";
import index from "./ui/index.html";
import { filesService } from "./tools/files/files.service";
import * as tools from "./tools";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/tools": async () => {
      const toolsList = Object.entries(tools).map(([name, service]) => ({
        name,
        methods: Object.keys(service as any),
      }));
      return Response.json({ tools: toolsList });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
