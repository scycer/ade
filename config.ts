import * as path from 'path';

export const claudeConfig = {
  // Path to the Claude Code executable
  pathToClaudeCodeExecutable: path.join(__dirname, 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js'),

  // Node executable to use
  executable: 'node' as "bun" | "deno" | "node" | undefined,

  // Optional: API key configuration (defaults to ANTHROPIC_API_KEY env var)
  // apiKey: process.env.ANTHROPIC_API_KEY,

  // Default options for queries
  defaultOptions: {
    maxTurns: 1,
    // Optionally specify allowed tools
    // allowedTools: ["Read", "Write", "Bash"],
  }
};