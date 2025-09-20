#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Basic One-Shot Query
 * Tests: Simple string prompt with minimal configuration
 * Expected: System init message, assistant response, result message
 */

// SDK Setup Function - Creates a basic query with optional configuration
function setupBasicQuery(prompt: string, options?: Options): Query {
  return query({
    prompt,
    options: options || {
      // Minimal options - let SDK use defaults
      maxTurns: 1  // One-shot query
    }
  });
}

// Tester Function - Runs the SDK and collects detailed metrics
async function testBasicQuery(prompt: string, testName: string): Promise<ExperimentResult & { logs: string }> {
  const logger = new ExperimentLogger(`01-basic-query - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];

  try {
    logger.section('Configuration');
    logger.info('Prompt', prompt);
    logger.info('Options', { maxTurns: 1 });

    logger.section('Execution');
    const q = setupBasicQuery(prompt);

    // Process all messages from the query
    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      // Log different message types
      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized', {
              sessionId: message.session_id,
              model: message.model,
              tools: message.tools.length,
              cwd: message.cwd
            });
          }
          break;

        case 'assistant':
          logger.message('assistant', message.message.content);
          // Count tools used if any
          if (Array.isArray(message.message.content)) {
            const toolUses = message.message.content.filter((c: any) => c.type === 'tool_use');
            if (toolUses.length > 0) {
              logger.info(`Tools used: ${toolUses.length}`);
            }
          }
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
              tokens: message.usage,
              cost: `$${message.total_cost_usd.toFixed(6)}`
            });
          } else {
            logger.error(`Query ended with: ${message.subtype}`);
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
  console.log('\n🚀 Starting Basic Query Experiment\n');

  // Create output writer for this experiment
  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);

  const results = [];

  // Test 1: Simple calculation
  console.log('Test 1: Simple calculation');
  const prompt1 = 'What is 42 + 58? Just give me the number.';
  const result1 = await testBasicQuery(prompt1, 'Calculation');
  results.push({
    test: 'Simple Calculation',
    success: result1.success,
    details: {
      messages: result1.messages.length,
      cost: result1.metrics?.cost
    }
  });

  // Capture output for Test 1
  output.addTest('Simple Calculation', {
    prompt: prompt1,
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Code generation
  console.log('\nTest 2: Code generation');
  const prompt2 = 'Write a TypeScript function that reverses a string. Just the code, no explanation.';
  const result2 = await testBasicQuery(prompt2, 'Code Gen');
  results.push({
    test: 'Code Generation',
    success: result2.success,
    details: {
      messages: result2.messages.length,
      cost: result2.metrics?.cost
    }
  });

  // Capture output for Test 2
  output.addTest('Code Generation', {
    prompt: prompt2,
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Tool usage
  console.log('\nTest 3: Tool usage (file reading)');
  const prompt3 = 'What files are in the current directory? List just the names.';
  const result3 = await testBasicQuery(prompt3, 'Tool Usage');
  results.push({
    test: 'Tool Usage',
    success: result3.success,
    details: {
      messages: result3.messages.length,
      cost: result3.metrics?.cost,
      toolsUsed: result3.messages.filter(m => m.type === 'assistant' &&
        Array.isArray(m.message.content) &&
        m.message.content.some((c: any) => c.type === 'tool_use')).length > 0
    }
  });

  // Capture output for Test 3
  output.addTest('Tool Usage', {
    prompt: prompt3,
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Add final summary
  output.addSummary(results);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 EXPERIMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Test 1 (Calculation): ${result1.success ? '✅' : '❌'}`);
  console.log(`Test 2 (Code Gen): ${result2.success ? '✅' : '❌'}`);
  console.log(`Test 3 (Tool Use): ${result3.success ? '✅' : '❌'}`);
  console.log('='.repeat(60));

  // Save output to file
  const outputPath = output.save();
  console.log(`\n💾 Output saved to: ${outputPath}`);
}

// Run if executed directly
if (import.meta.main) {
  main().catch(console.error);
}