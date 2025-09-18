import type { BrainDependencies } from "../types";
import { CaptureThoughtSchema, CaptureThoughtOutputSchema } from "../types";

export async function captureThought(
  payload: unknown,
  deps: BrainDependencies
) {
  // Validate input payload
  const validatedInput = CaptureThoughtSchema.shape.payload.parse(payload);
  const { text, tags = [] } = validatedInput;

  // Generate embedding for the text
  const embedding = await deps.llm.generateEmbedding(text);

  // Create the thought node
  const node = await deps.db.createNode({
    type: "thought",
    content: text,
    embedding,
    metadata: {
      tags,
      timestamp: new Date().toISOString(),
    },
  });

  // Create edges for tags
  for (const tag of tags) {
    // First create or find the tag node
    const tagNodes = await deps.db.queryNodes({ type: "tag", content: tag });
    let tagNode;

    if (tagNodes.length === 0) {
      tagNode = await deps.db.createNode({
        type: "tag",
        content: tag,
        metadata: {},
      });
    } else {
      tagNode = tagNodes[0];
    }

    // Create edge from thought to tag
    if (tagNode) {
      await deps.db.createEdge(node.id, tagNode.id, "tagged");
    }
  }

  const output = {
    node_id: node.id,
    message: `Captured thought with ${tags.length} tags`,
  };

  // Validate output before returning
  return CaptureThoughtOutputSchema.parse(output);
}