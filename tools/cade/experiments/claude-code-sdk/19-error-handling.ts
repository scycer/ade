#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Error Handling
 * Tests: Error scenarios, recovery mechanisms, and graceful degradation
 * Expected: Robust error handling and recovery strategies
 */

// Error scenario definitions
interface ErrorScenario {
  name: string;
  type: 'network' | 'permission' | 'resource' | 'validation' | 'timeout' | 'rate_limit';
  description: string;
  triggerPrompt: string;
  expectedError: string;
  recoveryStrategy: string;
}

const errorScenarios: ErrorScenario[] = [
  {
    name: 'File Not Found',
    type: 'resource',
    description: 'Attempt to read a non-existent file',
    triggerPrompt: 'Read the file /non/existent/file.txt',
    expectedError: 'file not found',
    recoveryStrategy: 'Suggest alternative files or create the file'
  },
  {
    name: 'Permission Denied',
    type: 'permission',
    description: 'Attempt to write to a protected location',
    triggerPrompt: 'Create a file in /root/protected.txt',
    expectedError: 'permission denied',
    recoveryStrategy: 'Suggest alternative location with proper permissions'
  },
  {
    name: 'Invalid Command',
    type: 'validation',
    description: 'Execute an invalid bash command',
    triggerPrompt: 'Run the command "invalid-command-that-does-not-exist"',
    expectedError: 'command not found',
    recoveryStrategy: 'Suggest correct command or installation instructions'
  },
  {
    name: 'Network Timeout',
    type: 'network',
    description: 'Attempt to access unreachable network resource',
    triggerPrompt: 'Fetch content from http://unreachable-server-12345.com',
    expectedError: 'network timeout',
    recoveryStrategy: 'Retry with backoff or suggest alternative sources'
  },
  {
    name: 'Large File Processing',
    type: 'resource',
    description: 'Attempt to process an extremely large file',
    triggerPrompt: 'Process a file larger than available memory',
    expectedError: 'memory limit',
    recoveryStrategy: 'Process file in chunks or suggest streaming approach'
  },
  {
    name: 'Rate Limit Exceeded',
    type: 'rate_limit',
    description: 'Trigger API rate limiting',
    triggerPrompt: 'Make rapid successive API calls',
    expectedError: 'rate limit exceeded',
    recoveryStrategy: 'Implement exponential backoff and retry logic'
  },
  {
    name: 'Invalid JSON',
    type: 'validation',
    description: 'Parse malformed JSON data',
    triggerPrompt: 'Parse the JSON: {"invalid": json, syntax}',
    expectedError: 'JSON parse error',
    recoveryStrategy: 'Suggest JSON validation tools or fix the syntax'
  },
  {
    name: 'Disk Space Full',
    type: 'resource',
    description: 'Attempt to write when disk is full',
    triggerPrompt: 'Write a large file when disk space is insufficient',
    expectedError: 'no space left',
    recoveryStrategy: 'Clean up temporary files or suggest smaller file'
  }
];

// Error tracking and analysis
interface ErrorEvent {
  scenario: string;
  timestamp: string;
  errorType: string;
  errorMessage: string;
  recovered: boolean;
  recoveryTime?: number;
  recoveryMethod?: string;
}

class ErrorTracker {
  private errors: ErrorEvent[] = [];
  private recoveryAttempts: Map<string, number> = new Map();

  recordError(scenario: string, errorType: string, errorMessage: string) {
    const errorEvent: ErrorEvent = {
      scenario,
      timestamp: new Date().toISOString(),
      errorType,
      errorMessage,
      recovered: false
    };

    this.errors.push(errorEvent);
    console.log(`❌ ERROR [${scenario}]: ${errorMessage}`);

    return errorEvent;
  }

  recordRecovery(scenario: string, method: string, recoveryTime: number) {
    const latestError = this.errors
      .filter(e => e.scenario === scenario)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (latestError) {
      latestError.recovered = true;
      latestError.recoveryTime = recoveryTime;
      latestError.recoveryMethod = method;
    }

    const attempts = this.recoveryAttempts.get(scenario) || 0;
    this.recoveryAttempts.set(scenario, attempts + 1);

    console.log(`✅ RECOVERY [${scenario}]: ${method} (${recoveryTime}ms)`);
  }

