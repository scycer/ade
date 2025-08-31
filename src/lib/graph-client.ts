// Import the server functions directly - they will be transformed by TanStack Start
import * as api from './graph-api';

// Re-export the server functions for client use
export const createNode = api.createNode;
export const getAllNodes = api.getAllNodes;
export const getNodeById = api.getNodeById;
export const updateNode = api.updateNode;
export const deleteNode = api.deleteNode;
export const createEdge = api.createEdge;
export const getAllEdges = api.getAllEdges;
export const getEdgesByNodeId = api.getEdgesByNodeId;
export const deleteEdge = api.deleteEdge;
export const deleteEdgeByNodes = api.deleteEdgeByNodes;
export const getGraphData = api.getGraphData;