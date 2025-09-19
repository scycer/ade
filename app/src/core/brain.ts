import { z } from "zod";
import {
  ActionSchema,
  HelloOutputSchema,
  CaptureThoughtOutputSchema,
  QueryNodesOutputSchema,
  VectorSearchOutputSchema,
  GitDiffOutputSchema,
} from "./types";
import type { Action, ActionOutput, BrainDependencies } from "./types";
import { helloAction } from "./actions/hello";
import { captureThought } from "./actions/capture";
import { queryNodes } from "./actions/query";
import { vectorSearch } from "./actions/vector-search";
import { getGitDiffs } from "./actions/git-diff";

export async function brain(
  action: unknown,
  deps: BrainDependencies
): Promise<ActionOutput> {
  // Validate input action against schema
  let validatedAction: Action;
  try {
    validatedAction = ActionSchema.parse(action);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid action: ${error.issues.map((e: z.ZodIssue) => e.message).join(", ")}`
      );
    }
    throw error;
  }

  // Create event node for auditing
  const eventNode = await deps.db.createNode({
    type: "event",
    content: validatedAction.type,
    metadata: {
      action: validatedAction.type,
      input: validatedAction.payload,
      timestamp: new Date().toISOString(),
    },
  });

  try {
    // Dispatcher - handle different action types
    let output: ActionOutput;

    switch (validatedAction.type) {
      case "hello": {
        const result = await helloAction(validatedAction.payload, deps);
        output = HelloOutputSchema.parse(result);
        break;
      }

      case "capture_thought": {
        const result = await captureThought(validatedAction.payload, deps);
        output = CaptureThoughtOutputSchema.parse(result);
        break;
      }

      case "query_nodes": {
        const result = await queryNodes(validatedAction.payload, deps);
        output = QueryNodesOutputSchema.parse(result);
        break;
      }

      case "vector_search": {
        const result = await vectorSearch(validatedAction.payload, deps);
        output = VectorSearchOutputSchema.parse(result);
        break;
      }

      case "git_diff": {
        const result = await getGitDiffs(validatedAction.payload);
        output = GitDiffOutputSchema.parse(result);
        break;
      }

      default:
        throw new Error(
          `Unknown action type: ${(validatedAction as Action).type}`
        );
    }

    // Update event node with success
    await deps.db.updateNode(eventNode.id, {
      metadata: {
        ...eventNode.metadata,
        output,
        status: "success",
      },
    });

    return output;
  } catch (error) {
    // Update event node with failure
    await deps.db.updateNode(eventNode.id, {
      metadata: {
        ...eventNode.metadata,
        error: error instanceof Error ? error.message : String(error),
        status: "failure",
      },
    });
    throw error;
  }
}