#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options } from '@anthropic-ai/claude-code';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

// Configuration
const CONFIG = {
  maxTurns: 100,
  permissionMode: 'bypassPermissions' as const,  // Bypass all permission requests
  outputDir: './cade-sessions',
  defaultTaskFile: './task.md'
};

// Session tracking
interface SessionResult {
  sessionId: string;
  taskFile: string;
  startTime: string;
  endTime: string;
  success: boolean;
  messages: SDKMessage[];
  metrics: {
    turns: number;
    tokensUsed: any;
    costUSD: number;
    durationMs: number;
  };
  error?: string;
}

// Load task from markdown file
function loadTaskFromMarkdown(filePath: string): string {
  const resolvedPath = resolve(filePath);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Task file not found: ${resolvedPath}`);
  }

  const content = readFileSync(resolvedPath, 'utf-8');

  // Remove markdown comments (<!-- -->)
  const cleanedContent = content.replace(/<!--[\s\S]*?-->/g, '');

  return cleanedContent.trim();
}

// Ensure output directory exists
function ensureOutputDir(): void {
  if (!existsSync(CONFIG.outputDir)) {
    mkdirSync(CONFIG.outputDir, { recursive: true });
  }
}

// Save session results
function saveSessionResult(result: SessionResult): string {
  ensureOutputDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `session-${timestamp}.json`;
  const filepath = join(CONFIG.outputDir, filename);

  writeFileSync(filepath, JSON.stringify(result, null, 2));

  return filepath;
}

// Format duration
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Main agent runner
async function runAutonomousAgent(taskFilePath: string): Promise<SessionResult> {
  const startTime = new Date();
  const result: SessionResult = {
    sessionId: '',
    taskFile: taskFilePath,
    startTime: startTime.toISOString(),
    endTime: '',
    success: false,
    messages: [],
    metrics: {
      turns: 0,
      tokensUsed: {},
      costUSD: 0,
      durationMs: 0
    }
  };

  try {
    // Load task from markdown
    console.log(`📄 Loading task from: ${taskFilePath}`);
    const taskPrompt = loadTaskFromMarkdown(taskFilePath);

    console.log('━'.repeat(60));
    console.log('🎯 TASK:');
    console.log('━'.repeat(60));
    console.log(taskPrompt.substring(0, 500) + (taskPrompt.length > 500 ? '...' : ''));
    console.log('━'.repeat(60));
    console.log();

    // Create query with bypass permissions
    console.log('🚀 Starting autonomous agent...');
    console.log(`⚙️  Max turns: ${CONFIG.maxTurns}`);
    console.log(`🔓 Permission mode: ${CONFIG.permissionMode}`);
    console.log();

    const options: Options = {
      maxTurns: CONFIG.maxTurns,
      permissionMode: CONFIG.permissionMode,
      customSystemPrompt: `You are an autonomous code assistant running with full permissions.
Complete all requested tasks without asking for permission.
Be thorough and complete all aspects of the task.
Use all available tools as needed.`
    };

    const q = query({
      prompt: taskPrompt,
      options
    });

    // Process messages
    let messageCount = 0;
    let lastAssistantMessage = '';

    for await (const message of q) {
      result.messages.push(message);
      messageCount++;

      // Track session info
      if (message.type === 'system' && message.subtype === 'init') {
        result.sessionId = message.session_id;
        console.log(`📍 Session ID: ${message.session_id}`);
        console.log(`🤖 Model: ${message.model}`);
        console.log();
      }

      // Show progress
      if (message.type === 'assistant') {
        const content = message.message.content;
        if (typeof content === 'string') {
          lastAssistantMessage = content.substring(0, 100) + '...';
        } else if (Array.isArray(content)) {
          const textContent = content.find((c: any) => c.type === 'text');
          if (textContent?.text) {
            lastAssistantMessage = textContent.text.substring(0, 100) + '...';
          }

          // Log tool usage
          const toolUses = content.filter((c: any) => c.type === 'tool_use');
          toolUses.forEach((tool: any) => {
            console.log(`🔧 Tool: ${tool.name}`);
          });
        }
      }

      // Handle result
      if (message.type === 'result') {
        result.metrics.turns = message.num_turns || 0;
        result.metrics.tokensUsed = message.usage || {};
        result.metrics.costUSD = message.total_cost_usd || 0;
        result.metrics.durationMs = message.duration_ms || 0;
        result.success = message.subtype === 'success';

        console.log();
        console.log('━'.repeat(60));
        console.log(`✅ Agent completed: ${message.subtype}`);
        console.log(`📊 Turns: ${result.metrics.turns}`);
        console.log(`⏱️  Duration: ${formatDuration(result.metrics.durationMs)}`);
        console.log(`💰 Cost: $${result.metrics.costUSD.toFixed(4)}`);
        console.log('━'.repeat(60));
      }
    }

    const endTime = new Date();
    result.endTime = endTime.toISOString();

    if (result.metrics.durationMs === 0) {
      result.metrics.durationMs = endTime.getTime() - startTime.getTime();
    }

    return result;

  } catch (error) {
    const endTime = new Date();
    result.endTime = endTime.toISOString();
    result.metrics.durationMs = endTime.getTime() - startTime.getTime();
    result.error = error instanceof Error ? error.message : String(error);

    console.error();
    console.error('❌ Agent failed:', result.error);

    return result;
  }
}

// Main execution
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const taskFile = args[0] || CONFIG.defaultTaskFile;

  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(16) + 'CADE AUTONOMOUS AGENT' + ' '.repeat(21) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log();

  try {
    // Run the agent
    const result = await runAutonomousAgent(taskFile);

    // Save results
    const outputPath = saveSessionResult(result);

    console.log();
    console.log('📁 Session saved to:', outputPath);
    console.log('🆔 Session ID:', result.sessionId);

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { runAutonomousAgent, loadTaskFromMarkdown, type SessionResult };