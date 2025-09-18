import type { BrainDependencies } from "../types";
import { QueryNodesSchema, QueryNodesOutputSchema } from "../types";

export async function queryNodes(
  payload: unknown,
  deps: BrainDependencies
) {
  // Validate input payload
  const validatedInput = QueryNodesSchema.shape.payload.parse(payload);
  const { filter = {}, limit = 50 } = validatedInput;

  // Query nodes with filter
  let nodes = await deps.db.queryNodes(filter);

  // Apply limit
  if (limit && nodes.length > limit) {
    nodes = nodes.slice(0, limit);
  }

  const output = {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      content: node.content,
      created_at: node.created_at,
    })),
    count: nodes.length,
  };

  // Validate output before returning
  return QueryNodesOutputSchema.parse(output);
}