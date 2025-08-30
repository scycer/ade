import { query } from '@anthropic-ai/claude-code';
import type { ClaudeResponse, ClaudeQueryOptions } from '../types';
import { claudeConfig } from '../config/claude.config';

export async function queryClaude(options: ClaudeQueryOptions): Promise<ClaudeResponse> {
  try {
    let result = '';
    
    for await (const msg of query({
      prompt: options.prompt,
      options: {
        ...claudeConfig.defaultOptions,
        pathToClaudeCodeExecutable: claudeConfig.pathToClaudeCodeExecutable,
        executable: claudeConfig.executable,
        maxTurns: options.maxTurns || claudeConfig.defaultOptions.maxTurns,
        allowedTools: options.allowedTools
      }
    })) {
      if (msg.type === "result") {
        if (msg.subtype === "success") {
          result = msg.result;
          return { success: true, result };
        } else {
          return { success: false, error: `Query failed: ${msg.subtype}` };
        }
      }
    }
    
    return { success: false, error: 'No result received from Claude' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

export function isClaudeAvailable(): boolean {
  try {
    // Check if the Claude Code executable exists
    const fs = require('fs');
    return fs.existsSync(claudeConfig.pathToClaudeCodeExecutable);
  } catch {
    return false;
  }
}