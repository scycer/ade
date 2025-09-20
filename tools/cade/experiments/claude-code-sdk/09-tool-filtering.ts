#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Tool Filtering
 * Tests: allowedTools and disallowedTools filtering options
 * Expected: Selective tool availability based on whitelist/blacklist configurations
 */

// Tool filtering configurations
interface ToolFilterConfig {
  name: string;
  allowedTools?: string[];
  disallowedTools?: string[];
  description: string;
}

const filterConfigs: ToolFilterConfig[] = [
  {
    name: 'readOnlyMode',
    allowedTools: ['Read', 'Glob', 'Grep'],
    description: 'Only allow read-only tools for analysis'
  },
  {
    name: 'noExecution',
    disallowedTools: ['Bash', 'KillShell', 'BashOutput'],
    description: 'Block execution tools for safety'
  },
  {
    name: 'fileOperationsOnly',
    allowedTools: ['Read', 'Write', 'Edit', 'MultiEdit', 'Glob'],
    description: 'Only file operations, no external tools'
  },
  {
    name: 'webAndSearch',
    allowedTools: ['WebFetch', 'WebSearch', 'Read', 'Write'],
    description: 'Web browsing and basic file operations'
  },
  {
    name: 'restrictedEdit',
    disallowedTools: ['Write', 'MultiEdit'],
    description: 'Allow reading and single edits, block bulk operations'
  }
];

// SDK Setup Function with tool filtering
function setupToolFilteredQuery(
  prompt: string,
  config: ToolFilterConfig,
  options?: Options
): Query {
  const queryOptions: any = {
    prompt,
    options: options || { maxTurns: 5 }
  };

  if (config.allowedTools) {
    queryOptions.allowedTools = config.allowedTools;
  }
  if (config.disallowedTools) {
    queryOptions.disallowedTools = config.disallowedTools;
  }

  return query(queryOptions);
}

// Helper to analyze tool availability from assistant responses
function analyzeToolAvailability(messages: SDKMessage[]): {
  attemptedTools: string[];
  successfulTools: string[];
  blockedTools: string[];
  toolResults: Array<{ tool: string; success: boolean; error?: string }>;
} {
  const attemptedTools: string[] = [];
  const successfulTools: string[] = [];
  const blockedTools: string[] = [];
  const toolResults: Array<{ tool: string; success: boolean; error?: string }> = [];

  for (const message of messages) {
    if (message.type === 'assistant' && Array.isArray(message.message.content)) {
      // Find tool use attempts
      const toolUses = message.message.content.filter((c: any) => c.type === 'tool_use');
      toolUses.forEach((tool: any) => {
        attemptedTools.push(tool.name);
      });
    }

    if (message.type === 'user' && Array.isArray(message.message.content)) {
      // Find tool results
      const toolResults_temp = message.message.content.filter((c: any) => c.type === 'tool_result');
      toolResults_temp.forEach((result: any) => {
        // Find corresponding tool name from previous assistant message
        const lastAssistantMessage = messages
          .slice(0, messages.indexOf(message))
          .reverse()
          .find(m => m.type === 'assistant');

        if (lastAssistantMessage && Array.isArray(lastAssistantMessage.message.content)) {
          const toolUse = lastAssistantMessage.message.content.find(
            (c: any) => c.type === 'tool_use' && c.id === result.tool_call_id
          );

          if (toolUse) {
            const toolName = toolUse.name;

            if (result.is_error) {
              blockedTools.push(toolName);
              toolResults.push({
                tool: toolName,
                success: false,
                error: result.content
              });
            } else {
              successfulTools.push(toolName);
              toolResults.push({
                tool: toolName,
                success: true
              });
            }
          }
        }
      });
    }
  }

  return {
    attemptedTools: [...new Set(attemptedTools)],
    successfulTools: [...new Set(successfulTools)],
    blockedTools: [...new Set(blockedTools)],
    toolResults
  };
}

