#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: MCP Stdio Configuration
 * Tests: Configure and use stdio-based MCP servers
 * Expected: Integration with external MCP servers via stdio transport
 */

// MCP Stdio server configurations
interface McpStdioConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  description: string;
}

const mcpConfigs: McpStdioConfig[] = [
  {
    name: 'filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    description: 'Filesystem MCP server for /tmp directory'
  },
  {
    name: 'git',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git', '--repository', '.'],
    description: 'Git MCP server for current repository'
  },
  {
    name: 'sqlite',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', ':memory:'],
    description: 'SQLite MCP server with in-memory database'
  },
  {
    name: 'brave-search',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: { BRAVE_API_KEY: 'demo-key' },
    description: 'Brave Search MCP server (demo mode)'
  }
];

// SDK Setup Function with MCP stdio servers
function setupMcpStdioQuery(
  prompt: string,
  configs: McpStdioConfig[],
  options?: Options
): Query {
  const mcpServers = configs.map(config => ({
    name: config.name,
    transport: {
      type: 'stdio' as const,
      command: config.command,
      args: config.args || [],
      env: config.env
    }
  }));

  return query({
    prompt,
    mcpServers,
    options: options || { maxTurns: 5 }
  });
}

// Helper to simulate MCP server availability check
async function checkMcpServerAvailability(config: McpStdioConfig): Promise<boolean> {
  try {
    // Simple check if the command exists
    const proc = Bun.spawn([config.command, '--version'], {
      stdout: 'pipe',
      stderr: 'pipe'
    });

    const exitCode = await proc.exited;
    return exitCode === 0;
  } catch (error) {
    return false;
  }
}

// Helper to analyze MCP tool usage
function analyzeMcpToolUsage(messages: SDKMessage[]): {
  mcpTools: string[];
  mcpToolCalls: Array<{ tool: string; server?: string; success: boolean }>;
  serverConnections: string[];
} {
  const mcpTools: string[] = [];
  const mcpToolCalls: Array<{ tool: string; server?: string; success: boolean }> = [];
  const serverConnections: string[] = [];

  for (const message of messages) {
    if (message.type === 'system') {
      // Look for MCP server connection messages
      if (message.subtype === 'mcp_server_connected') {
        const content = message.content || '';
        if (typeof content === 'string' && content.includes('server')) {
          serverConnections.push(content);
        }
      }
    }

    if (message.type === 'assistant' && Array.isArray(message.message.content)) {
      // Find MCP tool use attempts
      const toolUses = message.message.content.filter((c: any) => c.type === 'tool_use');
      toolUses.forEach((tool: any) => {
        // Check if this is an MCP tool (typically prefixed with server name)
        if (tool.name.includes('_') || tool.name.startsWith('mcp_')) {
          mcpTools.push(tool.name);
        }
      });
    }

    if (message.type === 'user' && Array.isArray(message.message.content)) {
      // Find tool results for MCP tools
      const toolResults = message.message.content.filter((c: any) => c.type === 'tool_result');
      toolResults.forEach((result: any) => {
        // Find corresponding tool from previous assistant message
        const lastAssistantMessage = messages
          .slice(0, messages.indexOf(message))
          .reverse()
          .find(m => m.type === 'assistant');

        if (lastAssistantMessage && Array.isArray(lastAssistantMessage.message.content)) {
          const toolUse = lastAssistantMessage.message.content.find(
            (c: any) => c.type === 'tool_use' && c.id === result.tool_call_id
          );

          if (toolUse && (toolUse.name.includes('_') || toolUse.name.startsWith('mcp_'))) {
            mcpToolCalls.push({
              tool: toolUse.name,
              success: !result.is_error
            });
          }
        }
      });
    }
  }

  return {
    mcpTools: [...new Set(mcpTools)],
    mcpToolCalls,
    serverConnections
  };
}

