#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query, PermissionMode } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Streaming Input
 * Tests: AsyncIterable input for continuous conversation with interrupt capability
 * Expected: Dynamic conversation control, permission mode changes, and interrupts
 */

// Helper to create async generator for streaming prompts
async function* createPromptStream(prompts: string[], delayMs: number = 100): AsyncIterable<string> {
  for (const prompt of prompts) {
    yield prompt;
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

// SDK Setup Function with streaming input
function setupStreamingQuery(promptStream: AsyncIterable<string>, options?: Options): Query {
  return query({
    prompt: promptStream,
    options: options || {
      maxTurns: 10
    }
  });
}

// Tester Function
async function testStreamingInput(
  testName: string,
  prompts: string[],
  useInterrupt: boolean = false,
  changePermissions: boolean = false
): Promise<ExperimentResult & { logs: string; streamDetails: any }> {
  const logger = new ExperimentLogger(`05-streaming-input - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];
  const streamDetails = {
    promptsSent: 0,
    interruptUsed: false,
    permissionChanges: [] as string[],
    conversationFlow: [] as { type: string; content: string }[]
  };

  try {
    logger.section('Configuration');
    logger.info('Test', testName);
    logger.info('Prompts to send', prompts);
    logger.info('Use interrupt', useInterrupt);
    logger.info('Change permissions', changePermissions);

    logger.section('Execution');

    // Create prompt stream
    const promptStream = createPromptStream(prompts);
    const q = setupStreamingQuery(promptStream);

    let messageCount = 0;
    let shouldInterrupt = false;

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);
      messageCount++;

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
          const textContent = Array.isArray(content)
            ? content.find((c: any) => c.type === 'text')?.text
            : content;

          streamDetails.conversationFlow.push({
            type: 'assistant',
            content: textContent || '[tool use]'
          });

          logger.message('assistant', content);

          // Test interrupt after specific assistant response
          if (useInterrupt && messageCount > 5 && !shouldInterrupt) {
            shouldInterrupt = true;
            logger.warning('Triggering interrupt...');
            try {
              q.interrupt();
              streamDetails.interruptUsed = true;
              logger.success('Interrupt triggered');
            } catch (e) {
              logger.error('Interrupt failed', e);
            }
          }

          // Test permission mode change
          if (changePermissions && messageCount === 4) {
            try {
              q.setPermissionMode('bypassPermissions' as PermissionMode);
              streamDetails.permissionChanges.push('bypassPermissions');
              logger.success('Changed permission mode to bypassPermissions');
            } catch (e) {
              logger.error('Permission change failed', e);
            }
          }
          break;

        case 'user':
          const userContent = message.message.content;
          const userText = Array.isArray(userContent)
            ? userContent.find((c: any) => c.type === 'text')?.text
            : userContent;

          if (userText) {
            streamDetails.promptsSent++;
            streamDetails.conversationFlow.push({
              type: 'user',
              content: userText
            });
          }

          logger.message('user', userContent);
          break;

        case 'result':
          metrics.recordTokens(message.usage);
          metrics.recordCost(message.total_cost_usd);

          logger.info('Result', {
            subtype: message.subtype,
            turns: message.num_turns,
            duration: `${message.duration_ms}ms`
          });

          if (message.subtype === 'interrupt') {
            logger.success('Query interrupted successfully');
          }
          break;

        default:
          logger.warning(`Unexpected message type: ${message.type}`);
      }
    }

    metrics.complete(true);

    logger.section('Streaming Summary');
    logger.info('Details', {
      promptsSent: streamDetails.promptsSent,
      totalMessages: messages.length,
      interruptUsed: streamDetails.interruptUsed,
      permissionChanges: streamDetails.permissionChanges.length,
      conversationTurns: streamDetails.conversationFlow.length
    });

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      streamDetails
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
      streamDetails
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Streaming Input Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: Basic streaming conversation
  console.log('Test 1: Basic streaming conversation');
  const prompts1 = [
    'Hello! Please introduce yourself briefly.',
    'What is 2 + 2?',
    'Thank you!'
  ];
  const result1 = await testStreamingInput('Basic Streaming', prompts1);

  results.push({
    test: 'Basic Streaming',
    success: result1.success,
    details: {
      promptsSent: result1.streamDetails.promptsSent,
      conversationTurns: result1.streamDetails.conversationFlow.length
    }
  });

  output.addTest('Basic Streaming Conversation', {
    prompt: prompts1.join(' -> '),
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Streaming with interrupt
  console.log('\nTest 2: Streaming with interrupt');
  const prompts2 = [
    'Count from 1 to 20 slowly',
    'Keep counting...',
    'Almost there...'
  ];
  const result2 = await testStreamingInput('With Interrupt', prompts2, true);

  results.push({
    test: 'With Interrupt',
    success: result2.success,
    details: {
      interruptUsed: result2.streamDetails.interruptUsed,
      messagesBeforeInterrupt: result2.messages.length
    }
  });

  output.addTest('Streaming with Interrupt', {
    prompt: prompts2.join(' -> '),
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Permission mode changes
  console.log('\nTest 3: Permission mode changes');
  const prompts3 = [
    'I need to create a file',
    'Create test-streaming.txt with content "Hello from streaming"',
    'Now read that file back'
  ];
  const result3 = await testStreamingInput('Permission Changes', prompts3, false, true);

  results.push({
    test: 'Permission Mode Changes',
    success: result3.success,
    details: {
      permissionChanges: result3.streamDetails.permissionChanges,
      promptsSent: result3.streamDetails.promptsSent
    }
  });

  output.addTest('Permission Mode Changes', {
    prompt: prompts3.join(' -> '),
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Complex conversation flow
  console.log('\nTest 4: Complex conversation flow');
  const prompts4 = [
    'Let\'s play a word association game',
    'I say "sun", you respond with a related word',
    'Moon',
    'Stars',
    'Great job! Game over.'
  ];
  const result4 = await testStreamingInput('Complex Flow', prompts4);

  results.push({
    test: 'Complex Conversation Flow',
    success: result4.success,
    details: {
      conversationLength: result4.streamDetails.conversationFlow.length,
      promptsSent: result4.streamDetails.promptsSent
    }
  });

  output.addTest('Complex Conversation Flow', {
    prompt: prompts4.join(' -> '),
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Add streaming analysis
  output.addJSON('Streaming Analysis', {
    test1: {
      flow: result1.streamDetails.conversationFlow
    },
    test2: {
      interruptDetails: {
        used: result2.streamDetails.interruptUsed,
        messageCount: result2.messages.length
      }
    },
    test3: {
      permissionChanges: result3.streamDetails.permissionChanges
    },
    test4: {
      conversationSummary: {
        turns: result4.streamDetails.conversationFlow.length,
        prompts: result4.streamDetails.promptsSent
      }
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