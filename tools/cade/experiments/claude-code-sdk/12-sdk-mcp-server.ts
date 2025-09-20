#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Custom SDK MCP Server
 * Tests: Creating and using custom MCP servers with SDK tools
 * Expected: Custom tool implementations via MCP server integration
 */

// Custom MCP server tool definitions
interface CustomTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (input: any) => Promise<any>;
}

const customTools: CustomTool[] = [
  {
    name: 'calculate',
    description: 'Perform mathematical calculations',
    inputSchema: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'Mathematical expression to evaluate' },
        precision: { type: 'number', description: 'Decimal precision (default: 2)' }
      },
      required: ['expression']
    },
    handler: async (input: any) => {
      try {
        // Simple calculator implementation
        const expression = input.expression.replace(/[^0-9+\-*/().\s]/g, '');
        const result = eval(expression);
        const precision = input.precision || 2;
        return {
          expression: input.expression,
          result: Number(result.toFixed(precision)),
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        throw new Error(`Calculation error: ${error.message}`);
      }
    }
  },
  {
    name: 'text_transform',
    description: 'Transform text using various operations',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to transform' },
        operation: {
          type: 'string',
          enum: ['uppercase', 'lowercase', 'reverse', 'wordcount', 'rot13'],
          description: 'Transformation operation'
        }
      },
      required: ['text', 'operation']
    },
    handler: async (input: any) => {
      const { text, operation } = input;

      switch (operation) {
        case 'uppercase':
          return { original: text, result: text.toUpperCase(), operation };
        case 'lowercase':
          return { original: text, result: text.toLowerCase(), operation };
        case 'reverse':
          return { original: text, result: text.split('').reverse().join(''), operation };
        case 'wordcount':
          return { original: text, result: text.split(/\s+/).length, operation };
        case 'rot13':
          return {
            original: text,
            result: text.replace(/[A-Za-z]/g, char =>
              String.fromCharCode(char.charCodeAt(0) + (char.toLowerCase() < 'n' ? 13 : -13))
            ),
            operation
          };
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    }
  },
  {
    name: 'data_generator',
    description: 'Generate various types of test data',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['uuid', 'timestamp', 'random_string', 'mock_user', 'mock_data'],
          description: 'Type of data to generate'
        },
        count: { type: 'number', description: 'Number of items to generate (default: 1)' },
        options: { type: 'object', description: 'Additional options for data generation' }
      },
      required: ['type']
    },
    handler: async (input: any) => {
      const { type, count = 1, options = {} } = input;
      const results = [];

      for (let i = 0; i < count; i++) {
        switch (type) {
          case 'uuid':
            results.push(crypto.randomUUID());
            break;
          case 'timestamp':
            results.push(new Date().toISOString());
            break;
          case 'random_string':
            const length = options.length || 10;
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let j = 0; j < length; j++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            results.push(result);
            break;
          case 'mock_user':
            results.push({
              id: crypto.randomUUID(),
              name: `User ${i + 1}`,
              email: `user${i + 1}@example.com`,
              created: new Date().toISOString()
            });
            break;
          case 'mock_data':
            results.push({
              id: i + 1,
              value: Math.random() * 100,
              label: `Item ${i + 1}`,
              active: Math.random() > 0.5
            });
            break;
          default:
            throw new Error(`Unknown data type: ${type}`);
        }
      }

      return {
        type,
        count,
        results: count === 1 ? results[0] : results,
        generated_at: new Date().toISOString()
      };
    }
  },
  {
    name: 'json_processor',
    description: 'Process and manipulate JSON data',
    inputSchema: {
      type: 'object',
      properties: {
        data: { description: 'JSON data to process' },
        operation: {
          type: 'string',
          enum: ['validate', 'prettify', 'minify', 'extract_keys', 'extract_values'],
          description: 'Processing operation'
        },
        path: { type: 'string', description: 'JSON path for extraction operations' }
      },
      required: ['data', 'operation']
    },
    handler: async (input: any) => {
      const { data, operation, path } = input;

      try {
        const jsonData = typeof data === 'string' ? JSON.parse(data) : data;

        switch (operation) {
          case 'validate':
            return { valid: true, data: jsonData, message: 'JSON is valid' };
          case 'prettify':
            return { result: JSON.stringify(jsonData, null, 2), operation };
          case 'minify':
            return { result: JSON.stringify(jsonData), operation };
          case 'extract_keys':
            return { keys: Object.keys(jsonData), operation };
          case 'extract_values':
            return { values: Object.values(jsonData), operation };
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      } catch (error) {
        return { valid: false, error: error.message, operation };
      }
    }
  }
];

