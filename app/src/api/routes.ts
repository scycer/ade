import index from "../ui/index.html";
import { handleBrainRequest } from "./brain-service";

export const routes = {
  // Serve index.html for all unmatched routes.
  "/*": index,

  "/api/brain/hello": async () => {
    try {
      const result = await handleBrainRequest({
        type: "hello",
        payload: {},
      });
      return Response.json(result);
    } catch (error) {
      console.error("Brain hello error:", error);
      return Response.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }
  },

  "/api/brain": async (request: Request) => {
    try {
      const action = await request.json();
      const result = await handleBrainRequest(action);
      return Response.json(result);
    } catch (error) {
      console.error("Brain error:", error);
      return Response.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }
  },
};