  getErrorStats() {
    const errorsByType = this.errors.reduce((acc, error) => {
      acc[error.errorType] = (acc[error.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recoveredErrors = this.errors.filter(e => e.recovered);
    const recoveryRate = this.errors.length > 0 ? (recoveredErrors.length / this.errors.length) * 100 : 0;

    const avgRecoveryTime = recoveredErrors.length > 0
      ? recoveredErrors.reduce((sum, e) => sum + (e.recoveryTime || 0), 0) / recoveredErrors.length
      : 0;

    return {
      totalErrors: this.errors.length,
      errorsByType,
      recoveredErrors: recoveredErrors.length,
      recoveryRate,
      avgRecoveryTime,
      recoveryAttempts: Object.fromEntries(this.recoveryAttempts)
    };
  }

  getErrors(): ErrorEvent[] {
    return [...this.errors];
  }

  clear() {
    this.errors = [];
    this.recoveryAttempts.clear();
  }
}

// Error injection and simulation
class ErrorSimulator {
  static async simulateNetworkError(): Promise<void> {
    // Simulate network timeout by making request to non-existent host
    try {
      await fetch('http://definitely-does-not-exist-12345.com', {
        signal: AbortSignal.timeout(1000)
      });
    } catch (error) {
      throw new Error('Network timeout: Connection failed');
    }
  }

  static async simulateFileSystemError(): Promise<void> {
    // Simulate file system error
    try {
      await Bun.file('/definitely/does/not/exist.txt').text();
    } catch (error) {
      throw new Error('File system error: No such file or directory');
    }
  }

  static async simulateMemoryError(): Promise<void> {
    // Simulate memory constraint error
    throw new Error('Memory error: Insufficient memory to complete operation');
  }

  static async simulatePermissionError(): Promise<void> {
    // Simulate permission error
    throw new Error('Permission error: Access denied to protected resource');
  }
}

// SDK Setup Function with error handling
function setupErrorHandlingQuery(
  prompt: string,
  errorTracker: ErrorTracker,
  options?: Options
): Query {
  const enhancedOptions = {
    ...options,
    maxTurns: 8, // Allow more turns for error recovery
    onError: (error: Error, context: any) => {
      errorTracker.recordError(
        context.scenario || 'unknown',
        'sdk_error',
        error.message
      );
      return error;
    }
  };

  return query({
    prompt,
    options: enhancedOptions
  });
}

// Tester Function
async function testErrorHandling(
  scenario: ErrorScenario,
  enableRecovery: boolean = true
): Promise<ExperimentResult & { logs: string; errorAnalysis: any }> {
  const logger = new ExperimentLogger(`19-error-handling - ${scenario.name}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];
  const errorTracker = new ErrorTracker();

  try {
    logger.section('Configuration');
    logger.info('Scenario', scenario.name);
    logger.info('Error Type', scenario.type);
    logger.info('Description', scenario.description);
    logger.info('Expected Error', scenario.expectedError);
    logger.info('Recovery Strategy', scenario.recoveryStrategy);
    logger.info('Recovery Enabled', enableRecovery);

    logger.section('Error Scenario Execution');

    const q = setupErrorHandlingQuery(scenario.triggerPrompt, errorTracker);
    let recoveryAttempted = false;
    const startTime = Date.now();

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized for error handling', {
              sessionId: message.session_id,
              scenario: scenario.name
            });
          } else if (message.subtype === 'error') {
            const errorMessage = message.content || 'Unknown error';
            errorTracker.recordError(scenario.name, scenario.type, errorMessage);
            logger.error('System error detected', errorMessage);

            // Attempt recovery if enabled
            if (enableRecovery && !recoveryAttempted) {
              recoveryAttempted = true;
              const recoveryTime = Date.now() - startTime;

              logger.info('Attempting error recovery', scenario.recoveryStrategy);

              // Simulate recovery attempt
              try {
                q.input(`Error occurred: ${errorMessage}. Please ${scenario.recoveryStrategy}`);
                errorTracker.recordRecovery(scenario.name, scenario.recoveryStrategy, recoveryTime);
              } catch (recoveryError) {
                logger.warning('Recovery attempt failed', recoveryError);
              }
            }
          }
          break;

        case 'assistant':
          const content = message.message.content;

          // Analyze assistant response for error handling
          const responseText = Array.isArray(content)
            ? content.map((c: any) => c.text || '').join(' ')
            : content || '';

          // Check for error acknowledgment and recovery suggestions
          if (responseText.toLowerCase().includes('error') ||
              responseText.toLowerCase().includes('failed') ||
              responseText.toLowerCase().includes('cannot')) {

            logger.info('Assistant acknowledged error', { responseLength: responseText.length });

            // Check for recovery suggestions
            if (responseText.toLowerCase().includes('try') ||
                responseText.toLowerCase().includes('instead') ||
                responseText.toLowerCase().includes('alternative')) {
              logger.success('Assistant provided recovery suggestions');
            }
          }

          logger.message('assistant', content);
          break;

        case 'user':
          const userContent = message.message.content;

          // Analyze tool results for errors
          if (Array.isArray(userContent)) {
            const toolResults = userContent.filter((c: any) => c.type === 'tool_result');
            toolResults.forEach((result: any) => {
              if (result.is_error) {
                const errorMessage = result.content || 'Tool execution failed';
                errorTracker.recordError(scenario.name, 'tool_error', errorMessage);
                logger.warning('Tool error detected', errorMessage);

                // Check if error matches expected pattern
                if (errorMessage.toLowerCase().includes(scenario.expectedError.toLowerCase())) {
                  logger.success('Expected error pattern detected');
                } else {
                  logger.info('Unexpected error pattern', {
                    expected: scenario.expectedError,
                    actual: errorMessage
                  });
                }
              } else {
                logger.success('Tool execution successful (possible recovery)');
              }
            });
          }

          logger.message('user', userContent);
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

    // Analyze error handling effectiveness
    const errorStats = errorTracker.getErrorStats();
    const errorEvents = errorTracker.getErrors();

    metrics.complete(true);

    logger.section('Error Handling Analysis');
    logger.info('Error Statistics', errorStats);
    logger.info('Error Events', errorEvents.length);
    logger.info('Recovery Success', `${errorStats.recoveryRate.toFixed(1)}%`);

    if (errorStats.avgRecoveryTime > 0) {
      logger.info('Average Recovery Time', `${errorStats.avgRecoveryTime.toFixed(0)}ms`);
    }

    // Validate scenario expectations
    const hasExpectedError = errorEvents.some(e =>
      e.errorMessage.toLowerCase().includes(scenario.expectedError.toLowerCase())
    );

    logger.info('Scenario Validation', {
      expectedErrorDetected: hasExpectedError,
      recoveryAttempted: errorStats.recoveredErrors > 0,
      scenarioType: scenario.type
    });

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      errorAnalysis: {
        scenario,
        errorStats,
        errorEvents,
        expectedErrorDetected: hasExpectedError,
        recoveryEnabled: enableRecovery
      }
    };

  } catch (error) {
    const err = error as Error;
    metrics.recordError(err.message);
    metrics.complete(false);
    logger.error('Experiment failed', err);
    logger.complete(false);

    errorTracker.recordError(scenario.name, 'experiment_error', err.message);
    const errorStats = errorTracker.getErrorStats();
    const errorEvents = errorTracker.getErrors();

    return {
      success: false,
      messages,
      error: err,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      errorAnalysis: {
        scenario,
        errorStats,
        errorEvents,
        expectedErrorDetected: false,
        recoveryEnabled: enableRecovery
      }
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Error Handling Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: File system errors
  console.log('Test 1: File system errors');
  const result1 = await testErrorHandling(errorScenarios[0], true);

  results.push({
    test: errorScenarios[0].name,
    type: errorScenarios[0].type,
    success: result1.success,
    errorCount: result1.errorAnalysis.errorStats.totalErrors,
    recoveryRate: result1.errorAnalysis.errorStats.recoveryRate,
    expectedDetected: result1.errorAnalysis.expectedErrorDetected
  });

  output.addTest('File System Error Handling', {
    prompt: 'Test file system error scenarios',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Permission errors
  console.log('\nTest 2: Permission errors');
  const result2 = await testErrorHandling(errorScenarios[1], true);

  results.push({
    test: errorScenarios[1].name,
    type: errorScenarios[1].type,
    success: result2.success,
    errorCount: result2.errorAnalysis.errorStats.totalErrors,
    recoveryRate: result2.errorAnalysis.errorStats.recoveryRate,
    expectedDetected: result2.errorAnalysis.expectedErrorDetected
  });

  output.addTest('Permission Error Handling', {
    prompt: 'Test permission error scenarios',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Validation errors
  console.log('\nTest 3: Validation errors');
  const result3 = await testErrorHandling(errorScenarios[2], true);

  results.push({
    test: errorScenarios[2].name,
    type: errorScenarios[2].type,
    success: result3.success,
    errorCount: result3.errorAnalysis.errorStats.totalErrors,
    recoveryRate: result3.errorAnalysis.errorStats.recoveryRate,
    expectedDetected: result3.errorAnalysis.expectedErrorDetected
  });

  output.addTest('Validation Error Handling', {
    prompt: 'Test validation error scenarios',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Network errors
  console.log('\nTest 4: Network errors');
  const result4 = await testErrorHandling(errorScenarios[3], true);

  results.push({
    test: errorScenarios[3].name,
    type: errorScenarios[3].type,
    success: result4.success,
    errorCount: result4.errorAnalysis.errorStats.totalErrors,
    recoveryRate: result4.errorAnalysis.errorStats.recoveryRate,
    expectedDetected: result4.errorAnalysis.expectedErrorDetected
  });

  output.addTest('Network Error Handling', {
    prompt: 'Test network error scenarios',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Test 5: Error handling without recovery
  console.log('\nTest 5: Error handling without recovery');
  const result5 = await testErrorHandling(errorScenarios[4], false);

  results.push({
    test: errorScenarios[4].name + ' (No Recovery)',
    type: errorScenarios[4].type,
    success: result5.success,
    errorCount: result5.errorAnalysis.errorStats.totalErrors,
    recoveryRate: result5.errorAnalysis.errorStats.recoveryRate,
    expectedDetected: result5.errorAnalysis.expectedErrorDetected
  });

  output.addTest('Error Handling Without Recovery', {
    prompt: 'Test error scenarios without recovery mechanisms',
    messages: result5.messages,
    metrics: result5.metrics,
    logs: result5.logs
  });

  // Comprehensive error handling analysis
  const allErrorAnalysis = {
    fileSystemErrors: result1.errorAnalysis,
    permissionErrors: result2.errorAnalysis,
    validationErrors: result3.errorAnalysis,
    networkErrors: result4.errorAnalysis,
    noRecovery: result5.errorAnalysis
  };

  // Aggregate error statistics
  const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
  const avgRecoveryRate = results.reduce((sum, r) => sum + r.recoveryRate, 0) / results.length;
  const expectedDetectionRate = results.filter(r => r.expectedDetected).length / results.length * 100;

  const errorTypeDistribution = results.reduce((acc, result) => {
    acc[result.type] = (acc[result.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  output.addJSON('Error Handling Analysis', {
    scenarios: errorScenarios.map(scenario => ({
      name: scenario.name,
      type: scenario.type,
      description: scenario.description,
      expectedError: scenario.expectedError,
      recoveryStrategy: scenario.recoveryStrategy
    })),
    results: allErrorAnalysis,
    aggregateStats: {
      totalTests: results.length,
      totalErrors,
      avgRecoveryRate,
      expectedDetectionRate,
      errorTypeDistribution
    },
    summary: {
      mostCommonErrorType: Object.entries(errorTypeDistribution)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none',
      bestRecoveryScenario: results.sort((a, b) => b.recoveryRate - a.recoveryRate)[0]?.test || 'none',
      errorHandlingEffectiveness: avgRecoveryRate > 50 ? 'Good' : 'Needs Improvement'
    }
  });

  // Add final summary
  output.addSummary(results);

  // Console summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 ERROR HANDLING EXPERIMENT SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.test}: ${r.success ? '✅' : '❌'} (${r.errorCount} errors, ${r.recoveryRate.toFixed(1)}% recovery, ${r.expectedDetected ? '✓' : '✗'} expected)`);
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