import React, { useState, useEffect } from 'react';

interface NodeFormProps {
  selectedNode?: {
    id: number;
    text: string;
    type: string;
  } | null;
  onSubmit: (text: string, type: string) => void;
  onUpdate: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  onCancel: () => void;
  onGenerateWithAI?: (text: string) => void;
}

export function NodeForm({
  selectedNode,
  onSubmit,
  onUpdate,
  onDelete,
  onCancel,
  onGenerateWithAI,
}: NodeFormProps) {
  const [text, setText] = useState('');
  const [type, setType] = useState('node');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setText(selectedNode.text);
      setType(selectedNode.type);
      setIsEditing(true);
    } else {
      setText('');
      setType('node');
      setIsEditing(false);
    }
  }, [selectedNode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      if (isEditing && selectedNode) {
        onUpdate(selectedNode.id, text);
      } else {
        onSubmit(text, type);
      }
      setText('');
      setType('node');
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (selectedNode && window.confirm('Are you sure you want to delete this node?')) {
      onDelete(selectedNode.id);
      onCancel();
    }
  };

  const handleGenerateWithAI = () => {
    if (text.trim() && onGenerateWithAI) {
      onGenerateWithAI(text);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Edit Node' : 'Create Node'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="node-text" className="block text-sm font-medium text-gray-700 mb-1">
            Node Text
          </label>
          <textarea
            id="node-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={4}
            placeholder="Enter node text..."
            required
          />
        </div>

        <div>
          <label htmlFor="node-type" className="block text-sm font-medium text-gray-700 mb-1">
            Node Type
          </label>
          <select
            id="node-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="node">Basic Node</option>
            <option value="task">Task</option>
            <option value="idea">Idea</option>
            <option value="question">Question</option>
            <option value="ai-response">AI Response</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {isEditing ? 'Update' : 'Create'}
          </button>
          
          {onGenerateWithAI && text.trim() && (
            <button
              type="button"
              onClick={handleGenerateWithAI}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Generate with AI
            </button>
          )}
          
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Delete
            </button>
          )}
          
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}