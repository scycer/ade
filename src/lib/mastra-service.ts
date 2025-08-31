// import { Mastra } from '@mastra/core';
// import { config } from '../../mastra.config';
import { createNode, createEdge } from './graph-client';

// Initialize Mastra - temporarily disabled due to config issue
// const mastra = new Mastra(config);

export async function generateNodeWithAI(sourceNodeId: number, prompt: string, type: string = 'node') {
  try {
    // Temporarily using simple AI response until Mastra is properly configured
    const generatedContent = await generateSimpleAIResponse(prompt);
    
    // Create a new node with the AI-generated content
    const result = await createNode({ 
      data: { 
        text: generatedContent, 
        type: 'ai-response' 
      } 
    });

    // Create an edge from the source node to the new AI-generated node
    if (result.id) {
      await createEdge({ 
        data: { 
          sourceId: sourceNodeId, 
          targetId: Number(result.id) 
        } 
      });
    }

    return {
      success: true,
      nodeId: result.id,
      content: generatedContent,
    };
  } catch (error) {
    console.error('Failed to generate node with AI:', error);
    throw error;
  }
}

// Simple version without Mastra dependency for now
export async function generateSimpleAIResponse(prompt: string): Promise<string> {
  // This is a placeholder implementation
  // In production, this would use the actual OpenAI API
  const responses = [
    `Exploring the concept: "${prompt}" reveals interesting possibilities for development.`,
    `Building on "${prompt}": This could be expanded into a comprehensive solution.`,
    `Analyzing "${prompt}": Key considerations include implementation, scalability, and user experience.`,
    `Developing "${prompt}" further: Consider breaking this down into smaller, actionable tasks.`,
    `Regarding "${prompt}": This presents an opportunity for innovation and creative problem-solving.`,
  ];
  
  // Return a random response for demonstration
  return responses[Math.floor(Math.random() * responses.length)];
}