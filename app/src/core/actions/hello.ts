import type { BrainDependencies } from "../types";
import { HelloActionSchema, HelloOutputSchema } from "../types";

export async function helloAction(
  payload: unknown,
  deps: BrainDependencies
) {
  // Validate input payload
  const validatedInput = HelloActionSchema.shape.payload.parse(payload);

  const name = validatedInput.name || "Brain";
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

  const output = {
    message,
    node_id: node.id,
  };

  // Validate output before returning
  return HelloOutputSchema.parse(output);
}