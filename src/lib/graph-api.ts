import { createServerFn } from '@tanstack/react-start/server';
import { nodeOperations, edgeOperations, initializeDatabase } from './db';
import { z } from 'zod';

// Initialize database on server startup - only on server side
if (typeof window === 'undefined') {
  initializeDatabase().catch(console.error);
}

// Node schemas
const createNodeSchema = z.object({
  text: z.string().min(1),
  type: z.string().default('node'),
});

const updateNodeSchema = z.object({
  id: z.number(),
  text: z.string().min(1),
});

// Edge schemas
const createEdgeSchema = z.object({
  sourceId: z.number(),
  targetId: z.number(),
});

// Node API functions
export const createNode = createServerFn({ method: 'POST' }).handler(
  async (params: { data: { text: string; type: string } }) => {
    const validated = createNodeSchema.parse(params.data);
    const result = await nodeOperations.create(validated.text, validated.type);
    return { success: true, id: result.lastInsertRowid };
  }
);

export const getAllNodes = createServerFn({ method: 'GET' }).handler(
  async () => {
    const nodes = await nodeOperations.getAll();
    return nodes;
  }
);

export const getNodeById = createServerFn({ method: 'GET' }).handler(
  async (params: { data: { id: number } }) => {
    const node = await nodeOperations.getById(params.data.id);
    return node;
  }
);

export const updateNode = createServerFn({ method: 'PUT' }).handler(
  async (params: { data: { id: number; text: string } }) => {
    const validated = updateNodeSchema.parse(params.data);
    await nodeOperations.update(validated.id, validated.text);
    return { success: true };
  }
);

export const deleteNode = createServerFn({ method: 'DELETE' }).handler(
  async (params: { data: { id: number } }) => {
    await nodeOperations.delete(params.data.id);
    return { success: true };
  }
);

// Edge API functions
export const createEdge = createServerFn({ method: 'POST' }).handler(
  async (params: { data: { sourceId: number; targetId: number } }) => {
    const validated = createEdgeSchema.parse(params.data);
    const result = await edgeOperations.create(validated.sourceId, validated.targetId);
    return { success: true, id: result.lastInsertRowid };
  }
);

export const getAllEdges = createServerFn({ method: 'GET' }).handler(
  async () => {
    const edges = await edgeOperations.getAll();
    return edges;
  }
);

export const getEdgesByNodeId = createServerFn({ method: 'GET' }).handler(
  async (params: { data: { nodeId: number } }) => {
    const edges = await edgeOperations.getByNodeId(params.data.nodeId);
    return edges;
  }
);

export const deleteEdge = createServerFn({ method: 'DELETE' }).handler(
  async (params: { data: { id: number } }) => {
    await edgeOperations.delete(params.data.id);
    return { success: true };
  }
);

export const deleteEdgeByNodes = createServerFn({ method: 'DELETE' }).handler(
  async (params: { data: { sourceId: number; targetId: number } }) => {
    await edgeOperations.deleteByNodes(params.data.sourceId, params.data.targetId);
    return { success: true };
  }
);

// Combined data fetching
export const getGraphData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [nodes, edges] = await Promise.all([
      nodeOperations.getAll(),
      edgeOperations.getAll(),
    ]);
    return { nodes, edges };
  }
);