#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Basic Hooks
 * Tests: PreToolUse and PostToolUse hooks for tool execution monitoring
 * Expected: Interception and monitoring of tool execution lifecycle
 */

// Hook event tracking
interface HookEvent {
  type: 'preToolUse' | 'postToolUse';
  toolName: string;
  input?: any;
  result?: any;
  error?: string;
  timestamp: string;
  duration?: number;
  metadata?: any;
}

// Hook implementations
class ToolHooksManager {
  private events: HookEvent[] = [];
  private startTimes: Map<string, number> = new Map();

  // Pre-tool use hook
  createPreToolUseHook() {
    return (toolName: string, input: any, metadata?: any) => {
      const timestamp = new Date().toISOString();
      const hookEvent: HookEvent = {
        type: 'preToolUse',
        toolName,
        input,
        timestamp,
        metadata
      };

      this.events.push(hookEvent);
      this.startTimes.set(`${toolName}-${timestamp}`, Date.now());

      console.log(`🔄 PRE-TOOL: ${toolName} starting at ${timestamp}`);

      // Log input details
      if (input && Object.keys(input).length > 0) {
        console.log(`📝 Input:`, JSON.stringify(input, null, 2));
      }

      // Hook can modify input or prevent execution
      if (toolName === 'Bash' && input.command?.includes('rm -rf')) {
        console.log(`⚠️  WARNING: Dangerous command detected: ${input.command}`);
        // In real implementation, you could throw an error to prevent execution
      }

      return input; // Return (potentially modified) input
    };
  }

  // Post-tool use hook
  createPostToolUseHook() {
    return (toolName: string, input: any, result: any, error?: Error, metadata?: any) => {
      const timestamp = new Date().toISOString();
      const startKey = Array.from(this.startTimes.keys())
        .filter(key => key.startsWith(toolName))
        .sort()
        .pop();

      let duration: number | undefined;
      if (startKey) {
        duration = Date.now() - this.startTimes.get(startKey)!;
        this.startTimes.delete(startKey);
      }

      const hookEvent: HookEvent = {
        type: 'postToolUse',
        toolName,
        input,
        result: error ? undefined : result,
        error: error?.message,
        timestamp,
        duration,
        metadata
      };

      this.events.push(hookEvent);

      console.log(`✅ POST-TOOL: ${toolName} completed in ${duration}ms`);

      if (error) {
        console.log(`❌ Error:`, error.message);
      } else {
        console.log(`✅ Success: Tool executed successfully`);

        // Log result summary for certain tools
        if (toolName === 'Read' && result?.length) {
          console.log(`📄 File read: ${result.length} characters`);
        } else if (toolName === 'Write') {
          console.log(`💾 File written successfully`);
        } else if (toolName === 'Grep' && Array.isArray(result)) {
          console.log(`🔍 Search results: ${result.length} matches`);
        }
      }

      return result; // Return (potentially modified) result
    };
  }

  // Analytics hooks
  createAnalyticsHook() {
    const toolUsageStats = new Map<string, { count: number; totalDuration: number; errors: number }>();

    const preHook = (toolName: string, input: any) => {
      if (!toolUsageStats.has(toolName)) {
        toolUsageStats.set(toolName, { count: 0, totalDuration: 0, errors: 0 });
      }
      toolUsageStats.get(toolName)!.count++;
      return input;
    };

    const postHook = (toolName: string, input: any, result: any, error?: Error) => {
      const stats = toolUsageStats.get(toolName);
      if (stats && error) {
        stats.errors++;
      }
      return result;
    };

    return {
      preHook,
      postHook,
      getStats: () => Object.fromEntries(toolUsageStats)
    };
  }

  getEvents(): HookEvent[] {
    return [...this.events];
  }

  getStats() {
    const toolStats = new Map<string, { preCount: number; postCount: number; avgDuration: number; errorCount: number }>();

    this.events.forEach(event => {
      if (!toolStats.has(event.toolName)) {
        toolStats.set(event.toolName, { preCount: 0, postCount: 0, avgDuration: 0, errorCount: 0 });
      }

      const stats = toolStats.get(event.toolName)!;

      if (event.type === 'preToolUse') {
        stats.preCount++;
      } else {
        stats.postCount++;
        if (event.duration) {
          stats.avgDuration = (stats.avgDuration * (stats.postCount - 1) + event.duration) / stats.postCount;
        }
        if (event.error) {
          stats.errorCount++;
        }
      }
    });

    return Object.fromEntries(toolStats);
  }

  clear() {
    this.events = [];
    this.startTimes.clear();
  }
}

// SDK Setup Function with hooks
function setupHookedQuery(
  prompt: string,
  hooksManager: ToolHooksManager,
  options?: Options
): Query {
  return query({
    prompt,
    preToolUse: hooksManager.createPreToolUseHook(),
    postToolUse: hooksManager.createPostToolUseHook(),
    options: options || { maxTurns: 5 }
  });
}

