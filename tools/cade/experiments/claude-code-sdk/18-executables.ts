#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Executables Configuration
 * Tests: Runtime configuration for Node.js, Bun, and Deno executables
 * Expected: Proper configuration and usage of different JavaScript runtimes
 */

// Executable configurations
interface ExecutableConfig {
  name: string;
  path: string;
  type: 'node' | 'bun' | 'deno' | 'custom';
  version?: string;
  args?: string[];
  env?: Record<string, string>;
  description: string;
}

const executableConfigs: ExecutableConfig[] = [
  {
    name: 'node',
    path: '/usr/bin/node',
    type: 'node',
    args: ['--version'],
    description: 'Node.js runtime'
  },
  {
    name: 'bun',
    path: '/usr/local/bin/bun',
    type: 'bun',
    args: ['--version'],
    description: 'Bun runtime'
  },
  {
    name: 'deno',
    path: '/usr/bin/deno',
    type: 'deno',
    args: ['--version'],
    description: 'Deno runtime'
  },
  {
    name: 'node-with-flags',
    path: '/usr/bin/node',
    type: 'node',
    args: ['--experimental-modules', '--no-warnings'],
    env: { NODE_ENV: 'development' },
    description: 'Node.js with experimental features'
  },
  {
    name: 'bun-dev',
    path: '/usr/local/bin/bun',
    type: 'bun',
    args: ['--hot'],
    env: { BUN_ENV: 'development' },
    description: 'Bun with hot reload enabled'
  }
];

