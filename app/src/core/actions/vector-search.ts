import { BrainDependencies } from "../types";

export async function vectorSearch(
  payload: { query: string; limit?: number },
  deps: BrainDependencies
) {
  const { query, limit = 10 } = payload;

  // Generate embedding for the query
  const queryEmbedding = await deps.llm.generateEmbedding(query);

  // Perform vector search
  const nodes = await deps.db.queryNodesByVector(queryEmbedding, limit);

  return {
    results: nodes.map(node => ({
      id: node.id,
      content: node.content,
      // LanceDB doesn't return scores directly, we can add this later if needed
      score: undefined,
    })),
    count: nodes.length,
  };
}