// Mock MCP server implementation
class CustomMcpServer {
  private tools: CustomTool[];
  private name: string;
  private port: number;

  constructor(name: string, tools: CustomTool[], port: number = 3100) {
    this.name = name;
    this.tools = tools;
    this.port = port;
  }

  async start(): Promise<boolean> {
    try {
      console.log(`🚀 Starting custom MCP server '${this.name}' with ${this.tools.length} tools on port ${this.port}`);

      // In a real implementation, this would start an actual MCP server
      // For testing purposes, we'll simulate the server
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log(`✅ Custom MCP server '${this.name}' started successfully`);
      console.log(`📚 Available tools: ${this.tools.map(t => t.name).join(', ')}`);

      return true;
    } catch (error) {
      console.error(`❌ Failed to start custom MCP server '${this.name}':`, error);
      return false;
    }
  }

  async stop(): Promise<void> {
    console.log(`🛑 Stopping custom MCP server '${this.name}'`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  getTools(): CustomTool[] {
    return this.tools;
  }

  async executeToolCall(toolName: string, input: any): Promise<any> {
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found`);
    }

    console.log(`🔧 Executing custom tool: ${toolName}`);
    return await tool.handler(input);
  }
}

// SDK Setup Function with custom MCP server
function setupCustomMcpQuery(
  prompt: string,
  serverPort: number,
  options?: Options
): Query {
  return query({
    prompt,
    mcpServers: [
      {
        name: 'custom-tools',
        transport: {
          type: 'http',
          url: `http://localhost:${serverPort}/mcp`
        }
      }
    ],
    options: options || { maxTurns: 5 }
  });
}

// Helper to analyze custom tool usage
function analyzeCustomToolUsage(messages: SDKMessage[], customToolNames: string[]): {
  customToolsUsed: string[];
  toolResults: Array<{ tool: string; success: boolean; result?: any; error?: string }>;
  toolCallCount: number;
  successRate: number;
} {
  const customToolsUsed: string[] = [];
  const toolResults: Array<{ tool: string; success: boolean; result?: any; error?: string }> = [];

  for (const message of messages) {
    if (message.type === 'assistant' && Array.isArray(message.message.content)) {
      const toolUses = message.message.content.filter((c: any) => c.type === 'tool_use');
      toolUses.forEach((tool: any) => {
        if (customToolNames.includes(tool.name)) {
          customToolsUsed.push(tool.name);
        }
      });
    }

    if (message.type === 'user' && Array.isArray(message.message.content)) {
      const toolResults_temp = message.message.content.filter((c: any) => c.type === 'tool_result');
      toolResults_temp.forEach((result: any) => {
        // Find corresponding tool from previous assistant message
        const lastAssistantMessage = messages
          .slice(0, messages.indexOf(message))
          .reverse()
          .find(m => m.type === 'assistant');

        if (lastAssistantMessage && Array.isArray(lastAssistantMessage.message.content)) {
          const toolUse = lastAssistantMessage.message.content.find(
            (c: any) => c.type === 'tool_use' && c.id === result.tool_call_id
          );

          if (toolUse && customToolNames.includes(toolUse.name)) {
            toolResults.push({
              tool: toolUse.name,
              success: !result.is_error,
              result: result.is_error ? undefined : result.content,
              error: result.is_error ? result.content : undefined
            });
          }
        }
      });
    }
  }

  const successCount = toolResults.filter(r => r.success).length;
  const successRate = toolResults.length > 0 ? (successCount / toolResults.length) * 100 : 0;

  return {
    customToolsUsed: [...new Set(customToolsUsed)],
    toolResults,
    toolCallCount: toolResults.length,
    successRate
  };
}