// Tester Function
async function testBasicHooks(
  testName: string,
  prompts: string[],
  expectedTools: string[]
): Promise<ExperimentResult & { logs: string; hookAnalysis: any }> {
  const logger = new ExperimentLogger(`13-basic-hooks - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];
  const hooksManager = new ToolHooksManager();

  try {
    logger.section('Configuration');
    logger.info('Test', testName);
    logger.info('Prompts', prompts);
    logger.info('Expected Tools', expectedTools);

    logger.section('Execution with Hooks');

    const q = setupHookedQuery(prompts[0], hooksManager);
    let promptIndex = 0;

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized with hooks', {
              sessionId: message.session_id,
              hooksEnabled: true
            });
          }
          break;

        case 'assistant':
          const content = message.message.content;

          // Log tool use attempts
          if (Array.isArray(content)) {
            const toolUses = content.filter((c: any) => c.type === 'tool_use');
            toolUses.forEach((tool: any) => {
              logger.info(`Tool attempted: ${tool.name}`, tool.input);
            });
          }

          logger.message('assistant', content);
          break;

        case 'user':
          const userContent = message.message.content;

          // Log tool results
          if (Array.isArray(userContent)) {
            const toolResults = userContent.filter((c: any) => c.type === 'tool_result');
            toolResults.forEach((result: any) => {
              if (result.is_error) {
                logger.warning('Tool failed', result.content);
              } else {
                logger.success('Tool executed successfully');
              }
            });
          }

          logger.message('user', userContent);

          // Send next prompt if available
          if (promptIndex < prompts.length - 1) {
            promptIndex++;
            q.input(prompts[promptIndex]);
          }
          break;

        case 'result':
          metrics.recordTokens(message.usage);
          metrics.recordCost(message.total_cost_usd);

          logger.info('Result', {
            subtype: message.subtype,
            turns: message.num_turns
          });
          break;

        default:
          logger.warning(`Unexpected message type: ${message.type}`);
      }
    }

    // Analyze hook events
    const hookEvents = hooksManager.getEvents();
    const hookStats = hooksManager.getStats();

    metrics.complete(true);

    logger.section('Hook Analysis');
    logger.info('Total Hook Events', hookEvents.length);
    logger.info('Tools Hooked', Object.keys(hookStats));
    logger.info('Hook Statistics', hookStats);

    // Validate expected tools were called
    const toolsCalled = Object.keys(hookStats);
    const expectedToolsCalled = expectedTools.filter(tool => toolsCalled.includes(tool));

    logger.info('Tool Validation', {
      expected: expectedTools,
      called: toolsCalled,
      matched: expectedToolsCalled,
      coverage: `${(expectedToolsCalled.length / expectedTools.length * 100).toFixed(1)}%`
    });

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      hookAnalysis: {
        events: hookEvents,
        stats: hookStats,
        expectedTools,
        toolsCalled,
        coverage: expectedToolsCalled.length / expectedTools.length
      }
    };

  } catch (error) {
    const err = error as Error;
    metrics.recordError(err.message);
    metrics.complete(false);
    logger.error('Experiment failed', err);
    logger.complete(false);

    const hookEvents = hooksManager.getEvents();
    const hookStats = hooksManager.getStats();

    return {
      success: false,
      messages,
      error: err,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      hookAnalysis: {
        events: hookEvents,
        stats: hookStats,
        expectedTools: [],
        toolsCalled: Object.keys(hookStats),
        coverage: 0
      }
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Basic Hooks Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: File operations hooks
  console.log('Test 1: File operations hooks');
  const result1 = await testBasicHooks(
    'File Operations',
    [
      'Read the package.json file',
      'Create a test file called hook-test.txt with content "Hooks working"',
      'Read the test file back to verify it was created'
    ],
    ['Read', 'Write']
  );

  results.push({
    test: 'File Operations',
    success: result1.success,
    hookEvents: result1.hookAnalysis.events.length,
    toolsCovered: result1.hookAnalysis.coverage,
    avgDuration: Object.values(result1.hookAnalysis.stats).reduce((sum: number, stat: any) => sum + stat.avgDuration, 0) / Object.keys(result1.hookAnalysis.stats).length
  });

  output.addTest('File Operations Hooks', {
    prompt: 'Test hooks with file operations',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Search operations hooks
  console.log('\nTest 2: Search operations hooks');
  const result2 = await testBasicHooks(
    'Search Operations',
    [
      'Search for TypeScript files in the current directory',
      'Find all files containing "claude" in their names',
      'Search for any README files'
    ],
    ['Glob', 'Grep']
  );

  results.push({
    test: 'Search Operations',
    success: result2.success,
    hookEvents: result2.hookAnalysis.events.length,
    toolsCovered: result2.hookAnalysis.coverage,
    avgDuration: Object.values(result2.hookAnalysis.stats).reduce((sum: number, stat: any) => sum + stat.avgDuration, 0) / Object.keys(result2.hookAnalysis.stats).length
  });

  output.addTest('Search Operations Hooks', {
    prompt: 'Test hooks with search operations',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Mixed operations hooks
  console.log('\nTest 3: Mixed operations hooks');
  const result3 = await testBasicHooks(
    'Mixed Operations',
    [
      'Check what TypeScript files exist',
      'Read the tsconfig.json file',
      'Edit the tsconfig.json to add a comment',
      'Verify the changes were made'
    ],
    ['Glob', 'Read', 'Edit']
  );

  results.push({
    test: 'Mixed Operations',
    success: result3.success,
    hookEvents: result3.hookAnalysis.events.length,
    toolsCovered: result3.hookAnalysis.coverage,
    avgDuration: Object.values(result3.hookAnalysis.stats).reduce((sum: number, stat: any) => sum + stat.avgDuration, 0) / Object.keys(result3.hookAnalysis.stats).length
  });

  output.addTest('Mixed Operations Hooks', {
    prompt: 'Test hooks with mixed operations',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Error handling in hooks
  console.log('\nTest 4: Error handling in hooks');
  const result4 = await testBasicHooks(
    'Error Handling',
    [
      'Try to read a non-existent file called missing-file.txt',
      'Attempt to write to a restricted location',
      'Search for files with invalid pattern'
    ],
    ['Read', 'Write', 'Glob']
  );

  results.push({
    test: 'Error Handling',
    success: result4.success,
    hookEvents: result4.hookAnalysis.events.length,
    toolsCovered: result4.hookAnalysis.coverage,
    avgDuration: Object.values(result4.hookAnalysis.stats).reduce((sum: number, stat: any) => sum + stat.avgDuration, 0) / Object.keys(result4.hookAnalysis.stats).length
  });

  output.addTest('Error Handling Hooks', {
    prompt: 'Test error handling in hooks',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Test 5: Performance monitoring
  console.log('\nTest 5: Performance monitoring with hooks');
  const result5 = await testBasicHooks(
    'Performance Monitoring',
    [
      'Perform multiple file operations in sequence',
      'Read several configuration files',
      'Search through multiple directories',
      'Create and edit multiple files'
    ],
    ['Read', 'Write', 'Edit', 'Glob', 'Grep']
  );

  results.push({
    test: 'Performance Monitoring',
    success: result5.success,
    hookEvents: result5.hookAnalysis.events.length,
    toolsCovered: result5.hookAnalysis.coverage,
    avgDuration: Object.values(result5.hookAnalysis.stats).reduce((sum: number, stat: any) => sum + stat.avgDuration, 0) / Object.keys(result5.hookAnalysis.stats).length
  });

  output.addTest('Performance Monitoring Hooks', {
    prompt: 'Test performance monitoring with hooks',
    messages: result5.messages,
    metrics: result5.metrics,
    logs: result5.logs
  });

  // Comprehensive hook analysis
  const allHookAnalysis = {
    fileOperations: result1.hookAnalysis,
    searchOperations: result2.hookAnalysis,
    mixedOperations: result3.hookAnalysis,
    errorHandling: result4.hookAnalysis,
    performanceMonitoring: result5.hookAnalysis
  };

  // Aggregate statistics
  const allEvents = Object.values(allHookAnalysis).flatMap(analysis => analysis.events);
  const toolPerformance = new Map<string, { count: number; totalDuration: number; errors: number }>();

  allEvents.forEach(event => {
    if (event.type === 'postToolUse') {
      if (!toolPerformance.has(event.toolName)) {
        toolPerformance.set(event.toolName, { count: 0, totalDuration: 0, errors: 0 });
      }
      const stats = toolPerformance.get(event.toolName)!;
      stats.count++;
      stats.totalDuration += event.duration || 0;
      if (event.error) stats.errors++;
    }
  });

  output.addJSON('Basic Hooks Analysis', {
    results: allHookAnalysis,
    aggregateStats: {
      totalHookEvents: allEvents.length,
      preToolEvents: allEvents.filter(e => e.type === 'preToolUse').length,
      postToolEvents: allEvents.filter(e => e.type === 'postToolUse').length,
      uniqueToolsHooked: [...new Set(allEvents.map(e => e.toolName))],
      toolPerformance: Object.fromEntries(
        Array.from(toolPerformance.entries()).map(([tool, stats]) => [
          tool,
          {
            count: stats.count,
            avgDuration: stats.count > 0 ? stats.totalDuration / stats.count : 0,
            errorRate: stats.count > 0 ? (stats.errors / stats.count) * 100 : 0
          }
        ])
      )
    },
    summary: {
      totalTests: results.length,
      avgHookEvents: results.reduce((sum, r) => sum + r.hookEvents, 0) / results.length,
      avgCoverage: results.reduce((sum, r) => sum + r.toolsCovered, 0) / results.length,
      avgDuration: results.reduce((sum, r) => sum + (r.avgDuration || 0), 0) / results.length
    }
  });

  // Add final summary
  output.addSummary(results);

  // Console summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BASIC HOOKS EXPERIMENT SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.test}: ${r.success ? '✅' : '❌'} (${r.hookEvents} events, ${(r.toolsCovered * 100).toFixed(1)}% coverage, ${(r.avgDuration || 0).toFixed(1)}ms avg)`);
  });
  console.log('='.repeat(60));

  // Save output to file
  const outputPath = output.save();
  console.log(`\n💾 Output saved to: ${outputPath}`);
}

// Run if executed directly
if (import.meta.main) {
  main().catch(console.error);
}