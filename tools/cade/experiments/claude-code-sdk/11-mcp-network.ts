#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: MCP Network Configuration
 * Tests: SSE and HTTP MCP server connections
 * Expected: Integration with remote MCP servers via network protocols
 */

// MCP Network server configurations
interface McpNetworkConfig {
  name: string;
  transport: {
    type: 'sse' | 'http';
    url: string;
    headers?: Record<string, string>;
  };
  description: string;
}

const networkConfigs: McpNetworkConfig[] = [
  {
    name: 'github-sse',
    transport: {
      type: 'sse',
      url: 'http://localhost:3001/mcp/github',
      headers: {
        'Authorization': 'Bearer demo-token'
      }
    },
    description: 'GitHub MCP server via SSE'
  },
  {
    name: 'weather-http',
    transport: {
      type: 'http',
      url: 'http://localhost:3002/mcp/weather',
      headers: {
        'X-API-Key': 'demo-key'
      }
    },
    description: 'Weather API MCP server via HTTP'
  },
  {
    name: 'database-sse',
    transport: {
      type: 'sse',
      url: 'http://localhost:3003/mcp/database'
    },
    description: 'Database MCP server via SSE'
  },
  {
    name: 'analytics-http',
    transport: {
      type: 'http',
      url: 'http://localhost:3004/mcp/analytics',
      headers: {
        'Content-Type': 'application/json'
      }
    },
    description: 'Analytics MCP server via HTTP'
  }
];

// Mock MCP server simulator for testing
class MockMcpServer {
  private port: number;
  private server: any;
  private name: string;

  constructor(name: string, port: number) {
    this.name = name;
    this.port = port;
  }

