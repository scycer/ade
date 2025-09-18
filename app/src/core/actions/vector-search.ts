import type { BrainDependencies } from "../types";
import { VectorSearchSchema, VectorSearchOutputSchema } from "../types";

export async function vectorSearch(
  payload: unknown,
  deps: BrainDependencies
) {
  // Validate input payload
  const validatedInput = VectorSearchSchema.shape.payload.parse(payload);
  const { query, limit = 10 } = validatedInput;

  // Generate embedding for the query
  const queryEmbedding = await deps.llm.generateEmbedding(query);

  // Perform vector search
  const nodes = await deps.db.queryNodesByVector(queryEmbedding, limit);

  const output = {
    results: nodes.map(node => ({
      id: node.id,
      content: node.content,
      // LanceDB doesn't return scores directly, we can add this later if needed
      score: undefined,
    })),
    count: nodes.length,
  };

  // Validate output before returning
  return VectorSearchOutputSchema.parse(output);
}