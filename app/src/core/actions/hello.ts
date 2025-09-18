import { BrainDependencies } from "../types";

export async function helloAction(
  payload: { name?: string },
  deps: BrainDependencies
) {
  const name = payload.name || "Brain";
  const message = `Hello from ${name} Architecture!`;

  // Create a hello node
  const node = await deps.db.createNode({
    type: "hello",
    content: message,
    metadata: {
      name,
      timestamp: new Date().toISOString(),
    },
  });

  return {
    message,
    node_id: node.id,
  };
}