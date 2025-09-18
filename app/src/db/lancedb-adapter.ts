import * as lancedb from "@lancedb/lancedb";
import {
  DbNode,
  DbNodeInput,
  DbNodeUpdate,
  DbQueryFilter,
  BrainDependencies
} from "../core/types";

export class LanceDBAdapter implements BrainDependencies["db"] {
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
      metadata: {
        version: "1.0.0",
        initialized_at: new Date().toISOString(),
      },
      embedding: new Array(384).fill(0), // Using smaller embedding size for demo
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.nodesTable = await this.db.createTable("nodes", [initialNode]);

    // Create edges table with an initial self-edge
    const initialEdge = {
      id: crypto.randomUUID(),
      from_id: initialNode.id,
      to_id: initialNode.id,
      type: "self",
      metadata: {},
      created_at: new Date(),
    };

    this.edgesTable = await this.db.createTable("edges", [initialEdge]);
  }

  async createNode(data: DbNodeInput): Promise<DbNode> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }

    const node: DbNode = {
      id: crypto.randomUUID(),
      type: data.type,
      content: data.content,
      metadata: data.metadata || {},
      embedding: data.embedding || new Array(384).fill(0),
      created_at: new Date(),
      updated_at: new Date(),
    };

    await this.nodesTable.add([node]);
    return node;
  }

  async updateNode(id: string, data: DbNodeUpdate): Promise<DbNode> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }

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

    // Create updated node
    const updatedNode: DbNode = {
      ...existingNode,
      content: data.content !== undefined ? data.content : existingNode.content,
      metadata: data.metadata !== undefined ? data.metadata : existingNode.metadata,
      embedding: data.embedding !== undefined ? data.embedding : existingNode.embedding,
      updated_at: new Date(),
    };

    // Delete old node and add updated one (LanceDB doesn't have direct update)
    await this.nodesTable.delete(`id = "${id}"`);
    await this.nodesTable.add([updatedNode]);

    return updatedNode;
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

    return results.length > 0 ? results[0] : null;
  }

  async queryNodes(filter: DbQueryFilter): Promise<DbNode[]> {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }

    let query = this.nodesTable.query();

    // Build where clauses from filter
    const whereClauses: string[] = [];

    if (filter.type) {
      whereClauses.push(`type = "${filter.type}"`);
    }

    if (filter.content) {
      whereClauses.push(`content = "${filter.content}"`);
    }

    // Apply where clauses if any
    if (whereClauses.length > 0) {
      query = query.where(whereClauses.join(" AND "));
    }

    return await query.toArray();
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

    return results;
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
      metadata: {},
      created_at: new Date(),
    };

    await this.edgesTable.add([edge]);
  }
}