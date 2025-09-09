import index from "../ui/index.html";
import * as tools from "../tools";

export const routes = {
  // Serve index.html for all unmatched routes.
  "/*": index,

  "/api/tools": async () => {
    const toolsList = Object.entries(tools).map(([name, service]) => ({
      name,
      methods: Object.keys(service as any),
    }));
    return Response.json({ tools: toolsList });
  },
};