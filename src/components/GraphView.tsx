import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  Panel,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface GraphNode {
  id: number;
  text: string;
  type: string;
  createdDate: string;
  updatedDate: string;
}

interface GraphEdge {
  id: number;
  sourceId: number;
  targetId: number;
}

interface GraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: number) => void;
  onNodeDelete?: (nodeId: number) => void;
  onEdgeDelete?: (edgeId: number) => void;
  onConnect?: (sourceId: number, targetId: number) => void;
  selectedNodeId?: number | null;
}

export function GraphView({
  nodes: dbNodes,
  edges: dbEdges,
  onNodeClick,
  onNodeDelete,
  onEdgeDelete,
  onConnect,
  selectedNodeId,
}: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert database nodes to React Flow nodes
  useEffect(() => {
    const flowNodes: Node[] = dbNodes.map((node, index) => ({
      id: node.id.toString(),
      position: {
        x: (index % 5) * 200,
        y: Math.floor(index / 5) * 150,
      },
      data: {
        label: (
          <div className="p-2">
            <div className="font-semibold text-sm mb-1">{node.type}</div>
            <div className="text-xs">{node.text}</div>
          </div>
        ),
      },
      style: {
        background: selectedNodeId === node.id ? '#93c5fd' : '#e0e7ff',
        border: selectedNodeId === node.id ? '2px solid #2563eb' : '1px solid #6366f1',
        borderRadius: '8px',
        padding: '4px',
        width: 180,
      },
    }));
    setNodes(flowNodes);
  }, [dbNodes, selectedNodeId, setNodes]);

  // Convert database edges to React Flow edges
  useEffect(() => {
    const flowEdges: Edge[] = dbEdges.map((edge) => ({
      id: edge.id.toString(),
      source: edge.sourceId.toString(),
      target: edge.targetId.toString(),
      animated: true,
      style: { stroke: '#6366f1' },
    }));
    setEdges(flowEdges);
  }, [dbEdges, setEdges]);

  const handleConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target && onConnect) {
        onConnect(parseInt(params.source), parseInt(params.target));
      }
    },
    [onConnect]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(parseInt(node.id));
      }
    },
    [onNodeClick]
  );

  const handleNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      if (onNodeDelete) {
        nodesToDelete.forEach((node) => {
          onNodeDelete(parseInt(node.id));
        });
      }
    },
    [onNodeDelete]
  );

  const handleEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      if (onEdgeDelete) {
        edgesToDelete.forEach((edge) => {
          onEdgeDelete(parseInt(edge.id));
        });
      }
    },
    [onEdgeDelete]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onNodesDelete={handleNodesDelete}
        onEdgesDelete={handleEdgesDelete}
        fitView
      >
        <Background variant="dots" gap={12} size={1} />
        <Controls />
        <MiniMap />
        <Panel position="top-left" className="bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg">
          <div className="text-sm font-medium">
            Nodes: {dbNodes.length} | Edges: {dbEdges.length}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}