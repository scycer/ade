import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { GraphView } from '../components/GraphView';
import { NodeForm } from '../components/NodeForm';
// Client-side imports  
import { createNode, updateNode, deleteNode, createEdge, deleteEdge, getGraphData } from '../lib/graph-client';
import { generateSimpleAIResponse } from '../lib/mastra-service';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load graph data
  const loadGraphData = async () => {
    setLoading(true);
    try {
      const data = await getGraphData();
      setNodes(data.nodes);
      setEdges(data.edges);
    } catch (error) {
      console.error('Failed to load graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraphData();
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const handleCreateNode = async (text: string, type: string) => {
    try {
      await createNode({ data: { text, type } });
      await loadGraphData();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create node:', error);
    }
  };

  const handleUpdateNode = async (id: number, text: string) => {
    try {
      await updateNode({ data: { id, text } });
      await loadGraphData();
      setSelectedNodeId(null);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to update node:', error);
    }
  };

  const handleDeleteNode = async (id: number) => {
    try {
      await deleteNode({ data: { id } });
      await loadGraphData();
      setSelectedNodeId(null);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to delete node:', error);
    }
  };

  const handleConnect = async (sourceId: number, targetId: number) => {
    try {
      await createEdge({ data: { sourceId, targetId } });
      await loadGraphData();
    } catch (error) {
      console.error('Failed to create edge:', error);
    }
  };

  const handleDeleteEdge = async (id: number) => {
    try {
      await deleteEdge({ data: { id } });
      await loadGraphData();
    } catch (error) {
      console.error('Failed to delete edge:', error);
    }
  };

  const handleNodeClick = (nodeId: number) => {
    setSelectedNodeId(nodeId);
    setShowForm(true);
  };

  const handleGenerateWithAI = async (text: string) => {
    try {
      // Generate AI response
      const aiResponse = await generateSimpleAIResponse(text);
      
      // Create the AI response node
      const result = await createNode({ 
        data: { 
          text: aiResponse, 
          type: 'ai-response' 
        } 
      });
      
      // If we have a selected node, create an edge from it to the new AI node
      if (selectedNodeId && result.id) {
        await createEdge({ 
          data: { 
            sourceId: selectedNodeId, 
            targetId: Number(result.id) 
          } 
        });
      }
      
      // Reload the graph to show the new node and edge
      await loadGraphData();
      
      // Clear the form
      setShowForm(false);
      setSelectedNodeId(null);
    } catch (error) {
      console.error('Failed to generate with AI:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Node Graph</h1>
            <button
              onClick={() => {
                setSelectedNodeId(null);
                setShowForm(!showForm);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {showForm ? 'Hide Form' : 'New Node'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Graph View */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading graph...</div>
            </div>
          ) : (
            <GraphView
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
              onNodeDelete={handleDeleteNode}
              onEdgeDelete={handleDeleteEdge}
              onConnect={handleConnect}
              selectedNodeId={selectedNodeId}
            />
          )}
        </div>

        {/* Side Panel */}
        {showForm && (
          <div className="w-96 bg-gray-100 p-4 overflow-y-auto">
            <NodeForm
              selectedNode={selectedNode}
              onSubmit={handleCreateNode}
              onUpdate={handleUpdateNode}
              onDelete={handleDeleteNode}
              onCancel={() => {
                setShowForm(false);
                setSelectedNodeId(null);
              }}
              onGenerateWithAI={handleGenerateWithAI}
            />
          </div>
        )}
      </div>
    </div>
  );
}