// Tester Function
async function testMcpStdio(
  testName: string,
  configs: McpStdioConfig[],
  prompts: string[]
): Promise<ExperimentResult & { logs: string; mcpAnalysis: any }> {
  const logger = new ExperimentLogger(`10-mcp-stdio - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];

  try {
    logger.section('Configuration');
    logger.info('Test', testName);
    logger.info('MCP Servers', configs.map(c => `${c.name}: ${c.description}`));
    logger.info('Prompts', prompts);

    // Check server availability
    logger.section('Server Availability Check');
    const availabilityResults = await Promise.all(
      configs.map(async config => {
        const available = await checkMcpServerAvailability(config);
        logger.info(`${config.name} server`, available ? 'Available' : 'Not available');
        return { name: config.name, available };
      })
    );

    const availableConfigs = configs.filter(config =>
      availabilityResults.find(r => r.name === config.name)?.available
    );

    if (availableConfigs.length === 0) {
      logger.warning('No MCP servers available, using mock configuration');
      // Continue with original configs for testing purposes
    }

    logger.section('Execution');

    const q = setupMcpStdioQuery(prompts[0], configs);
    let promptIndex = 0;

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized', {
              sessionId: message.session_id,
              mcpServers: configs.length
            });
          } else if (message.subtype === 'mcp_server_connected') {
            logger.success('MCP server connected', message.content);
          } else if (message.subtype === 'mcp_server_error') {
            logger.error('MCP server error', message.content);
          }
          break;

        case 'assistant':
          const content = message.message.content;

          // Log tool use attempts (especially MCP tools)
          if (Array.isArray(content)) {
            const toolUses = content.filter((c: any) => c.type === 'tool_use');
            toolUses.forEach((tool: any) => {
              const isMcpTool = tool.name.includes('_') || tool.name.startsWith('mcp_');
              logger.info(`Tool attempted: ${tool.name}${isMcpTool ? ' (MCP)' : ''}`, tool.input);
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

    // Analyze MCP usage
    const mcpAnalysis = analyzeMcpToolUsage(messages);

    metrics.complete(true);

    logger.section('MCP Analysis');
    logger.info('Server Connections', mcpAnalysis.serverConnections);
    logger.info('MCP Tools Used', mcpAnalysis.mcpTools);
    logger.info('MCP Tool Calls', {
      total: mcpAnalysis.mcpToolCalls.length,
      successful: mcpAnalysis.mcpToolCalls.filter(c => c.success).length,
      failed: mcpAnalysis.mcpToolCalls.filter(c => !c.success).length
    });

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      mcpAnalysis: {
        ...mcpAnalysis,
        serverAvailability: availabilityResults,
        configuredServers: configs.length
      }
    };

  } catch (error) {
    const err = error as Error;
    metrics.recordError(err.message);
    metrics.complete(false);
    logger.error('Experiment failed', err);
    logger.complete(false);

    const mcpAnalysis = analyzeMcpToolUsage(messages);

    return {
      success: false,
      messages,
      error: err,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      mcpAnalysis
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting MCP Stdio Configuration Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: Single MCP server (filesystem)
  console.log('Test 1: Single MCP server - Filesystem');
  const result1 = await testMcpStdio(
    'Single Filesystem Server',
    [mcpConfigs[0]],
    [
      'List files in the /tmp directory using MCP filesystem tools',
      'Create a test file in /tmp using MCP tools',
      'Read the contents of the file you just created'
    ]
  );

  results.push({
    test: 'Single Filesystem Server',
    success: result1.success,
    mcpServers: 1,
    toolsUsed: result1.mcpAnalysis.mcpTools.length,
    connections: result1.mcpAnalysis.serverConnections.length
  });

  output.addTest('Single MCP Server (Filesystem)', {
    prompt: 'Test filesystem MCP server integration',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Multiple MCP servers
  console.log('\nTest 2: Multiple MCP servers');
  const result2 = await testMcpStdio(
    'Multiple Servers',
    [mcpConfigs[0], mcpConfigs[1]],
    [
      'Use filesystem MCP to check available files',
      'Use git MCP to check repository status',
      'Combine information from both servers'
    ]
  );

  results.push({
    test: 'Multiple Servers',
    success: result2.success,
    mcpServers: 2,
    toolsUsed: result2.mcpAnalysis.mcpTools.length,
    connections: result2.mcpAnalysis.serverConnections.length
  });

  output.addTest('Multiple MCP Servers', {
    prompt: 'Test multiple MCP server integration',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Database MCP server
  console.log('\nTest 3: Database MCP server (SQLite)');
  const result3 = await testMcpStdio(
    'Database Server',
    [mcpConfigs[2]],
    [
      'Create a simple table using SQLite MCP tools',
      'Insert some test data into the table',
      'Query the data back from the table'
    ]
  );

  results.push({
    test: 'Database Server',
    success: result3.success,
    mcpServers: 1,
    toolsUsed: result3.mcpAnalysis.mcpTools.length,
    connections: result3.mcpAnalysis.serverConnections.length
  });

  output.addTest('Database MCP Server (SQLite)', {
    prompt: 'Test database MCP server integration',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: All available servers
  console.log('\nTest 4: All configured MCP servers');
  const result4 = await testMcpStdio(
    'All Servers',
    mcpConfigs,
    [
      'Test connectivity to all available MCP servers',
      'Use tools from different servers in sequence',
      'Demonstrate integrated workflow across multiple MCP servers'
    ]
  );

  results.push({
    test: 'All Servers',
    success: result4.success,
    mcpServers: mcpConfigs.length,
    toolsUsed: result4.mcpAnalysis.mcpTools.length,
    connections: result4.mcpAnalysis.serverConnections.length
  });

  output.addTest('All MCP Servers', {
    prompt: 'Test all configured MCP servers',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Test 5: Error handling for unavailable servers
  console.log('\nTest 5: Error handling with unavailable server');
  const unavailableConfig: McpStdioConfig = {
    name: 'unavailable',
    command: 'nonexistent-command',
    args: ['--test'],
    description: 'Intentionally unavailable server for error testing'
  };

  const result5 = await testMcpStdio(
    'Error Handling',
    [unavailableConfig],
    [
      'Try to use tools from an unavailable MCP server',
      'Handle connection errors gracefully'
    ]
  );

  results.push({
    test: 'Error Handling',
    success: result5.success,
    mcpServers: 1,
    toolsUsed: result5.mcpAnalysis.mcpTools.length,
    connections: result5.mcpAnalysis.serverConnections.length
  });

  output.addTest('Error Handling (Unavailable Server)', {
    prompt: 'Test error handling with unavailable MCP server',
    messages: result5.messages,
    metrics: result5.metrics,
    logs: result5.logs
  });

  // Comprehensive MCP analysis
  const allMcpAnalysis = {
    singleServer: result1.mcpAnalysis,
    multipleServers: result2.mcpAnalysis,
    databaseServer: result3.mcpAnalysis,
    allServers: result4.mcpAnalysis,
    errorHandling: result5.mcpAnalysis
  };

  output.addJSON('MCP Stdio Analysis', {
    configurations: mcpConfigs.map(config => ({
      name: config.name,
      command: config.command,
      args: config.args,
      description: config.description
    })),
    results: allMcpAnalysis,
    summary: {
      totalTests: results.length,
      successfulConnections: results.reduce((sum, r) => sum + r.connections, 0),
      totalToolsUsed: results.reduce((sum, r) => sum + r.toolsUsed, 0),
      avgServersPerTest: results.reduce((sum, r) => sum + r.mcpServers, 0) / results.length
    }
  });

  // Add final summary
  output.addSummary(results);

  // Console summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MCP STDIO EXPERIMENT SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.test}: ${r.success ? '✅' : '❌'} (${r.connections} connections, ${r.toolsUsed} tools)`);
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