// Tester Function
async function testCustomMcpServer(
  testName: string,
  tools: CustomTool[],
  prompts: string[]
): Promise<ExperimentResult & { logs: string; customToolAnalysis: any }> {
  const logger = new ExperimentLogger(`12-sdk-mcp-server - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];
  const serverPort = 3100;

  // Start custom MCP server
  const mcpServer = new CustomMcpServer(testName, tools, serverPort);

  try {
    logger.section('Configuration');
    logger.info('Test', testName);
    logger.info('Custom Tools', tools.map(t => `${t.name}: ${t.description}`));
    logger.info('Prompts', prompts);

    logger.section('Custom MCP Server Setup');
    const serverStarted = await mcpServer.start();
    if (!serverStarted) {
      throw new Error('Failed to start custom MCP server');
    }

    logger.section('Execution');

    const q = setupCustomMcpQuery(prompts[0], serverPort);
    let promptIndex = 0;

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized', {
              sessionId: message.session_id,
              customMcpServer: testName
            });
          } else if (message.subtype === 'mcp_server_connected') {
            logger.success('Custom MCP server connected', message.content);
          }
          break;

        case 'assistant':
          const content = message.message.content;

          // Log tool use attempts (especially custom tools)
          if (Array.isArray(content)) {
            const toolUses = content.filter((c: any) => c.type === 'tool_use');
            toolUses.forEach((tool: any) => {
              const isCustomTool = tools.some(t => t.name === tool.name);
              logger.info(`Tool attempted: ${tool.name}${isCustomTool ? ' (Custom)' : ''}`, tool.input);
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
                logger.warning('Custom tool failed', result.content);
              } else {
                logger.success('Custom tool executed successfully', result.content);
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

    // Analyze custom tool usage
    const customToolNames = tools.map(t => t.name);
    const customToolAnalysis = analyzeCustomToolUsage(messages, customToolNames);

    metrics.complete(true);

    logger.section('Custom Tool Analysis');
    logger.info('Custom Tools Used', customToolAnalysis.customToolsUsed);
    logger.info('Tool Call Statistics', {
      totalCalls: customToolAnalysis.toolCallCount,
      successfulCalls: customToolAnalysis.toolResults.filter(r => r.success).length,
      failedCalls: customToolAnalysis.toolResults.filter(r => !r.success).length,
      successRate: `${customToolAnalysis.successRate.toFixed(1)}%`
    });

    logger.complete(true);

    // Stop custom MCP server
    await mcpServer.stop();

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      customToolAnalysis: {
        ...customToolAnalysis,
        availableTools: customToolNames,
        serverName: testName
      }
    };

  } catch (error) {
    const err = error as Error;
    metrics.recordError(err.message);
    metrics.complete(false);
    logger.error('Experiment failed', err);
    logger.complete(false);

    // Stop custom MCP server on error
    await mcpServer.stop();

    const customToolNames = tools.map(t => t.name);
    const customToolAnalysis = analyzeCustomToolUsage(messages, customToolNames);

    return {
      success: false,
      messages,
      error: err,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      customToolAnalysis
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Custom SDK MCP Server Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: Calculator tools
  console.log('Test 1: Calculator tools');
  const result1 = await testCustomMcpServer(
    'Calculator',
    [customTools[0]], // calculate tool
    [
      'Calculate the result of 15 * 7 + 23',
      'Calculate the square root of 144 with 4 decimal places',
      'Perform multiple calculations: (10 + 5) * 3 and 100 / 4'
    ]
  );

  results.push({
    test: 'Calculator',
    success: result1.success,
    toolsAvailable: 1,
    toolsUsed: result1.customToolAnalysis.customToolsUsed.length,
    successRate: result1.customToolAnalysis.successRate
  });

  output.addTest('Calculator Tools', {
    prompt: 'Test custom calculator MCP tools',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Text transformation tools
  console.log('\nTest 2: Text transformation tools');
  const result2 = await testCustomMcpServer(
    'TextTransform',
    [customTools[1]], // text_transform tool
    [
      'Transform "Hello World" to uppercase',
      'Reverse the text "JavaScript is awesome"',
      'Count words in "The quick brown fox jumps over the lazy dog"',
      'Apply ROT13 encryption to "Secret Message"'
    ]
  );

  results.push({
    test: 'TextTransform',
    success: result2.success,
    toolsAvailable: 1,
    toolsUsed: result2.customToolAnalysis.customToolsUsed.length,
    successRate: result2.customToolAnalysis.successRate
  });

  output.addTest('Text Transformation Tools', {
    prompt: 'Test custom text transformation tools',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Data generation tools
  console.log('\nTest 3: Data generation tools');
  const result3 = await testCustomMcpServer(
    'DataGenerator',
    [customTools[2]], // data_generator tool
    [
      'Generate 3 UUIDs',
      'Create 5 mock user objects',
      'Generate random strings of length 8',
      'Create mock data for testing with 10 items'
    ]
  );

  results.push({
    test: 'DataGenerator',
    success: result3.success,
    toolsAvailable: 1,
    toolsUsed: result3.customToolAnalysis.customToolsUsed.length,
    successRate: result3.customToolAnalysis.successRate
  });

  output.addTest('Data Generation Tools', {
    prompt: 'Test custom data generation tools',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: JSON processing tools
  console.log('\nTest 4: JSON processing tools');
  const result4 = await testCustomMcpServer(
    'JSONProcessor',
    [customTools[3]], // json_processor tool
    [
      'Validate this JSON: {"name": "test", "value": 123}',
      'Prettify this JSON: {"compact":true,"data":[1,2,3]}',
      'Extract keys from {"user": "john", "age": 30, "active": true}',
      'Minify this JSON with proper formatting'
    ]
  );

  results.push({
    test: 'JSONProcessor',
    success: result4.success,
    toolsAvailable: 1,
    toolsUsed: result4.customToolAnalysis.customToolsUsed.length,
    successRate: result4.customToolAnalysis.successRate
  });

  output.addTest('JSON Processing Tools', {
    prompt: 'Test custom JSON processing tools',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Test 5: All custom tools combined
  console.log('\nTest 5: All custom tools combined');
  const result5 = await testCustomMcpServer(
    'AllCustomTools',
    customTools,
    [
      'Use calculator to compute 25 * 4',
      'Transform the result to uppercase text',
      'Generate 2 mock users',
      'Create a JSON object with the calculation result and validate it',
      'Process and prettify the final JSON output'
    ]
  );

  results.push({
    test: 'AllCustomTools',
    success: result5.success,
    toolsAvailable: customTools.length,
    toolsUsed: result5.customToolAnalysis.customToolsUsed.length,
    successRate: result5.customToolAnalysis.successRate
  });

  output.addTest('All Custom Tools Combined', {
    prompt: 'Test all custom tools in integrated workflow',
    messages: result5.messages,
    metrics: result5.metrics,
    logs: result5.logs
  });

  // Comprehensive custom tool analysis
  const allCustomAnalysis = {
    calculator: result1.customToolAnalysis,
    textTransform: result2.customToolAnalysis,
    dataGenerator: result3.customToolAnalysis,
    jsonProcessor: result4.customToolAnalysis,
    allTools: result5.customToolAnalysis
  };

  output.addJSON('Custom MCP Server Analysis', {
    toolDefinitions: customTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    })),
    results: allCustomAnalysis,
    summary: {
      totalTests: results.length,
      totalCustomTools: customTools.length,
      avgToolsUsedPerTest: results.reduce((sum, r) => sum + r.toolsUsed, 0) / results.length,
      avgSuccessRate: results.reduce((sum, r) => sum + r.successRate, 0) / results.length,
      mostUsedTools: result5.customToolAnalysis.customToolsUsed
    }
  });

  // Add final summary
  output.addSummary(results);

  // Console summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 CUSTOM MCP SERVER EXPERIMENT SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.test}: ${r.success ? '✅' : '❌'} (${r.toolsUsed}/${r.toolsAvailable} tools, ${r.successRate.toFixed(1)}% success)`);
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