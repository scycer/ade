import { BrainDependencies } from "../types";

export async function captureThought(
  payload: { text: string; tags?: string[] },
  deps: BrainDependencies
) {
  const { text, tags = [] } = payload;

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
    await deps.db.createEdge(node.id, tagNode.id, "tagged");
  }

  return {
    node_id: node.id,
    message: `Captured thought with ${tags.length} tags`,
  };
}