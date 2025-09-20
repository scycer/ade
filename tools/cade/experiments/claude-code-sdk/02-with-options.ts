#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';
import { join } from 'path';

/**
 * Experiment: With Options
 * Tests: Various configuration options (model, cwd, maxTurns, env)
 * Expected: Different behaviors based on configuration
 */

// SDK Setup Function - Creates queries with different options
function setupQueryWithOptions(prompt: string, options: Options): Query {
  return query({ prompt, options });
}

// Tester Function - Runs the SDK and collects detailed metrics
async function testWithOptions(
  prompt: string,
  options: Options,
  testName: string
): Promise<ExperimentResult & { logs: string }> {
  const logger = new ExperimentLogger(`02-with-options - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];

  try {
    logger.section('Configuration');
    logger.info('Prompt', prompt);
    logger.info('Options', options);

    logger.section('Execution');
    const q = setupQueryWithOptions(prompt, options);

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized', {
              sessionId: message.session_id,
              model: message.model,
              tools: message.tools.length,
              cwd: message.cwd,
              env: message.env ? Object.keys(message.env).length + ' env vars' : 'none'
            });
          }
          break;

        case 'assistant':
          logger.message('assistant', message.message.content);
          break;

        case 'user':
          logger.message('user', message.message.content);
          break;

        case 'result':
          metrics.recordTokens(message.usage);
          metrics.recordCost(message.total_cost_usd);

          if (message.subtype === 'success') {
            logger.success('Query completed successfully', {
              turns: message.num_turns,
              duration: `${message.duration_ms}ms`,
              cost: `$${message.total_cost_usd.toFixed(6)}`
            });
          } else {
            logger.warning(`Query ended with: ${message.subtype}`);
          }
          break;

        default:
          logger.warning(`Unexpected message type: ${message.type}`);
      }
    }

    metrics.complete(true);
    logger.section('Metrics Summary');
    logger.info('Summary\n' + metrics.getSummary());
    logger.complete(true, {
      totalMessages: messages.length,
      messageTypes: Object.keys(metrics.getMetrics().messageTypes)
    });

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString()
    };

  } catch (error) {
    const err = error as Error;
    metrics.recordError(err.message);
    metrics.complete(false);
    logger.error('Experiment failed', err);
    logger.complete(false);

    return {
      success: false,
      messages,
      error: err,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString()
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting With Options Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: Different model (claude-3-5-haiku-20241022)
  console.log('Test 1: Using Haiku model for speed');
  const prompt1 = 'What is 100 / 4? Just the number.';
  const result1 = await testWithOptions(prompt1, {
    model: 'claude-3-5-haiku-20241022',
    maxTurns: 1
  }, 'Haiku Model');

  results.push({
    test: 'Haiku Model',
    success: result1.success,
    details: {
      model: result1.messages.find(m => m.type === 'system')?.model,
      cost: result1.metrics?.cost
    }
  });

  output.addTest('Haiku Model Test', {
    prompt: prompt1,
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Custom working directory
  console.log('\nTest 2: Custom working directory');
  const prompt2 = 'List files in the current directory';
  const customCwd = join(process.cwd(), '..');
  const result2 = await testWithOptions(prompt2, {
    cwd: customCwd,
    maxTurns: 2
  }, 'Custom CWD');

  results.push({
    test: 'Custom CWD',
    success: result2.success,
    details: {
      cwd: result2.messages.find(m => m.type === 'system')?.cwd,
      messages: result2.messages.length
    }
  });

  output.addTest('Custom Working Directory', {
    prompt: prompt2,
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Environment variables
  console.log('\nTest 3: Custom environment variables');
  const prompt3 = 'Echo the TEST_VAR environment variable';
  const result3 = await testWithOptions(prompt3, {
    env: {
      TEST_VAR: 'Hello from experiment!',
      CUSTOM_ENV: 'test-value'
    },
    maxTurns: 2
  }, 'Custom Env');

  results.push({
    test: 'Custom Environment',
    success: result3.success,
    details: {
      envVarsSet: 2,
      messages: result3.messages.length
    }
  });

  output.addTest('Custom Environment Variables', {
    prompt: prompt3,
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Max turns limit
  console.log('\nTest 4: Max turns limit');
  const prompt4 = 'Count from 1 to 10, one number at a time';
  const result4 = await testWithOptions(prompt4, {
    maxTurns: 3  // Will limit the counting
  }, 'Max Turns');

  results.push({
    test: 'Max Turns Limit',
    success: result4.success,
    details: {
      turns: result4.messages.find(m => m.type === 'result')?.num_turns,
      maxTurnsReached: result4.messages.find(m => m.type === 'result')?.subtype === 'error_max_turns'
    }
  });

  output.addTest('Max Turns Limit', {
    prompt: prompt4,
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Test 5: Fallback model
  console.log('\nTest 5: Fallback model configuration');
  const prompt5 = 'What is 2 + 2?';
  const result5 = await testWithOptions(prompt5, {
    model: 'claude-opus-4-1-20250805',  // Primary model
    fallbackModels: ['claude-3-5-sonnet-20241022'],  // Fallback if primary fails
    maxTurns: 1
  }, 'Fallback Model');

  results.push({
    test: 'Fallback Model',
    success: result5.success,
    details: {
      model: result5.messages.find(m => m.type === 'system')?.model,
      messages: result5.messages.length
    }
  });

  output.addTest('Fallback Model Configuration', {
    prompt: prompt5,
    messages: result5.messages,
    metrics: result5.metrics,
    logs: result5.logs
  });

  // Add final summary
  output.addSummary(results);

  // Console summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 EXPERIMENT SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.test}: ${r.success ? '✅' : '❌'}`);
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