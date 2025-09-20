#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Message Types
 * Tests: Handle different SDKMessage types and extract data
 * Expected: Process all message types correctly
 */

// SDK Setup Function
function setupMessageTypesQuery(prompt: string, options?: Options): Query {
  return query({
    prompt,
    options: options || {
      maxTurns: 3
    }
  });
}

// Tester Function - Focus on message type handling
async function testMessageTypes(
  prompt: string,
  testName: string,
  options?: Options
): Promise<ExperimentResult & { logs: string; messageTypeDetails: any }> {
  const logger = new ExperimentLogger(`03-message-types - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];
  const messageTypeDetails: any = {
    system: [],
    assistant: [],
    user: [],
    result: null,
    streamEvents: []
  };

  try {
    logger.section('Configuration');
    logger.info('Prompt', prompt);
    logger.info('Options', options || { maxTurns: 3 });

    logger.section('Execution');
    const q = setupMessageTypesQuery(prompt, options);

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          messageTypeDetails.system.push({
            subtype: message.subtype,
            sessionId: message.session_id,
            model: message.model,
            toolCount: message.tools?.length,
            cwd: message.cwd
          });

          logger.info(`System message (${message.subtype})`, {
            sessionId: message.session_id,
            model: message.model
          });
          break;

        case 'assistant':
          const assistantContent = message.message.content;
          const assistantDetail: any = {
            uuid: message.uuid,
            contentType: Array.isArray(assistantContent) ? 'array' : 'string',
            contentLength: Array.isArray(assistantContent) ? assistantContent.length : 1
          };

          if (Array.isArray(assistantContent)) {
            assistantDetail.contentBlocks = assistantContent.map((c: any) => ({
              type: c.type,
              name: c.name,
              id: c.id
            }));
          }

          messageTypeDetails.assistant.push(assistantDetail);
          logger.message('assistant', assistantContent);
          break;

        case 'user':
          const userContent = message.message.content;
          messageTypeDetails.user.push({
            uuid: message.uuid,
            contentType: Array.isArray(userContent) ? 'array' : 'string',
            hasToolResults: Array.isArray(userContent) &&
              userContent.some((c: any) => c.type === 'tool_result')
          });

          logger.message('user', userContent);
          break;

        case 'result':
          messageTypeDetails.result = {
            subtype: message.subtype,
            numTurns: message.num_turns,
            durationMs: message.duration_ms,
            totalCostUsd: message.total_cost_usd,
            usage: message.usage,
            error: message.error,
            exitReason: message.exit_reason
          };

          metrics.recordTokens(message.usage);
          metrics.recordCost(message.total_cost_usd);

          logger.info('Result message', messageTypeDetails.result);
          break;

        case 'stream_event':
          messageTypeDetails.streamEvents.push({
            event: message.event,
            data: message.data
          });

          logger.info('Stream event', { event: message.event });
          break;

        default:
          logger.warning(`Unknown message type: ${message.type}`);
      }
    }

    metrics.complete(true);
    logger.section('Message Type Summary');
    logger.info('Message counts', {
      system: messageTypeDetails.system.length,
      assistant: messageTypeDetails.assistant.length,
      user: messageTypeDetails.user.length,
      streamEvents: messageTypeDetails.streamEvents.length,
      hasResult: messageTypeDetails.result !== null
    });

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      messageTypeDetails
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
      messageTypeDetails
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Message Types Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: Simple text messages
  console.log('Test 1: Simple text messages');
  const result1 = await testMessageTypes(
    'Say "Hello" and then say "World"',
    'Simple Text'
  );

  results.push({
    test: 'Simple Text Messages',
    success: result1.success,
    details: {
      messages: result1.messages.length,
      assistantMessages: result1.messageTypeDetails.assistant.length
    }
  });

  output.addTest('Simple Text Messages', {
    prompt: 'Say "Hello" and then say "World"',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Tool use messages
  console.log('\nTest 2: Tool use messages');
  const result2 = await testMessageTypes(
    'Create a file called test.txt with content "Message types test"',
    'Tool Use'
  );

  results.push({
    test: 'Tool Use Messages',
    success: result2.success,
    details: {
      messages: result2.messages.length,
      toolUses: result2.messageTypeDetails.assistant
        .filter((a: any) => a.contentBlocks?.some((b: any) => b.type === 'tool_use')).length
    }
  });

  output.addTest('Tool Use Messages', {
    prompt: 'Create a file called test.txt with content "Message types test"',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Error result message
  console.log('\nTest 3: Error result message (max turns)');
  const result3 = await testMessageTypes(
    'Count from 1 to 100',
    'Error Result',
    { maxTurns: 1 }
  );

  results.push({
    test: 'Error Result Message',
    success: result3.success,
    details: {
      resultSubtype: result3.messageTypeDetails.result?.subtype,
      exitReason: result3.messageTypeDetails.result?.exitReason
    }
  });

  output.addTest('Error Result Message', {
    prompt: 'Count from 1 to 100',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Usage statistics
  console.log('\nTest 4: Usage statistics extraction');
  const result4 = await testMessageTypes(
    'Write a haiku about coding',
    'Usage Statistics'
  );

  results.push({
    test: 'Usage Statistics',
    success: result4.success,
    details: {
      tokens: result4.messageTypeDetails.result?.usage,
      cost: result4.messageTypeDetails.result?.totalCostUsd
    }
  });

  output.addTest('Usage Statistics', {
    prompt: 'Write a haiku about coding',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Add detailed message type analysis
  output.addJSON('Message Type Analysis', {
    test1: result1.messageTypeDetails,
    test2: result2.messageTypeDetails,
    test3: result3.messageTypeDetails,
    test4: result4.messageTypeDetails
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