#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Partial Messages
 * Tests: Stream partial assistant responses with includePartialMessages
 * Expected: Receive incremental text updates as assistant generates response
 */

// SDK Setup Function
function setupPartialMessagesQuery(prompt: string, options?: Options): Query {
  return query({
    prompt,
    options: {
      ...options,
      includePartialMessages: true  // Enable partial message streaming
    }
  });
}

// Tester Function
async function testPartialMessages(
  prompt: string,
  testName: string
): Promise<ExperimentResult & { logs: string; partialDetails: any }> {
  const logger = new ExperimentLogger(`04-partial-messages - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];
  const partialDetails = {
    partialCount: 0,
    finalCount: 0,
    textProgression: [] as string[],
    streamEvents: [] as any[]
  };

  try {
    logger.section('Configuration');
    logger.info('Prompt', prompt);
    logger.info('Options', { includePartialMessages: true });

    logger.section('Execution');
    const q = setupPartialMessagesQuery(prompt);

    let lastAssistantText = '';

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized', {
              sessionId: message.session_id,
              model: message.model
            });
          }
          break;

        case 'assistant':
          const content = message.message.content;
          const isPartial = message.partial === true;

          if (isPartial) {
            partialDetails.partialCount++;
            // Extract text content if available
            if (Array.isArray(content)) {
              const textBlock = content.find((c: any) => c.type === 'text');
              if (textBlock?.text && textBlock.text !== lastAssistantText) {
                partialDetails.textProgression.push(textBlock.text);
                lastAssistantText = textBlock.text;
                logger.info(`Partial message #${partialDetails.partialCount}`, {
                  textLength: textBlock.text.length,
                  preview: textBlock.text.substring(0, 50) + '...'
                });
              }
            }
          } else {
            partialDetails.finalCount++;
            logger.message('assistant', content);
          }
          break;

        case 'stream_event':
          partialDetails.streamEvents.push({
            event: message.event,
            timestamp: Date.now()
          });

          if (message.event === 'content_block_start') {
            logger.info('Content block started', message.data);
          } else if (message.event === 'content_block_delta') {
            logger.info('Content delta', {
              index: message.data?.index,
              deltaType: message.data?.delta?.type
            });
          } else if (message.event === 'content_block_stop') {
            logger.info('Content block stopped');
          }
          break;

        case 'user':
          logger.message('user', message.message.content);
          break;

        case 'result':
          metrics.recordTokens(message.usage);
          metrics.recordCost(message.total_cost_usd);

          logger.success('Query completed', {
            turns: message.num_turns,
            duration: `${message.duration_ms}ms`,
            cost: `$${message.total_cost_usd.toFixed(6)}`
          });
          break;

        default:
          logger.warning(`Unexpected message type: ${message.type}`);
      }
    }

    metrics.complete(true);

    logger.section('Partial Message Summary');
    logger.info('Statistics', {
      partialMessages: partialDetails.partialCount,
      finalMessages: partialDetails.finalCount,
      textProgressionSteps: partialDetails.textProgression.length,
      streamEvents: partialDetails.streamEvents.length
    });

    if (partialDetails.textProgression.length > 0) {
      logger.info('Text progression sample', {
        first: partialDetails.textProgression[0]?.substring(0, 100),
        middle: partialDetails.textProgression[Math.floor(partialDetails.textProgression.length / 2)]?.substring(0, 100),
        last: partialDetails.textProgression[partialDetails.textProgression.length - 1]?.substring(0, 100)
      });
    }

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      partialDetails
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
      logs: logger.getLogsAsString(),
      partialDetails
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Partial Messages Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: Short response (may not show many partials)
  console.log('Test 1: Short response');
  const result1 = await testPartialMessages(
    'Count from 1 to 5',
    'Short Response'
  );

  results.push({
    test: 'Short Response',
    success: result1.success,
    details: {
      partials: result1.partialDetails.partialCount,
      finals: result1.partialDetails.finalCount
    }
  });

  output.addTest('Short Response', {
    prompt: 'Count from 1 to 5',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Longer response (should show more partials)
  console.log('\nTest 2: Longer response');
  const result2 = await testPartialMessages(
    'Write a 200-word story about a robot learning to paint',
    'Long Response'
  );

  results.push({
    test: 'Long Response',
    success: result2.success,
    details: {
      partials: result2.partialDetails.partialCount,
      finals: result2.partialDetails.finalCount,
      progressionSteps: result2.partialDetails.textProgression.length
    }
  });

  output.addTest('Long Response', {
    prompt: 'Write a 200-word story about a robot learning to paint',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Code generation (structured output)
  console.log('\nTest 3: Code generation');
  const result3 = await testPartialMessages(
    'Write a Python function to calculate fibonacci numbers with comments',
    'Code Generation'
  );

  results.push({
    test: 'Code Generation',
    success: result3.success,
    details: {
      partials: result3.partialDetails.partialCount,
      streamEvents: result3.partialDetails.streamEvents.length
    }
  });

  output.addTest('Code Generation', {
    prompt: 'Write a Python function to calculate fibonacci numbers with comments',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Tool use with partials
  console.log('\nTest 4: Tool use with partial messages');
  const result4 = await testPartialMessages(
    'Check what files are in the current directory and describe what you find',
    'Tool Use Partials'
  );

  results.push({
    test: 'Tool Use with Partials',
    success: result4.success,
    details: {
      partials: result4.partialDetails.partialCount,
      finals: result4.partialDetails.finalCount
    }
  });

  output.addTest('Tool Use with Partials', {
    prompt: 'Check what files are in the current directory and describe what you find',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Add partial message analysis
  output.addJSON('Partial Message Analysis', {
    test1: {
      partialCount: result1.partialDetails.partialCount,
      textProgressionSample: result1.partialDetails.textProgression.slice(0, 3)
    },
    test2: {
      partialCount: result2.partialDetails.partialCount,
      textProgressionSample: result2.partialDetails.textProgression.slice(0, 3)
    },
    test3: {
      partialCount: result3.partialDetails.partialCount,
      streamEventTypes: [...new Set(result3.partialDetails.streamEvents.map((e: any) => e.event))]
    },
    test4: {
      partialCount: result4.partialDetails.partialCount,
      finalCount: result4.partialDetails.finalCount
    }
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