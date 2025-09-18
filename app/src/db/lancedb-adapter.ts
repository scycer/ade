import * as lancedb from "@lancedb/lancedb";
import type {
  DbNode,
  DbNodeInput,
  DbNodeUpdate,
  DbQueryFilter,
} from "../core/types";
import {
  DbNodeSchema,
  DbNodeInputSchema,
  DbNodeUpdateSchema,
  DbQueryFilterSchema,
  DbEdgeSchema,
} from "../core/types";

export class LanceDBAdapter {
  private db: any;
  private nodesTable: any;
  private edgesTable: any;
  private initialized = false;

  async connect(uri: string = "./data/lancedb") {
    try {
      this.db = await lancedb.connect(uri);
      await this.initializeTables();
      this.initialized = true;
    } catch (error) {
      console.error("Failed to connect to LanceDB:", error);
      throw error;
    }
  }

  private async initializeTables() {
    try {
      // Try to open existing tables
      this.nodesTable = await this.db.openTable("nodes");
      this.edgesTable = await this.db.openTable("edges");
    } catch (error) {
      // Create tables if they don't exist
      console.log("Creating new tables...");
      await this.createTables();
    }
  }

  private async createTables() {
    // Create nodes table with an initial system node
    const initialNode = {
      id: crypto.randomUUID(),
      type: "system",
      content: "System initialized",
      // Store metadata as JSON string to avoid schema conflicts
      metadata_json: JSON.stringify({
        version: "1.0.0",
        initialized_at: new Date().toISOString(),
      }),
      embedding: new Array(384).fill(0), // Using smaller embedding size for demo
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.nodesTable = await this.db.createTable("nodes", [initialNode]);

    // Create edges table with an initial self-edge
    const initialEdge = {
      id: crypto.randomUUID(),
      from_id: initialNode.id,
      to_id: initialNode.id,
      type: "self",
      metadata_json: JSON.stringify({}),
      created_at: new Date().toISOString(),
    };

    this.edgesTable = await this.db.createTable("edges", [initialEdge]);
  }

  async createNode(data: DbNodeInput): Promise<DbNode> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }

    // Validate input
    const validatedInput = DbNodeInputSchema.parse(data);

    const node = {
      id: crypto.randomUUID(),
      type: validatedInput.type,
      content: validatedInput.content,
      // Store metadata as JSON string
      metadata_json: JSON.stringify(validatedInput.metadata || {}),
      embedding: validatedInput.embedding || new Array(384).fill(0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.nodesTable.add([node]);

    // Return with Date objects and parsed metadata
    const result = {
      id: node.id,
      type: node.type,
      content: node.content,
      metadata: JSON.parse(node.metadata_json),
      embedding: node.embedding,
      created_at: new Date(node.created_at),
      updated_at: new Date(node.updated_at),
    };

    return DbNodeSchema.parse(result);
  }

  async updateNode(id: string, data: DbNodeUpdate): Promise<DbNode> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }

    // Validate input
    const validatedUpdate = DbNodeUpdateSchema.parse(data);

    // Get existing node
    const results = await this.nodesTable
      .query()
      .where(`id = "${id}"`)
      .limit(1)
      .toArray();

    if (results.length === 0) {
      throw new Error(`Node ${id} not found`);
    }

    const existingNode = results[0];
    const existingMetadata = existingNode.metadata_json
      ? JSON.parse(existingNode.metadata_json)
      : {};

    // Create updated node
    // Make sure embedding is always an array
    let embedding = existingNode.embedding;
    if (validatedUpdate.embedding !== undefined) {
      embedding = validatedUpdate.embedding;
    } else if (!embedding || typeof embedding !== 'object' || !Array.isArray(embedding)) {
      // If embedding is corrupted, use default
      embedding = new Array(384).fill(0);
    }

    const updatedNode = {
      ...existingNode,
      content: validatedUpdate.content !== undefined ? validatedUpdate.content : existingNode.content,
      metadata_json: validatedUpdate.metadata !== undefined
        ? JSON.stringify(validatedUpdate.metadata)
        : existingNode.metadata_json,
      embedding: embedding,
      updated_at: new Date().toISOString(),
    };