// Tester Function
async function testToolFiltering(
  config: ToolFilterConfig,
  prompts: string[]
): Promise<ExperimentResult & { logs: string; toolAnalysis: any }> {
  const logger = new ExperimentLogger(`09-tool-filtering - ${config.name}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];

  try {
    logger.section('Configuration');
    logger.info('Test', config.name);
    logger.info('Description', config.description);
    logger.info('Allowed Tools', config.allowedTools || 'All (except disallowed)');
    logger.info('Disallowed Tools', config.disallowedTools || 'None');
    logger.info('Prompts', prompts);

    logger.section('Execution');

    const q = setupToolFilteredQuery(prompts[0], config);
    let promptIndex = 0;

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized', {
              sessionId: message.session_id,
              toolFiltering: 'enabled'
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
                logger.warning('Tool blocked/failed', result.content);
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

    // Analyze tool usage
    const toolAnalysis = analyzeToolAvailability(messages);

    metrics.complete(true);

    logger.section('Tool Usage Analysis');
    logger.info('Attempted Tools', toolAnalysis.attemptedTools);
    logger.info('Successful Tools', toolAnalysis.successfulTools);
    logger.info('Blocked Tools', toolAnalysis.blockedTools);
    logger.info('Filter Effectiveness', {
      totalAttempts: toolAnalysis.attemptedTools.length,
      blocked: toolAnalysis.blockedTools.length,
      blockRate: `${((toolAnalysis.blockedTools.length / Math.max(toolAnalysis.attemptedTools.length, 1)) * 100).toFixed(1)}%`
    });

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      toolAnalysis
    };

  } catch (error) {
    const err = error as Error;
    metrics.recordError(err.message);
    metrics.complete(false);
    logger.error('Experiment failed', err);
    logger.complete(false);

    const toolAnalysis = analyzeToolAvailability(messages);

    return {
      success: false,
      messages,
      error: err,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      toolAnalysis
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Tool Filtering Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: Read-only mode
  console.log('Test 1: Read-only mode (allowedTools)');
  const result1 = await testToolFiltering(
    filterConfigs[0],
    [
      'Read the current directory listing',
      'Search for TypeScript files',
      'Try to create a new file called test.txt',
      'Try to run a bash command'
    ]
  );

  results.push({
    test: filterConfigs[0].name,
    success: result1.success,
    toolsAttempted: result1.toolAnalysis.attemptedTools.length,
    toolsBlocked: result1.toolAnalysis.blockedTools.length,
    effectiveness: result1.toolAnalysis.blockedTools.length > 0
  });

  output.addTest('Read-Only Mode (allowedTools)', {
    prompt: 'Test read-only tool filtering',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: No execution tools
  console.log('\nTest 2: No execution tools (disallowedTools)');
  const result2 = await testToolFiltering(
    filterConfigs[1],
    [
      'Read a file',
      'Create a new file',
      'Try to run a bash command',
      'Try to check bash output'
    ]
  );

  results.push({
    test: filterConfigs[1].name,
    success: result2.success,
    toolsAttempted: result2.toolAnalysis.attemptedTools.length,
    toolsBlocked: result2.toolAnalysis.blockedTools.length,
    effectiveness: result2.toolAnalysis.blockedTools.includes('Bash')
  });

  output.addTest('No Execution Tools (disallowedTools)', {
    prompt: 'Test execution tool blocking',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: File operations only
  console.log('\nTest 3: File operations only');
  const result3 = await testToolFiltering(
    filterConfigs[2],
    [
      'Find all JavaScript files in the current directory',
      'Read the package.json file',
      'Create a new configuration file',
      'Try to search the web for documentation',
      'Try to run a command'
    ]
  );

  results.push({
    test: filterConfigs[2].name,
    success: result3.success,
    toolsAttempted: result3.toolAnalysis.attemptedTools.length,
    toolsBlocked: result3.toolAnalysis.blockedTools.length,
    effectiveness: result3.toolAnalysis.blockedTools.some(tool =>
      ['WebFetch', 'WebSearch', 'Bash'].includes(tool)
    )
  });

  output.addTest('File Operations Only', {
    prompt: 'Test file operations filtering',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Web and search tools
  console.log('\nTest 4: Web and search tools');
  const result4 = await testToolFiltering(
    filterConfigs[3],
    [
      'Search for TypeScript documentation online',
      'Fetch content from a documentation website',
      'Save the findings to a file',
      'Try to run a bash command to check the file',
      'Try to use advanced file editing tools'
    ]
  );

  results.push({
    test: filterConfigs[3].name,
    success: result4.success,
    toolsAttempted: result4.toolAnalysis.attemptedTools.length,
    toolsBlocked: result4.toolAnalysis.blockedTools.length,
    effectiveness: result4.toolAnalysis.successfulTools.some(tool =>
      ['WebFetch', 'WebSearch'].includes(tool)
    )
  });

  output.addTest('Web and Search Tools', {
    prompt: 'Test web tools filtering',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Test 5: Restricted editing
  console.log('\nTest 5: Restricted editing (block bulk operations)');
  const result5 = await testToolFiltering(
    filterConfigs[4],
    [
      'Read the current TypeScript configuration',
      'Make a single edit to improve the configuration',
      'Try to use MultiEdit to make multiple changes',
      'Try to write a completely new file'
    ]
  );

  results.push({
    test: filterConfigs[4].name,
    success: result5.success,
    toolsAttempted: result5.toolAnalysis.attemptedTools.length,
    toolsBlocked: result5.toolAnalysis.blockedTools.length,
    effectiveness: result5.toolAnalysis.blockedTools.some(tool =>
      ['Write', 'MultiEdit'].includes(tool)
    )
  });

  output.addTest('Restricted Editing', {
    prompt: 'Test editing restrictions',
    messages: result5.messages,
    metrics: result5.metrics,
    logs: result5.logs
  });

  // Comprehensive analysis
  const allToolAnalysis = {
    readOnly: result1.toolAnalysis,
    noExecution: result2.toolAnalysis,
    fileOpsOnly: result3.toolAnalysis,
    webAndSearch: result4.toolAnalysis,
    restrictedEdit: result5.toolAnalysis
  };

  output.addJSON('Tool Filtering Analysis', {
    configurations: filterConfigs.map(config => ({
      name: config.name,
      description: config.description,
      allowedTools: config.allowedTools,
      disallowedTools: config.disallowedTools
    })),
    results: allToolAnalysis,
    summary: {
      totalTests: results.length,
      effectiveFilters: results.filter(r => r.effectiveness).length,
      avgToolsBlocked: results.reduce((sum, r) => sum + r.toolsBlocked, 0) / results.length
    }
  });

  // Add final summary
  output.addSummary(results);

  // Console summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TOOL FILTERING EXPERIMENT SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.test}: ${r.success ? '✅' : '❌'} (${r.toolsBlocked}/${r.toolsAttempted} blocked)`);
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