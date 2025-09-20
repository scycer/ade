import { serve } from "bun";
import index from "./index.html";
import { apiRoutes } from "./routes/api.routes";

const server = serve({
  port: 8200,
  routes: {
    "/*": index,
    ...apiRoutes,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);