    // Delete old node and add updated one (LanceDB doesn't have direct update)
    await this.nodesTable.delete(`id = "${id}"`);
    await this.nodesTable.add([updatedNode]);

    // Return with Date objects and parsed metadata
    const result = {
      id: updatedNode.id,
      type: updatedNode.type,
      content: updatedNode.content,
      metadata: JSON.parse(updatedNode.metadata_json),
      embedding: updatedNode.embedding,
      created_at: new Date(updatedNode.created_at),
      updated_at: new Date(updatedNode.updated_at),
    };

    return DbNodeSchema.parse(result);
  }

  async getNode(id: string): Promise<DbNode | null> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }

    const results = await this.nodesTable
      .query()
      .where(`id = "${id}"`)
      .limit(1)
      .toArray();

    if (results.length === 0) return null;

    const node = results[0];
    // Ensure embedding is always a proper array
    let embedding = node.embedding;
    if (!embedding || !Array.isArray(embedding)) {
      embedding = new Array(384).fill(0);
    }

    const result = {
      id: node.id,
      type: node.type,
      content: node.content,
      metadata: node.metadata_json ? JSON.parse(node.metadata_json) : {},
      embedding: embedding,
      created_at: new Date(node.created_at),
      updated_at: new Date(node.updated_at),
    };

    return DbNodeSchema.parse(result);
  }

  async queryNodes(filter: DbQueryFilter): Promise<DbNode[]> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }

    // Validate filter
    const validatedFilter = DbQueryFilterSchema.parse(filter);

    let query = this.nodesTable.query();

    // Build where clauses from filter
    const whereClauses: string[] = [];

    if (validatedFilter.type) {
      whereClauses.push(`type = "${validatedFilter.type}"`);
    }

    if (validatedFilter.content) {
      whereClauses.push(`content = "${validatedFilter.content}"`);
    }

    // Apply where clauses if any
    if (whereClauses.length > 0) {
      query = query.where(whereClauses.join(" AND "));
    }

    const results = await query.toArray();

    // Convert to proper format
    return results.map((node: any) => {
      // Ensure embedding is always a proper array
      let embedding = node.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        embedding = new Array(384).fill(0);
      }

      const result = {
        id: node.id,
        type: node.type,
        content: node.content,
        metadata: node.metadata_json ? JSON.parse(node.metadata_json) : {},
        embedding: embedding,
        created_at: new Date(node.created_at),
        updated_at: new Date(node.updated_at),
      };
      return DbNodeSchema.parse(result);
    });
  }

  async queryNodesByVector(vector: number[], limit: number = 10): Promise<DbNode[]> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }

    // Ensure vector has correct dimension
    if (vector.length !== 384) {
      console.warn(`Vector dimension mismatch. Expected 384, got ${vector.length}. Padding/truncating.`);
      if (vector.length < 384) {
        vector = [...vector, ...new Array(384 - vector.length).fill(0)];
      } else {
        vector = vector.slice(0, 384);
      }
    }

    const results = await this.nodesTable
      .vectorSearch(vector)
      .limit(limit)
      .toArray();

    // Convert to proper format
    return results.map((node: any) => {
      // Ensure embedding is always a proper array
      let embedding = node.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        embedding = new Array(384).fill(0);
      }

      const result = {
        id: node.id,
        type: node.type,
        content: node.content,
        metadata: node.metadata_json ? JSON.parse(node.metadata_json) : {},
        embedding: embedding,
        created_at: new Date(node.created_at),
        updated_at: new Date(node.updated_at),
      };
      return DbNodeSchema.parse(result);
    });
  }

  async createEdge(from: string, to: string, type: string): Promise<void> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }

    const edge = {
      id: crypto.randomUUID(),
      from_id: from,
      to_id: to,
      type,
      metadata_json: JSON.stringify({}),
      created_at: new Date().toISOString(),
    };

    // Validate edge structure before storing
    const edgeWithDate = {
      id: edge.id,
      from_id: edge.from_id,
      to_id: edge.to_id,
      type: edge.type,
      metadata: {},
      created_at: new Date(edge.created_at),
    };
    DbEdgeSchema.parse(edgeWithDate);

    await this.edgesTable.add([edge]);
  }
}