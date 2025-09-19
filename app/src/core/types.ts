import { z } from "zod";

// Database Node Schemas
export const DbNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  embedding: z.array(z.number()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const DbNodeInputSchema = z.object({
  type: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  embedding: z.array(z.number()).optional(),
});

export const DbNodeUpdateSchema = z.object({
  content: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  embedding: z.array(z.number()).optional(),
});

export const DbEdgeSchema = z.object({
  id: z.string().uuid(),
  from_id: z.string().uuid(),
  to_id: z.string().uuid(),
  type: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  created_at: z.string(),
});

export const DbQueryFilterSchema = z.object({
  type: z.string().optional(),
  content: z.string().optional(),
}).catchall(z.any());

// AI Types
export const AiSuggestionSchema = z.object({
  suggestion: z.string(),
  confidence: z.number().min(0).max(1),
});

// Export TypeScript types inferred from Zod schemas
export type DbNode = z.infer<typeof DbNodeSchema>;
export type DbNodeInput = z.infer<typeof DbNodeInputSchema>;
export type DbNodeUpdate = z.infer<typeof DbNodeUpdateSchema>;
export type DbEdge = z.infer<typeof DbEdgeSchema>;
export type DbQueryFilter = z.infer<typeof DbQueryFilterSchema>;
export type AiSuggestion = z.infer<typeof AiSuggestionSchema>;

// Brain Dependencies Interface (not using Zod for function types due to TypeScript limitations)
export interface BrainDependencies {
  db: {
    createNode: (data: DbNodeInput) => Promise<DbNode>;
    updateNode: (id: string, data: DbNodeUpdate) => Promise<DbNode>;
    getNode: (id: string) => Promise<DbNode | null>;
    queryNodes: (filter: DbQueryFilter) => Promise<DbNode[]>;
    queryNodesByVector: (vector: number[], limit?: number) => Promise<DbNode[]>;
    createEdge: (from: string, to: string, type: string) => Promise<void>;
  };
  llm: {
    generateSuggestion: (content: string, hint?: string) => Promise<AiSuggestion | null>;
    refineContent: (content: string, prompt: string) => Promise<string>;
    generateEmbedding: (text: string) => Promise<number[]>;
  };
}

// Action Schemas
export const HelloActionSchema = z.object({
  type: z.literal("hello"),
  payload: z.object({
    name: z.string().optional(),
  }),
});

export const CaptureThoughtSchema = z.object({
  type: z.literal("capture_thought"),
  payload: z.object({
    text: z.string().min(1),
    tags: z.array(z.string()).optional(),
  }),
});

export const QueryNodesSchema = z.object({
  type: z.literal("query_nodes"),
  payload: z.object({
    filter: z.record(z.string(), z.any()).optional(),
    limit: z.number().positive().optional(),
  }),
});

export const VectorSearchSchema = z.object({
  type: z.literal("vector_search"),
  payload: z.object({
    query: z.string().min(1),
    limit: z.number().positive().optional().default(10),
  }),
});

export const GitDiffActionSchema = z.object({
  type: z.literal("git_diff"),
  payload: z.object({}),
});

// Union of all actions
export const ActionSchema = z.discriminatedUnion("type", [
  HelloActionSchema,
  CaptureThoughtSchema,
  QueryNodesSchema,
  VectorSearchSchema,
  GitDiffActionSchema,
]);

export type Action = z.infer<typeof ActionSchema>;

// Output Schemas
export const HelloOutputSchema = z.object({
  message: z.string(),
  node_id: z.string().uuid(),
});

export const CaptureThoughtOutputSchema = z.object({
  node_id: z.string().uuid(),
  message: z.string(),
});

export const QueryNodesOutputSchema = z.object({
  nodes: z.array(z.object({
    id: z.string().uuid(),
    type: z.string(),
    content: z.string(),
    created_at: z.string(),
  })),
  count: z.number().nonnegative(),
});

export const VectorSearchOutputSchema = z.object({
  results: z.array(z.object({
    id: z.string().uuid(),
    content: z.string(),
    score: z.number().optional(),
  })),
  count: z.number().nonnegative(),
});

export const GitDiffOutputSchema = z.object({
  files: z.array(z.object({
    filename: z.string(),
    status: z.enum(['added', 'modified', 'deleted']),
    additions: z.number(),
    deletions: z.number(),
    patch: z.string(),
  })),
  totalFiles: z.number(),
  totalAdditions: z.number(),
  totalDeletions: z.number(),
});

export type ActionOutput =
  | z.infer<typeof HelloOutputSchema>
  | z.infer<typeof CaptureThoughtOutputSchema>
  | z.infer<typeof QueryNodesOutputSchema>
  | z.infer<typeof VectorSearchOutputSchema>
  | z.infer<typeof GitDiffOutputSchema>;