// Helper to check executable availability
async function checkExecutableAvailability(config: ExecutableConfig): Promise<{
  available: boolean;
  version?: string;
  actualPath?: string;
  error?: string;
}> {
  try {
    // Try to find the executable in different common locations
    const possiblePaths = [
      config.path,
      `/usr/bin/${config.name}`,
      `/usr/local/bin/${config.name}`,
      `/opt/homebrew/bin/${config.name}`,
      `${process.env.HOME}/.local/bin/${config.name}`
    ];

    for (const path of possiblePaths) {
      try {
        const proc = Bun.spawn([path, '--version'], {
          stdout: 'pipe',
          stderr: 'pipe'
        });

        const exitCode = await proc.exited;
        const stdout = await new Response(proc.stdout).text();

        if (exitCode === 0) {
          return {
            available: true,
            version: stdout.trim(),
            actualPath: path
          };
        }
      } catch (error) {
        // Continue to next path
      }
    }

    // Try using which/where command to find the executable
    try {
      const whichProc = Bun.spawn(['which', config.name], {
        stdout: 'pipe',
        stderr: 'pipe'
      });

      const exitCode = await whichProc.exited;
      if (exitCode === 0) {
        const stdout = await new Response(whichProc.stdout).text();
        const foundPath = stdout.trim();

        const versionProc = Bun.spawn([foundPath, '--version'], {
          stdout: 'pipe',
          stderr: 'pipe'
        });

        const versionExit = await versionProc.exited;
        if (versionExit === 0) {
          const versionOut = await new Response(versionProc.stdout).text();
          return {
            available: true,
            version: versionOut.trim(),
            actualPath: foundPath
          };
        }
      }
    } catch (error) {
      // which command not available or failed
    }

    return {
      available: false,
      error: 'Executable not found in any common location'
    };

  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// SDK Setup Function with executable configuration
function setupExecutableQuery(
  prompt: string,
  configs: ExecutableConfig[],
  options?: Options
): Query {
  const executables = configs.reduce((acc, config) => {
    acc[config.type] = {
      path: config.path,
      args: config.args,
      env: config.env
    };
    return acc;
  }, {} as Record<string, any>);

  return query({
    prompt,
    executables,
    options: options || { maxTurns: 5 }
  });
}

// Helper to analyze executable usage
function analyzeExecutableUsage(messages: SDKMessage[], configs: ExecutableConfig[]): {
  executableCalls: Array<{
    executable: string;
    command: string;
    success: boolean;
    runtime?: string;
  }>;
  runtimeDistribution: Record<string, number>;
  successRate: number;
  totalExecutions: number;
} {
  const executableCalls: Array<{
    executable: string;
    command: string;
    success: boolean;
    runtime?: string;
  }> = [];

  const runtimeDistribution: Record<string, number> = {};

  for (const message of messages) {
    if (message.type === 'assistant' && Array.isArray(message.message.content)) {
      // Find executable usage in tool calls
      const toolUses = message.message.content.filter((c: any) => c.type === 'tool_use');

      toolUses.forEach((tool: any) => {
        if (tool.name === 'Bash' && tool.input.command) {
          const command = tool.input.command;

          // Check if command uses any of our configured runtimes
          configs.forEach(config => {
            if (command.includes(config.name) || command.includes(config.path)) {
              executableCalls.push({
                executable: config.name,
                command,
                success: false, // Will be updated when we see the result
                runtime: config.type
              });

              runtimeDistribution[config.type] = (runtimeDistribution[config.type] || 0) + 1;
            }
          });
        }
      });
    }

    if (message.type === 'user' && Array.isArray(message.message.content)) {
      // Update success status based on tool results
      const toolResults = message.message.content.filter((c: any) => c.type === 'tool_result');

      toolResults.forEach((result: any, index: number) => {
        if (index < executableCalls.length) {
          executableCalls[executableCalls.length - 1 - index].success = !result.is_error;
        }
      });
    }
  }

  const successfulCalls = executableCalls.filter(call => call.success).length;
  const successRate = executableCalls.length > 0 ? (successfulCalls / executableCalls.length) * 100 : 0;

  return {
    executableCalls,
    runtimeDistribution,
    successRate,
    totalExecutions: executableCalls.length
  };
}

// Tester Function
async function testExecutables(
  testName: string,
  configs: ExecutableConfig[],
  prompts: string[]
): Promise<ExperimentResult & { logs: string; executableAnalysis: any }> {
  const logger = new ExperimentLogger(`18-executables - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];

  try {
    logger.section('Configuration');
    logger.info('Test', testName);
    logger.info('Executable Configs', configs.map(c => `${c.name}: ${c.description}`));
    logger.info('Test Prompts', prompts);

    logger.section('Executable Availability Check');
    const availabilityResults = await Promise.all(
      configs.map(async config => {
        const availability = await checkExecutableAvailability(config);
        logger.info(`${config.name}`, {
          available: availability.available,
          version: availability.version,
          path: availability.actualPath,
          error: availability.error
        });
        return { config: config.name, ...availability };
      })
    );

    const availableConfigs = configs.filter(config =>
      availabilityResults.find(r => r.config === config.name)?.available
    );

    logger.info('Available Executables', availableConfigs.map(c => c.name));

    logger.section('Execution with Configured Executables');

    const q = setupExecutableQuery(prompts[0], configs);
    let promptIndex = 0;

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized with executable configs', {
              sessionId: message.session_id,
              executables: configs.length
            });
          }
          break;

        case 'assistant':
          const content = message.message.content;

          // Log executable usage attempts
          if (Array.isArray(content)) {
            const toolUses = content.filter((c: any) => c.type === 'tool_use');
            toolUses.forEach((tool: any) => {
              if (tool.name === 'Bash' && tool.input.command) {
                const command = tool.input.command;

                // Check if command uses configured executables
                const usedExecutable = configs.find(config =>
                  command.includes(config.name) || command.includes(config.path)
                );

                if (usedExecutable) {
                  logger.info(`Using configured executable: ${usedExecutable.name}`, {
                    command,
                    type: usedExecutable.type,
                    args: usedExecutable.args
                  });
                } else if (command.includes('node') || command.includes('bun') || command.includes('deno')) {
                  logger.warning('Using unconfigured runtime', { command });
                }
              }
            });
          }

          logger.message('assistant', content);
          break;

        case 'user':
          const userContent = message.message.content;

          // Log execution results
          if (Array.isArray(userContent)) {
            const toolResults = userContent.filter((c: any) => c.type === 'tool_result');
            toolResults.forEach((result: any) => {
              if (result.is_error) {
                logger.warning('Executable command failed', result.content);
              } else {
                logger.success('Executable command succeeded');
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

    // Analyze executable usage
    const executableAnalysis = analyzeExecutableUsage(messages, configs);

    metrics.complete(true);

    logger.section('Executable Usage Analysis');
    logger.info('Total Executable Calls', executableAnalysis.totalExecutions);
    logger.info('Success Rate', `${executableAnalysis.successRate.toFixed(1)}%`);
    logger.info('Runtime Distribution', executableAnalysis.runtimeDistribution);

    // Executable effectiveness analysis
    const executableEffectiveness = configs.map(config => {
      const calls = executableAnalysis.executableCalls.filter(call => call.executable === config.name);
      const successful = calls.filter(call => call.success);

      return {
        name: config.name,
        type: config.type,
        totalCalls: calls.length,
        successfulCalls: successful.length,
        effectiveness: calls.length > 0 ? (successful.length / calls.length) * 100 : 0,
        available: availabilityResults.find(r => r.config === config.name)?.available || false
      };
    });

    logger.info('Executable Effectiveness', executableEffectiveness);

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      executableAnalysis: {
        ...executableAnalysis,
        availabilityResults,
        executableEffectiveness,
        configuredExecutables: configs.length,
        availableExecutables: availableConfigs.length
      }
    };

  } catch (error) {
    const err = error as Error;
    metrics.recordError(err.message);
    metrics.complete(false);
    logger.error('Experiment failed', err);
    logger.complete(false);

    const executableAnalysis = analyzeExecutableUsage(messages, configs);

    return {
      success: false,
      messages,
      error: err,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      executableAnalysis: {
        ...executableAnalysis,
        availabilityResults: [],
        executableEffectiveness: [],
        configuredExecutables: configs.length,
        availableExecutables: 0
      }
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Executables Configuration Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: Node.js configuration
  console.log('Test 1: Node.js configuration');
  const result1 = await testExecutables(
    'Node.js Config',
    [executableConfigs[0], executableConfigs[3]], // node and node-with-flags
    [
      'Check Node.js version using the configured executable',
      'Run a simple Node.js script to test functionality',
      'Test Node.js with experimental features'
    ]
  );

  results.push({
    test: 'Node.js Config',
    success: result1.success,
    executables: 2,
    totalCalls: result1.executableAnalysis.totalExecutions,
    successRate: result1.executableAnalysis.successRate,
    available: result1.executableAnalysis.availableExecutables
  });

  output.addTest('Node.js Configuration', {
    prompt: 'Test Node.js executable configuration',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Bun configuration
  console.log('\nTest 2: Bun configuration');
  const result2 = await testExecutables(
    'Bun Config',
    [executableConfigs[1], executableConfigs[4]], // bun and bun-dev
    [
      'Check Bun version and capabilities',
      'Run TypeScript code directly with Bun',
      'Test Bun development features'
    ]
  );

  results.push({
    test: 'Bun Config',
    success: result2.success,
    executables: 2,
    totalCalls: result2.executableAnalysis.totalExecutions,
    successRate: result2.executableAnalysis.successRate,
    available: result2.executableAnalysis.availableExecutables
  });

  output.addTest('Bun Configuration', {
    prompt: 'Test Bun executable configuration',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Deno configuration
  console.log('\nTest 3: Deno configuration');
  const result3 = await testExecutables(
    'Deno Config',
    [executableConfigs[2]], // deno
    [
      'Check Deno version and features',
      'Run a TypeScript script with Deno',
      'Test Deno security features'
    ]
  );

  results.push({
    test: 'Deno Config',
    success: result3.success,
    executables: 1,
    totalCalls: result3.executableAnalysis.totalExecutions,
    successRate: result3.executableAnalysis.successRate,
    available: result3.executableAnalysis.availableExecutables
  });

  output.addTest('Deno Configuration', {
    prompt: 'Test Deno executable configuration',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Multiple runtime comparison
  console.log('\nTest 4: Multiple runtime comparison');
  const result4 = await testExecutables(
    'Runtime Comparison',
    [executableConfigs[0], executableConfigs[1], executableConfigs[2]], // node, bun, deno
    [
      'Compare performance of the same script across different runtimes',
      'Test compatibility features across Node.js, Bun, and Deno',
      'Demonstrate runtime-specific capabilities'
    ]
  );

  results.push({
    test: 'Runtime Comparison',
    success: result4.success,
    executables: 3,
    totalCalls: result4.executableAnalysis.totalExecutions,
    successRate: result4.executableAnalysis.successRate,
    available: result4.executableAnalysis.availableExecutables
  });

  output.addTest('Multiple Runtime Comparison', {
    prompt: 'Test and compare multiple JavaScript runtimes',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Test 5: All executables with advanced features
  console.log('\nTest 5: All executables with advanced features');
  const result5 = await testExecutables(
    'Advanced Features',
    executableConfigs,
    [
      'Test all configured JavaScript runtimes',
      'Use advanced features and flags for each runtime',
      'Demonstrate comprehensive executable configuration'
    ]
  );

  results.push({
    test: 'Advanced Features',
    success: result5.success,
    executables: executableConfigs.length,
    totalCalls: result5.executableAnalysis.totalExecutions,
    successRate: result5.executableAnalysis.successRate,
    available: result5.executableAnalysis.availableExecutables
  });

  output.addTest('Advanced Executable Features', {
    prompt: 'Test advanced features across all configured executables',
    messages: result5.messages,
    metrics: result5.metrics,
    logs: result5.logs
  });

  // Comprehensive executable analysis
  const allExecutableAnalysis = {
    nodeConfig: result1.executableAnalysis,
    bunConfig: result2.executableAnalysis,
    denoConfig: result3.executableAnalysis,
    runtimeComparison: result4.executableAnalysis,
    advancedFeatures: result5.executableAnalysis
  };

  // Aggregate runtime statistics
  const runtimeStats = executableConfigs.reduce((acc, config) => {
    const allCalls = Object.values(allExecutableAnalysis).flatMap(analysis =>
      analysis.executableCalls?.filter((call: any) => call.executable === config.name) || []
    );

    const successfulCalls = allCalls.filter((call: any) => call.success);
    const availabilityData = Object.values(allExecutableAnalysis).find(analysis =>
      analysis.availabilityResults?.some((r: any) => r.config === config.name)
    );

    const availability = availabilityData?.availabilityResults?.find((r: any) => r.config === config.name);

    acc[config.type] = acc[config.type] || {
      totalCalls: 0,
      successfulCalls: 0,
      configs: 0,
      available: 0
    };

    acc[config.type].totalCalls += allCalls.length;
    acc[config.type].successfulCalls += successfulCalls.length;
    acc[config.type].configs += 1;
    if (availability?.available) acc[config.type].available += 1;

    return acc;
  }, {} as Record<string, any>);

  output.addJSON('Executables Configuration Analysis', {
    configurations: executableConfigs.map(config => ({
      name: config.name,
      type: config.type,
      path: config.path,
      args: config.args,
      env: config.env,
      description: config.description
    })),
    results: allExecutableAnalysis,
    runtimeStats,
    summary: {
      totalTests: results.length,
      totalExecutables: executableConfigs.length,
      avgSuccessRate: results.reduce((sum, r) => sum + r.successRate, 0) / results.length,
      totalExecutableCalls: results.reduce((sum, r) => sum + r.totalCalls, 0),
      avgAvailableExecutables: results.reduce((sum, r) => sum + r.available, 0) / results.length,
      runtimeTypes: [...new Set(executableConfigs.map(c => c.type))]
    }
  });

  // Add final summary
  output.addSummary(results);

  // Console summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 EXECUTABLES CONFIGURATION EXPERIMENT SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.test}: ${r.success ? '✅' : '❌'} (${r.available}/${r.executables} available, ${r.totalCalls} calls, ${r.successRate.toFixed(1)}% success)`);
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