  async start(): Promise<boolean> {
    try {
      // Simulate server startup
      console.log(`🚀 Starting mock MCP server '${this.name}' on port ${this.port}`);

      // In a real implementation, this would start an actual HTTP/SSE server
      // For testing purposes, we'll just simulate the startup
      await new Promise(resolve => setTimeout(resolve, 100));

      return true;
    } catch (error) {
      console.error(`❌ Failed to start mock server '${this.name}':`, error);
      return false;
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      console.log(`🛑 Stopping mock MCP server '${this.name}'`);
      // Simulate server shutdown
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  getHealthUrl(): string {
    return `http://localhost:${this.port}/health`;
  }
}

// SDK Setup Function with network MCP servers
function setupMcpNetworkQuery(
  prompt: string,
  configs: McpNetworkConfig[],
  options?: Options
): Query {
  const mcpServers = configs.map(config => ({
    name: config.name,
    transport: config.transport
  }));

  return query({
    prompt,
    mcpServers,
    options: options || { maxTurns: 5 }
  });
}

// Helper to check network server availability
async function checkNetworkServerAvailability(config: McpNetworkConfig): Promise<boolean> {
  try {
    const response = await fetch(config.transport.url + '/health', {
      method: 'GET',
      headers: config.transport.headers || {},
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

// Helper to analyze network MCP usage
function analyzeNetworkMcpUsage(messages: SDKMessage[]): {
  networkConnections: Array<{ server: string; status: string; transport: string }>;
  networkTools: string[];
  connectionErrors: string[];
  latencyMetrics: Array<{ operation: string; duration: number }>;
} {
  const networkConnections: Array<{ server: string; status: string; transport: string }> = [];
  const networkTools: string[] = [];
  const connectionErrors: string[] = [];
  const latencyMetrics: Array<{ operation: string; duration: number }> = [];

  for (const message of messages) {
    if (message.type === 'system') {
      // Look for network MCP server connection messages
      if (message.subtype === 'mcp_server_connected') {
        const content = message.content || '';
        if (typeof content === 'string') {
          networkConnections.push({
            server: 'unknown',
            status: 'connected',
            transport: content.includes('sse') ? 'sse' : 'http'
          });
        }
      } else if (message.subtype === 'mcp_server_error') {
        const content = message.content || '';
        if (typeof content === 'string') {
          connectionErrors.push(content);
        }
      }
    }

    if (message.type === 'assistant' && Array.isArray(message.message.content)) {
      // Find network MCP tool usage
      const toolUses = message.message.content.filter((c: any) => c.type === 'tool_use');
      toolUses.forEach((tool: any) => {
        // Check if this is a network MCP tool
        if (tool.name.includes('github_') || tool.name.includes('weather_') ||
            tool.name.includes('database_') || tool.name.includes('analytics_')) {
          networkTools.push(tool.name);
        }
      });
    }
  }

  return {
    networkConnections,
    networkTools: [...new Set(networkTools)],
    connectionErrors,
    latencyMetrics
  };
}

// Tester Function
async function testMcpNetwork(
  testName: string,
  configs: McpNetworkConfig[],
  prompts: string[],
  useMockServers: boolean = true
): Promise<ExperimentResult & { logs: string; networkAnalysis: any }> {
  const logger = new ExperimentLogger(`11-mcp-network - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];
  const mockServers: MockMcpServer[] = [];

  try {
    logger.section('Configuration');
    logger.info('Test', testName);
    logger.info('Network Servers', configs.map(c => `${c.name} (${c.transport.type}): ${c.description}`));
    logger.info('Prompts', prompts);
    logger.info('Use Mock Servers', useMockServers);

    // Start mock servers if needed
    if (useMockServers) {
      logger.section('Mock Server Setup');
      for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        const port = 3001 + i;
        const mockServer = new MockMcpServer(config.name, port);

        const started = await mockServer.start();
        if (started) {
          mockServers.push(mockServer);
          logger.success(`Mock server started: ${config.name}`);
        } else {
          logger.warning(`Failed to start mock server: ${config.name}`);
        }
      }
    }

    // Check server availability
    logger.section('Server Availability Check');
    const availabilityResults = await Promise.all(
      configs.map(async config => {
        const available = await checkNetworkServerAvailability(config);
        logger.info(`${config.name} server (${config.transport.type})`, available ? 'Available' : 'Not available');
        return { name: config.name, available, transport: config.transport.type };
      })
    );

    logger.section('Execution');

    const q = setupMcpNetworkQuery(prompts[0], configs);
    let promptIndex = 0;

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized', {
              sessionId: message.session_id,
              networkMcpServers: configs.length
            });
          } else if (message.subtype === 'mcp_server_connected') {
            logger.success('Network MCP server connected', message.content);
          } else if (message.subtype === 'mcp_server_error') {
            logger.error('Network MCP server error', message.content);
          }
          break;

        case 'assistant':
          const content = message.message.content;

          // Log tool use attempts (especially network MCP tools)
          if (Array.isArray(content)) {
            const toolUses = content.filter((c: any) => c.type === 'tool_use');
            toolUses.forEach((tool: any) => {
              const isNetworkTool = tool.name.includes('_') &&
                ['github', 'weather', 'database', 'analytics'].some(prefix =>
                  tool.name.startsWith(prefix)
                );
              logger.info(`Tool attempted: ${tool.name}${isNetworkTool ? ' (Network MCP)' : ''}`, tool.input);
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
                logger.warning('Network tool failed', result.content);
              } else {
                logger.success('Network tool executed successfully');
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

    // Analyze network MCP usage
    const networkAnalysis = analyzeNetworkMcpUsage(messages);

    metrics.complete(true);

    logger.section('Network MCP Analysis');
    logger.info('Server Connections', networkAnalysis.networkConnections);
    logger.info('Network Tools Used', networkAnalysis.networkTools);
    logger.info('Connection Errors', networkAnalysis.connectionErrors);
    logger.info('Server Availability', availabilityResults);

    logger.complete(true);

    // Stop mock servers
    if (useMockServers) {
      for (const mockServer of mockServers) {
        await mockServer.stop();
      }
    }

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      networkAnalysis: {
        ...networkAnalysis,
        serverAvailability: availabilityResults,
        configuredServers: configs.length,
        mockServersUsed: useMockServers
      }
    };

  } catch (error) {
    const err = error as Error;
    metrics.recordError(err.message);
    metrics.complete(false);
    logger.error('Experiment failed', err);
    logger.complete(false);

    // Stop mock servers on error
    if (useMockServers) {
      for (const mockServer of mockServers) {
        await mockServer.stop();
      }
    }

    const networkAnalysis = analyzeNetworkMcpUsage(messages);

    return {
      success: false,
      messages,
      error: err,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      networkAnalysis
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting MCP Network Configuration Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: SSE MCP server
  console.log('Test 1: SSE MCP server connection');
  const result1 = await testMcpNetwork(
    'SSE Server',
    [networkConfigs[0]],
    [
      'Connect to GitHub MCP server via SSE',
      'Use GitHub tools to get repository information',
      'List recent commits using SSE connection'
    ]
  );

  results.push({
    test: 'SSE Server',
    success: result1.success,
    transport: 'sse',
    connections: result1.networkAnalysis.networkConnections.length,
    tools: result1.networkAnalysis.networkTools.length,
    errors: result1.networkAnalysis.connectionErrors.length
  });

  output.addTest('SSE MCP Server', {
    prompt: 'Test SSE MCP server connection',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: HTTP MCP server
  console.log('\nTest 2: HTTP MCP server connection');
  const result2 = await testMcpNetwork(
    'HTTP Server',
    [networkConfigs[1]],
    [
      'Connect to Weather MCP server via HTTP',
      'Get current weather data using HTTP requests',
      'Test HTTP connection reliability'
    ]
  );

  results.push({
    test: 'HTTP Server',
    success: result2.success,
    transport: 'http',
    connections: result2.networkAnalysis.networkConnections.length,
    tools: result2.networkAnalysis.networkTools.length,
    errors: result2.networkAnalysis.connectionErrors.length
  });

  output.addTest('HTTP MCP Server', {
    prompt: 'Test HTTP MCP server connection',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Mixed transport protocols
  console.log('\nTest 3: Mixed transport protocols');
  const result3 = await testMcpNetwork(
    'Mixed Transports',
    [networkConfigs[0], networkConfigs[1]],
    [
      'Connect to both SSE and HTTP MCP servers',
      'Use tools from both server types',
      'Compare performance between transports'
    ]
  );

  results.push({
    test: 'Mixed Transports',
    success: result3.success,
    transport: 'mixed',
    connections: result3.networkAnalysis.networkConnections.length,
    tools: result3.networkAnalysis.networkTools.length,
    errors: result3.networkAnalysis.connectionErrors.length
  });

  output.addTest('Mixed Transport Protocols', {
    prompt: 'Test mixed SSE and HTTP MCP servers',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Multiple network servers
  console.log('\nTest 4: Multiple network servers');
  const result4 = await testMcpNetwork(
    'Multiple Network Servers',
    networkConfigs,
    [
      'Connect to all available network MCP servers',
      'Test load balancing across multiple servers',
      'Use different tools from each server type'
    ]
  );

  results.push({
    test: 'Multiple Network Servers',
    success: result4.success,
    transport: 'all',
    connections: result4.networkAnalysis.networkConnections.length,
    tools: result4.networkAnalysis.networkTools.length,
    errors: result4.networkAnalysis.connectionErrors.length
  });

  output.addTest('Multiple Network Servers', {
    prompt: 'Test all network MCP servers',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Test 5: Connection failure handling
  console.log('\nTest 5: Connection failure handling');
  const failureConfig: McpNetworkConfig = {
    name: 'unreachable',
    transport: {
      type: 'http',
      url: 'http://unreachable-server:9999/mcp'
    },
    description: 'Intentionally unreachable server for error testing'
  };

  const result5 = await testMcpNetwork(
    'Connection Failures',
    [failureConfig],
    [
      'Attempt to connect to unreachable MCP server',
      'Handle connection timeouts gracefully',
      'Test error recovery mechanisms'
    ],
    false // Don't use mock servers for this test
  );

  results.push({
    test: 'Connection Failures',
    success: result5.success,
    transport: 'failure',
    connections: result5.networkAnalysis.networkConnections.length,
    tools: result5.networkAnalysis.networkTools.length,
    errors: result5.networkAnalysis.connectionErrors.length
  });

  output.addTest('Connection Failure Handling', {
    prompt: 'Test connection failure handling',
    messages: result5.messages,
    metrics: result5.metrics,
    logs: result5.logs
  });

  // Comprehensive network analysis
  const allNetworkAnalysis = {
    sseServer: result1.networkAnalysis,
    httpServer: result2.networkAnalysis,
    mixedTransports: result3.networkAnalysis,
    multipleServers: result4.networkAnalysis,
    connectionFailures: result5.networkAnalysis
  };

  output.addJSON('MCP Network Analysis', {
    configurations: networkConfigs.map(config => ({
      name: config.name,
      transport: config.transport,
      description: config.description
    })),
    results: allNetworkAnalysis,
    summary: {
      totalTests: results.length,
      transportTypes: [...new Set(results.map(r => r.transport))],
      totalConnections: results.reduce((sum, r) => sum + r.connections, 0),
      totalTools: results.reduce((sum, r) => sum + r.tools, 0),
      totalErrors: results.reduce((sum, r) => sum + r.errors, 0),
      successRate: `${((results.filter(r => r.success).length / results.length) * 100).toFixed(1)}%`
    }
  });

  // Add final summary
  output.addSummary(results);

  // Console summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MCP NETWORK EXPERIMENT SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.test}: ${r.success ? '✅' : '❌'} (${r.transport}, ${r.connections} conn, ${r.tools} tools, ${r.errors} errors)`);
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