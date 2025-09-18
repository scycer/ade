import { BrainDependencies, DbQueryFilter } from "../types";

export async function queryNodes(
  payload: { filter?: DbQueryFilter; limit?: number },
  deps: BrainDependencies
) {
  const { filter = {}, limit = 50 } = payload;

  // Query nodes with filter
  let nodes = await deps.db.queryNodes(filter);

  // Apply limit
  if (limit && nodes.length > limit) {
    nodes = nodes.slice(0, limit);
  }

  return {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      content: node.content,
      created_at: node.created_at,
    })),
    count: nodes.length,
  };
}