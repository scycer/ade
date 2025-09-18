import { brain } from "../core/brain";
import { LanceDBAdapter } from "../db/lancedb-adapter";
import { LLMStub } from "../db/llm-stub";
import { BrainDependencies } from "../core/types";

// Initialize dependencies
const dbAdapter = new LanceDBAdapter();
const llmStub = new LLMStub();

// Initialize database connection
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await dbAdapter.connect("./data/lancedb");
    initialized = true;
  }
}

// Create brain dependencies
async function getDependencies(): Promise<BrainDependencies> {
  await ensureInitialized();

  return {
    db: dbAdapter,
    llm: llmStub,
  };
}

// Export a function to handle brain requests
export async function handleBrainRequest(action: unknown) {
  const deps = await getDependencies();
  return await brain(action, deps);
}