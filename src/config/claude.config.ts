import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const claudeConfig = {
  // Path to the Claude Code executable
  pathToClaudeCodeExecutable: join(dirname(dirname(__dirname)), 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js'),

  // Node executable to use
  executable: 'node' as "bun" | "deno" | "node" | undefined,

  // Default options for queries
  defaultOptions: {
    maxTurns: 1,
    // Optionally specify allowed tools
    // allowedTools: ["Read", "Write", "Bash"],
  }
};

// Test configuration (can be overridden for testing)
export const testConfig = {
  ...claudeConfig,
  defaultOptions: {
    ...claudeConfig.defaultOptions,
    maxTurns: 1,
  }
};