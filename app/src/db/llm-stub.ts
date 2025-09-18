import { BrainDependencies, AiSuggestion } from "../core/types";

export class LLMStub implements BrainDependencies["llm"] {
  async generateSuggestion(content: string, hint?: string): Promise<AiSuggestion | null> {
    // Stub implementation - returns a simple suggestion
    const suggestion = hint
      ? `Based on "${content}", consider: ${hint}`
      : `Consider expanding on: "${content}"`;

    return {
      suggestion,
      confidence: 0.75,
    };
  }

  async refineContent(content: string, prompt: string): Promise<string> {
    // Stub implementation - returns content with prompt appended
    return `${content}\n[Refined with: ${prompt}]`;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Stub implementation - generates a deterministic fake embedding
    // In production, this would call OpenAI or another embedding service
    const embedding = new Array(384).fill(0);

    // Simple hash-based fake embedding for demo
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      embedding[i % 384] = (embedding[i % 384] + charCode / 255) / 2;
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] = embedding[i] / magnitude;
      }
    }

    return embedding;
  }
}