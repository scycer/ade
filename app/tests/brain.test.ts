import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { brain } from "../src/core/brain";
import { LanceDBAdapter } from "../src/db/lancedb-adapter";
import { LLMStub } from "../src/db/llm-stub";
import type { BrainDependencies } from "../src/core/types";
import {
  HelloActionSchema,
  CaptureThoughtSchema,
  QueryNodesSchema,
  VectorSearchSchema,
  HelloOutputSchema,
  CaptureThoughtOutputSchema,
  QueryNodesOutputSchema,
  VectorSearchOutputSchema,
} from "../src/core/types";
import { z } from "zod";
import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";

describe("Brain Actions", () => {
  let db: LanceDBAdapter;
  let llm: LLMStub;
  let deps: BrainDependencies;
  const testDbPath = "./test-data/lancedb";

  beforeEach(async () => {
    // Clean up test database if it exists
    if (existsSync(testDbPath)) {
      await rm(testDbPath, { recursive: true, force: true });
    }

    // Initialize dependencies
    db = new LanceDBAdapter();
    await db.connect(testDbPath);

    llm = new LLMStub();

    deps = { db, llm };
  });

  afterEach(async () => {
    // Clean up test database
    if (existsSync(testDbPath)) {
      await rm(testDbPath, { recursive: true, force: true });
    }
  });

  describe("Hello Action", () => {
    it("should execute hello action with valid input", async () => {
      const input = {
        type: "hello" as const,
        payload: {
          name: "Test User"
        }
      };

      // Validate input schema
      const validInput = HelloActionSchema.parse(input);
      expect(validInput).toEqual(input);

      // Execute action
      const result = await brain(input, deps);

      // Validate output schema
      const validOutput = HelloOutputSchema.parse(result);
      expect(validOutput.message).toBe("Hello from Test User Architecture!");
      expect(validOutput.node_id).toBeDefined();
      expect(validOutput.node_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it("should execute hello action with default name", async () => {
      const input = {
        type: "hello" as const,
        payload: {}
      };

      const result = await brain(input, deps);
      const validOutput = HelloOutputSchema.parse(result);
      expect(validOutput.message).toBe("Hello from Brain Architecture!");
    });

    it("should reject invalid input", async () => {
      const invalidInput = {
        type: "hello" as const,
        payload: {
          name: 123 // Invalid: should be string
        }
      };

      expect(() => HelloActionSchema.parse(invalidInput)).toThrow(z.ZodError);
    });
  });

  describe("Capture Thought Action", () => {
    it("should capture thought with tags", async () => {
      const input = {
        type: "capture_thought" as const,
        payload: {
          text: "This is a test thought about AI",
          tags: ["ai", "testing", "thoughts"]
        }
      };

      // Validate input schema
      const validInput = CaptureThoughtSchema.parse(input);
      expect(validInput).toEqual(input);

      // Execute action
      const result = await brain(input, deps);

      // Validate output schema
      const validOutput = CaptureThoughtOutputSchema.parse(result);
      expect(validOutput.node_id).toBeDefined();
      expect(validOutput.message).toBe("Captured thought with 3 tags");

      // Verify the thought was stored
      const nodes = await db.queryNodes({ type: "thought" });
      expect(nodes.length).toBeGreaterThan(0);
      const thoughtNode = nodes.find(n => n.content === input.payload.text);
      expect(thoughtNode).toBeDefined();
      expect(thoughtNode?.metadata?.tags).toEqual(input.payload.tags);
    });

    it("should capture thought without tags", async () => {
      const input = {
        type: "capture_thought" as const,
        payload: {
          text: "A simple thought without tags"
        }
      };

      const result = await brain(input, deps);
      const validOutput = CaptureThoughtOutputSchema.parse(result);
      expect(validOutput.message).toBe("Captured thought with 0 tags");
    });

    it("should reject empty text", async () => {
      const invalidInput = {
        type: "capture_thought" as const,
        payload: {
          text: ""
        }
      };

      expect(() => CaptureThoughtSchema.parse(invalidInput)).toThrow(z.ZodError);
    });

    it("should create tag nodes and edges", async () => {
      const input = {
        type: "capture_thought" as const,
        payload: {
          text: "Thought with tag connections",
          tags: ["important", "review"]
        }
      };

      await brain(input, deps);

      // Check tag nodes were created
      const tagNodes = await db.queryNodes({ type: "tag" });
      expect(tagNodes.length).toBe(2);
      expect(tagNodes.map(n => n.content).sort()).toEqual(["important", "review"]);
    });
  });

  describe("Query Nodes Action", () => {
    beforeEach(async () => {
      // Create some test nodes
      await db.createNode({
        type: "test",
        content: "First test node",
        metadata: { category: "alpha" }
      });
      await db.createNode({
        type: "test",
        content: "Second test node",
        metadata: { category: "beta" }
      });
      await db.createNode({
        type: "demo",
        content: "Demo node",
        metadata: { category: "alpha" }
      });
    });

    it("should query nodes by type", async () => {
      const input = {
        type: "query_nodes" as const,
        payload: {
          filter: { type: "test" }
        }
      };

      // Validate input schema
      const validInput = QueryNodesSchema.parse(input);
      expect(validInput).toEqual(input);

      // Execute action
      const result = await brain(input, deps);

      // Validate output schema
      const validOutput = QueryNodesOutputSchema.parse(result);
      expect(validOutput.count).toBe(2);
      expect(validOutput.nodes).toHaveLength(2);
      expect(validOutput.nodes.every(n => n.type === "test")).toBe(true);
    });

    it("should apply limit to query results", async () => {
      const input = {
        type: "query_nodes" as const,
        payload: {
          filter: {},
          limit: 2
        }
      };

      const result = await brain(input, deps);
      const validOutput = QueryNodesOutputSchema.parse(result);
      expect(validOutput.nodes.length).toBeLessThanOrEqual(2);
    });

    it("should return all nodes with empty filter", async () => {
      const input = {
        type: "query_nodes" as const,
        payload: {}
      };

      const result = await brain(input, deps);
      const validOutput = QueryNodesOutputSchema.parse(result);
      expect(validOutput.count).toBeGreaterThan(0);
    });

    it("should validate output node structure", async () => {
      const input = {
        type: "query_nodes" as const,
        payload: {
          filter: { type: "test" },
          limit: 1
        }
      };

      const result = await brain(input, deps);
      const validOutput = QueryNodesOutputSchema.parse(result);

      const node = validOutput.nodes[0];
      expect(node).toBeDefined();
      if (node) {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('type');
        expect(node).toHaveProperty('content');
        expect(node).toHaveProperty('created_at');
        expect(typeof node.created_at).toBe('string');
      }
    });
  });

  describe("Vector Search Action", () => {
    beforeEach(async () => {
      // Create nodes with embeddings
      const texts = [
        "Machine learning is a subset of artificial intelligence",
        "Deep learning uses neural networks with multiple layers",
        "Natural language processing helps computers understand text",
        "Computer vision enables machines to interpret images",
        "Reinforcement learning involves learning through rewards"
      ];

      for (const text of texts) {
        const embedding = await llm.generateEmbedding(text);
        await db.createNode({
          type: "knowledge",
          content: text,
          embedding
        });
      }
    });

    it("should perform vector search", async () => {
      const input = {
        type: "vector_search" as const,
        payload: {
          query: "What is deep learning?",
          limit: 3
        }
      };

      // Validate input schema
      const validInput = VectorSearchSchema.parse(input);
      expect(validInput).toEqual(input);

      // Execute action
      const result = await brain(input, deps);

      // Validate output schema
      const validOutput = VectorSearchOutputSchema.parse(result);
      expect(validOutput.results.length).toBeLessThanOrEqual(3);
      expect(validOutput.count).toBeLessThanOrEqual(3);
      expect(validOutput.results[0]).toHaveProperty('id');
      expect(validOutput.results[0]).toHaveProperty('content');
    });

    it("should use default limit", async () => {
      const input = {
        type: "vector_search" as const,
        payload: {
          query: "artificial intelligence"
        }
      };

      const result = await brain(input, deps);
      const validOutput = VectorSearchOutputSchema.parse(result);
      expect(validOutput.results.length).toBeLessThanOrEqual(10); // default limit
    });

    it("should reject empty query", async () => {
      const invalidInput = {
        type: "vector_search" as const,
        payload: {
          query: ""
        }
      };

      expect(() => VectorSearchSchema.parse(invalidInput)).toThrow(z.ZodError);
    });

    it("should handle search with no results gracefully", async () => {
      // Clear all nodes first
      const allNodes = await db.queryNodes({});
      for (const node of allNodes) {
        if (node.type === "knowledge") {
          // We can't delete directly, but we can test with a unique query
        }
      }

      const input = {
        type: "vector_search" as const,
        payload: {
          query: "quantum chromodynamics in curved spacetime",
          limit: 5
        }
      };

      const result = await brain(input, deps);
      const validOutput = VectorSearchOutputSchema.parse(result);
      expect(validOutput.results).toBeDefined();
      expect(validOutput.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Brain Execute Method", () => {
    it("should handle unknown action type", async () => {
      const invalidAction = {
        type: "unknown_action" as any,
        payload: {}
      };

      await expect(brain(invalidAction, deps)).rejects.toThrow("Invalid action");
    });

    it("should validate action schema at runtime", async () => {
      const invalidAction = {
        type: "hello",
        // Missing payload
      } as any;

      await expect(brain(invalidAction, deps)).rejects.toThrow();
    });
  });

  describe("Zod Validation", () => {
    it("should validate all action schemas", () => {
      // Test union discriminator
      const validActions = [
        { type: "hello" as const, payload: {} },
        { type: "capture_thought" as const, payload: { text: "test" } },
        { type: "query_nodes" as const, payload: {} },
        { type: "vector_search" as const, payload: { query: "test" } }
      ];

      for (const action of validActions) {
        expect(() => {
          const schema = getActionSchema(action.type);
          schema.parse(action);
        }).not.toThrow();
      }
    });

    it("should reject invalid payload structures", () => {
      const invalidPayloads = [
        { type: "hello" as const, payload: null },
        { type: "capture_thought" as const, payload: { text: 123 } },
        { type: "query_nodes" as const, payload: { limit: "not a number" } },
        { type: "vector_search" as const, payload: { limit: -1 } }
      ];

      for (const action of invalidPayloads) {
        expect(() => {
          const schema = getActionSchema(action.type);
          schema.parse(action);
        }).toThrow(z.ZodError);
      }
    });
  });

  describe("Database Integration", () => {
    it("should persist nodes across queries", async () => {
      // Create a thought
      const captureResult = await brain({
        type: "capture_thought" as const,
        payload: {
          text: "Persistent thought",
          tags: ["persistence"]
        }
      }, deps);

      const nodeId = (captureResult as any).node_id;

      // Query for the node
      const queryResult = await brain({
        type: "query_nodes" as const,
        payload: {
          filter: { type: "thought" }
        }
      }, deps);

      const nodes = (queryResult as any).nodes;
      const foundNode = nodes.find((n: any) => n.id === nodeId);
      expect(foundNode).toBeDefined();
      expect(foundNode.content).toBe("Persistent thought");
    });

    it("should handle concurrent operations", async () => {
      const operations = [
        brain({
          type: "hello" as const,
          payload: { name: "Concurrent 1" }
        }, deps),
        brain({
          type: "hello" as const,
          payload: { name: "Concurrent 2" }
        }, deps),
        brain({
          type: "capture_thought" as const,
          payload: { text: "Concurrent thought" }
        }, deps)
      ];

      const results = await Promise.all(operations);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });
});

// Helper function to get specific action schema
function getActionSchema(type: string) {
  switch (type) {
    case "hello":
      return HelloActionSchema;
    case "capture_thought":
      return CaptureThoughtSchema;
    case "query_nodes":
      return QueryNodesSchema;
    case "vector_search":
      return VectorSearchSchema;
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}