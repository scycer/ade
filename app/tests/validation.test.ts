import { describe, it, expect } from "bun:test";
import {
  DbNodeSchema,
  DbNodeInputSchema,
  DbNodeUpdateSchema,
  DbEdgeSchema,
  DbQueryFilterSchema,
  AiSuggestionSchema,
  HelloActionSchema,
  CaptureThoughtSchema,
  QueryNodesSchema,
  VectorSearchSchema,
  HelloOutputSchema,
  CaptureThoughtOutputSchema,
  QueryNodesOutputSchema,
  VectorSearchOutputSchema,
  ActionSchema,
} from "../src/core/types";
import { z } from "zod";

describe("Zod Schema Validation", () => {
  describe("Database Schemas", () => {
    describe("DbNodeSchema", () => {
      it("should validate valid node", () => {
        const validNode = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          type: "thought",
          content: "Test content",
          metadata: { key: "value" },
          embedding: [0.1, 0.2, 0.3],
          created_at: new Date(),
          updated_at: new Date(),
        };

        const result = DbNodeSchema.safeParse(validNode);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validNode);
        }
      });

      it("should reject invalid UUID", () => {
        const invalidNode = {
          id: "not-a-uuid",
          type: "thought",
          content: "Test content",
          created_at: new Date(),
          updated_at: new Date(),
        };

        const result = DbNodeSchema.safeParse(invalidNode);
        expect(result.success).toBe(false);
      });

      it("should accept optional fields", () => {
        const minimalNode = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          type: "thought",
          content: "Test content",
          created_at: new Date(),
          updated_at: new Date(),
        };

        const result = DbNodeSchema.safeParse(minimalNode);
        expect(result.success).toBe(true);
      });
    });

    describe("DbNodeInputSchema", () => {
      it("should validate valid input", () => {
        const validInput = {
          type: "thought",
          content: "New thought",
          metadata: { tags: ["ai", "ml"] },
          embedding: new Array(384).fill(0),
        };

        const result = DbNodeInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it("should require type and content", () => {
        const invalidInput = {
          type: "thought",
          // missing content
        };

        const result = DbNodeInputSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });
    });

    describe("DbNodeUpdateSchema", () => {
      it("should allow all fields to be optional", () => {
        const emptyUpdate = {};
        const result = DbNodeUpdateSchema.safeParse(emptyUpdate);
        expect(result.success).toBe(true);
      });

      it("should validate partial updates", () => {
        const partialUpdate = {
          content: "Updated content",
        };

        const result = DbNodeUpdateSchema.safeParse(partialUpdate);
        expect(result.success).toBe(true);
      });
    });

    describe("DbEdgeSchema", () => {
      it("should validate valid edge", () => {
        const validEdge = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          from_id: "550e8400-e29b-41d4-a716-446655440001",
          to_id: "550e8400-e29b-41d4-a716-446655440002",
          type: "related",
          metadata: { weight: 0.8 },
          created_at: new Date(),
        };

        const result = DbEdgeSchema.safeParse(validEdge);
        expect(result.success).toBe(true);
      });

      it("should require all UUID fields", () => {
        const invalidEdge = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          from_id: "not-a-uuid",
          to_id: "550e8400-e29b-41d4-a716-446655440002",
          type: "related",
          created_at: new Date(),
        };

        const result = DbEdgeSchema.safeParse(invalidEdge);
        expect(result.success).toBe(false);
      });
    });

    describe("DbQueryFilterSchema", () => {
      it("should accept any additional properties", () => {
        const filter = {
          type: "thought",
          content: "search term",
          customField: "custom value",
          nestedField: { key: "value" },
        };

        const result = DbQueryFilterSchema.safeParse(filter);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.customField).toBe("custom value");
        }
      });
    });
  });

  describe("AI Schemas", () => {
    describe("AiSuggestionSchema", () => {
      it("should validate valid suggestion", () => {
        const validSuggestion = {
          suggestion: "Consider adding more context",
          confidence: 0.85,
        };

        const result = AiSuggestionSchema.safeParse(validSuggestion);
        expect(result.success).toBe(true);
      });

      it("should reject confidence outside 0-1 range", () => {
        const invalidSuggestion = {
          suggestion: "Consider adding more context",
          confidence: 1.5,
        };

        const result = AiSuggestionSchema.safeParse(invalidSuggestion);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Action Input Schemas", () => {
    describe("HelloActionSchema", () => {
      it("should validate with optional name", () => {
        const validAction = {
          type: "hello" as const,
          payload: { name: "Test" },
        };

        const result = HelloActionSchema.safeParse(validAction);
        expect(result.success).toBe(true);
      });

      it("should validate without name", () => {
        const validAction = {
          type: "hello" as const,
          payload: {},
        };

        const result = HelloActionSchema.safeParse(validAction);
        expect(result.success).toBe(true);
      });

      it("should require correct type literal", () => {
        const invalidAction = {
          type: "goodbye",
          payload: {},
        };

        const result = HelloActionSchema.safeParse(invalidAction);
        expect(result.success).toBe(false);
      });
    });

    describe("CaptureThoughtSchema", () => {
      it("should validate with tags", () => {
        const validAction = {
          type: "capture_thought" as const,
          payload: {
            text: "Important thought",
            tags: ["important", "review"],
          },
        };

        const result = CaptureThoughtSchema.safeParse(validAction);
        expect(result.success).toBe(true);
      });

      it("should require non-empty text", () => {
        const invalidAction = {
          type: "capture_thought" as const,
          payload: {
            text: "",
          },
        };

        const result = CaptureThoughtSchema.safeParse(invalidAction);
        expect(result.success).toBe(false);
      });
    });

    describe("QueryNodesSchema", () => {
      it("should validate with filter and limit", () => {
        const validAction = {
          type: "query_nodes" as const,
          payload: {
            filter: { type: "thought" },
            limit: 10,
          },
        };

        const result = QueryNodesSchema.safeParse(validAction);
        expect(result.success).toBe(true);
      });

      it("should reject negative limit", () => {
        const invalidAction = {
          type: "query_nodes" as const,
          payload: {
            limit: -5,
          },
        };

        const result = QueryNodesSchema.safeParse(invalidAction);
        expect(result.success).toBe(false);
      });
    });

    describe("VectorSearchSchema", () => {
      it("should validate with query and limit", () => {
        const validAction = {
          type: "vector_search" as const,
          payload: {
            query: "search term",
            limit: 5,
          },
        };

        const result = VectorSearchSchema.safeParse(validAction);
        expect(result.success).toBe(true);
      });

      it("should apply default limit", () => {
        const validAction = {
          type: "vector_search" as const,
          payload: {
            query: "search term",
          },
        };

        const result = VectorSearchSchema.safeParse(validAction);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.payload.limit).toBe(10);
        }
      });

      it("should require non-empty query", () => {
        const invalidAction = {
          type: "vector_search" as const,
          payload: {
            query: "",
          },
        };

        const result = VectorSearchSchema.safeParse(invalidAction);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Action Output Schemas", () => {
    describe("HelloOutputSchema", () => {
      it("should validate valid output", () => {
        const validOutput = {
          message: "Hello from Test Architecture!",
          node_id: "550e8400-e29b-41d4-a716-446655440000",
        };

        const result = HelloOutputSchema.safeParse(validOutput);
        expect(result.success).toBe(true);
      });

      it("should require valid UUID for node_id", () => {
        const invalidOutput = {
          message: "Hello from Test Architecture!",
          node_id: "not-a-uuid",
        };

        const result = HelloOutputSchema.safeParse(invalidOutput);
        expect(result.success).toBe(false);
      });
    });

    describe("QueryNodesOutputSchema", () => {
      it("should validate nodes array with dates", () => {
        const validOutput = {
          nodes: [
            {
              id: "550e8400-e29b-41d4-a716-446655440000",
              type: "thought",
              content: "Test content",
              created_at: new Date(),
            },
          ],
          count: 1,
        };

        const result = QueryNodesOutputSchema.safeParse(validOutput);
        expect(result.success).toBe(true);
      });

      it("should reject negative count", () => {
        const invalidOutput = {
          nodes: [],
          count: -1,
        };

        const result = QueryNodesOutputSchema.safeParse(invalidOutput);
        expect(result.success).toBe(false);
      });
    });

    describe("VectorSearchOutputSchema", () => {
      it("should validate results with optional score", () => {
        const validOutput = {
          results: [
            {
              id: "550e8400-e29b-41d4-a716-446655440000",
              content: "Test content",
              score: 0.95,
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440001",
              content: "Another content",
              // score is optional
            },
          ],
          count: 2,
        };

        const result = VectorSearchOutputSchema.safeParse(validOutput);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("ActionSchema Union", () => {
    it("should discriminate between action types", () => {
      const actions = [
        { type: "hello" as const, payload: {} },
        { type: "capture_thought" as const, payload: { text: "test" } },
        { type: "query_nodes" as const, payload: {} },
        { type: "vector_search" as const, payload: { query: "test" } },
      ];

      actions.forEach(action => {
        const result = ActionSchema.safeParse(action);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.type).toBe(action.type);
        }
      });
    });

    it("should reject unknown action types", () => {
      const unknownAction = {
        type: "unknown_action",
        payload: {},
      };

      const result = ActionSchema.safeParse(unknownAction);
      expect(result.success).toBe(false);
    });

    it("should enforce correct payload structure per type", () => {
      // Wrong payload for hello action
      const invalidAction = {
        type: "hello" as const,
        payload: {
          text: "This should be 'name', not 'text'",
        },
      };

      const result = ActionSchema.safeParse(invalidAction);
      // This should pass because extra properties are allowed,
      // but the name field is still optional
      expect(result.success).toBe(true);

      // But if we try to use capture_thought payload with hello type
      const mismatchedAction = {
        type: "hello" as const,
        payload: {
          text: "required for capture_thought",
          tags: ["tag1"],
        },
      };

      // This will pass for hello but would fail if we tried to execute it
      // as capture_thought without the correct type
      const helloResult = ActionSchema.safeParse(mismatchedAction);
      expect(helloResult.success).toBe(true);

      // Now try with wrong type
      const wrongType = {
        type: "capture_thought" as const,
        payload: {
          name: "should be text",
        },
      };

      const wrongResult = ActionSchema.safeParse(wrongType);
      expect(wrongResult.success).toBe(false);
    });
  });

  describe("Error Messages", () => {
    it("should provide helpful error messages", () => {
      const invalidNode = {
        id: "not-a-uuid",
        type: 123, // should be string
        content: null, // should be string
        created_at: "not-a-date", // should be Date
        updated_at: new Date(),
      };

      const result = DbNodeSchema.safeParse(invalidNode);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        expect(result.error.issues.some(issue => issue.path.includes("id"))).toBe(true);
        expect(result.error.issues.some(issue => issue.path.includes("type"))).toBe(true);
        expect(result.error.issues.some(issue => issue.path.includes("content"))).toBe(true);
      }
    });
  });
});