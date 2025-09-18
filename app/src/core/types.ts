import { z } from "zod";

// Database Node Types
export interface DbNode {
  id: string;
  type: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  created_at: Date;
  updated_at: Date;
}

export interface DbNodeInput {
  type: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface DbNodeUpdate {
  content?: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface DbEdge {
  from_id: string;
  to_id: string;
  type: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface DbQueryFilter {
  type?: string;
  [key: string]: any;
}

// AI Types
export interface AiSuggestion {
  suggestion: string;
  confidence: number;
}

// Brain Dependencies
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
    filter: z.record(z.any()).optional(),
    limit: z.number().optional(),
  }),
});

export const VectorSearchSchema = z.object({
  type: z.literal("vector_search"),
  payload: z.object({
    query: z.string(),
    limit: z.number().optional().default(10),
  }),
});

// Union of all actions
export const ActionSchema = z.discriminatedUnion("type", [
  HelloActionSchema,
  CaptureThoughtSchema,
  QueryNodesSchema,
  VectorSearchSchema,
]);

export type Action = z.infer<typeof ActionSchema>;

// Output Schemas
export const HelloOutputSchema = z.object({
  message: z.string(),
  node_id: z.string(),
});

export const CaptureThoughtOutputSchema = z.object({
  node_id: z.string(),
  message: z.string(),
});

export const QueryNodesOutputSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    content: z.string(),
    created_at: z.date(),
  })),
  count: z.number(),
});

export const VectorSearchOutputSchema = z.object({
  results: z.array(z.object({
    id: z.string(),
    content: z.string(),
    score: z.number().optional(),
  })),
  count: z.number(),
});

export type ActionOutput =
  | z.infer<typeof HelloOutputSchema>
  | z.infer<typeof CaptureThoughtOutputSchema>
  | z.infer<typeof QueryNodesOutputSchema>
  | z.infer<typeof VectorSearchOutputSchema>;