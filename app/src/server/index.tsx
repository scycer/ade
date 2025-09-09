import { serve } from "bun";
import { routes } from "../api/routes";

export const server = () => serve({
  routes,

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

