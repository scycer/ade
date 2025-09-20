#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Session Management
 * Tests: Continue and resume sessions with context preservation
 * Expected: Maintain conversation context across multiple queries
 */

// Store session IDs for testing
let savedSessionId: string | undefined;
let savedCompactBoundary: number | undefined;

// SDK Setup Functions
function setupNewSession(prompt: string, options?: Options): Query {
  return query({
    prompt,
    options: options || { maxTurns: 3 }
  });
}

function setupContinueSession(prompt: string, sessionId: string, options?: Options): Query {
  return query({
    prompt,
    sessionId,
    continueSession: true,
    options: options || { maxTurns: 3 }
  });
}

function setupResumeSession(
  prompt: string,
  sessionId: string,
  compactBoundary: number,
  options?: Options
): Query {
  return query({
    prompt,
    sessionId,
    resumeSession: {
      compactBoundary
    },
    options: options || { maxTurns: 3 }
  });
}

// Tester Function
async function testSession(
  prompt: string,
  testName: string,
  sessionType: 'new' | 'continue' | 'resume',
  sessionId?: string,
  compactBoundary?: number
): Promise<ExperimentResult & { logs: string; sessionDetails: any }> {
  const logger = new ExperimentLogger(`06-session-management - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];
  const sessionDetails = {
    sessionId: '',
    sessionType,
    compactBoundary: 0,
    conversationContext: [] as string[],
    messageCount: 0
  };

  try {
    logger.section('Configuration');
    logger.info('Test', testName);
    logger.info('Session Type', sessionType);
    logger.info('Prompt', prompt);
    if (sessionId) logger.info('Session ID', sessionId);
    if (compactBoundary !== undefined) logger.info('Compact Boundary', compactBoundary);

    logger.section('Execution');

    let q: Query;
    switch (sessionType) {
      case 'new':
        q = setupNewSession(prompt);
        break;
      case 'continue':
        if (!sessionId) throw new Error('Session ID required for continue');
        q = setupContinueSession(prompt, sessionId);
        break;
      case 'resume':
        if (!sessionId || compactBoundary === undefined) {
          throw new Error('Session ID and compact boundary required for resume');
        }
        q = setupResumeSession(prompt, sessionId, compactBoundary);
        break;
      default:
        throw new Error(`Unknown session type: ${sessionType}`);
    }

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);
      sessionDetails.messageCount++;

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            sessionDetails.sessionId = message.session_id;
            sessionDetails.compactBoundary = message.compact_boundary || 0;

            // Save for later tests
            if (sessionType === 'new') {
              savedSessionId = message.session_id;
              savedCompactBoundary = message.compact_boundary;
            }

            logger.success('Session initialized', {
              sessionId: message.session_id,
              compactBoundary: message.compact_boundary,
              model: message.model
            });
          }
          break;

        case 'assistant':
          const content = message.message.content;
          const textContent = Array.isArray(content)
            ? content.find((c: any) => c.type === 'text')?.text
            : content;

          if (textContent) {
            sessionDetails.conversationContext.push(`Assistant: ${textContent}`);
          }

          logger.message('assistant', content);
          break;

        case 'user':
          const userContent = message.message.content;
          const userText = Array.isArray(userContent)
            ? userContent.find((c: any) => c.type === 'text')?.text
            : userContent;

          if (userText) {
            sessionDetails.conversationContext.push(`User: ${userText}`);
          }

          logger.message('user', userContent);
          break;

        case 'result':
          metrics.recordTokens(message.usage);
          metrics.recordCost(message.total_cost_usd);

          logger.success('Session query completed', {
            subtype: message.subtype,
            turns: message.num_turns,
            duration: `${message.duration_ms}ms`
          });
          break;

        default:
          logger.warning(`Unexpected message type: ${message.type}`);
      }
    }

    metrics.complete(true);

    logger.section('Session Summary');
    logger.info('Details', {
      sessionId: sessionDetails.sessionId,
      sessionType: sessionDetails.sessionType,
      compactBoundary: sessionDetails.compactBoundary,
      messageCount: sessionDetails.messageCount,
      contextLength: sessionDetails.conversationContext.length
    });

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      sessionDetails
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
      sessionDetails
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Session Management Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: Create new session
  console.log('Test 1: Create new session');
  const result1 = await testSession(
    'Remember this number: 42. I will ask you about it later.',
    'New Session',
    'new'
  );

  results.push({
    test: 'New Session',
    success: result1.success,
    details: {
      sessionId: result1.sessionDetails.sessionId,
      messages: result1.messages.length
    }
  });

  output.addTest('New Session Creation', {
    prompt: 'Remember this number: 42. I will ask you about it later.',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Continue the session
  console.log('\nTest 2: Continue session');
  const result2 = await testSession(
    'What number did I ask you to remember?',
    'Continue Session',
    'continue',
    savedSessionId
  );

  results.push({
    test: 'Continue Session',
    success: result2.success,
    details: {
      sessionId: result2.sessionDetails.sessionId,
      contextPreserved: result2.sessionDetails.conversationContext.some(c => c.includes('42'))
    }
  });

  output.addTest('Continue Session', {
    prompt: 'What number did I ask you to remember?',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Create another new session with context
  console.log('\nTest 3: New session with context');
  const result3 = await testSession(
    'My favorite color is blue. Please remember this.',
    'New Session 2',
    'new'
  );

  results.push({
    test: 'New Session with Context',
    success: result3.success,
    details: {
      sessionId: result3.sessionDetails.sessionId,
      newSessionCreated: result3.sessionDetails.sessionId !== savedSessionId
    }
  });

  output.addTest('New Session with Context', {
    prompt: 'My favorite color is blue. Please remember this.',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Resume the first session
  console.log('\nTest 4: Resume first session');
  const result4 = await testSession(
    'Can you still recall the number from our first conversation?',
    'Resume Session',
    'resume',
    savedSessionId,
    savedCompactBoundary
  );

  results.push({
    test: 'Resume Session',
    success: result4.success,
    details: {
      sessionId: result4.sessionDetails.sessionId,
      compactBoundary: result4.sessionDetails.compactBoundary
    }
  });

  output.addTest('Resume Session', {
    prompt: 'Can you still recall the number from our first conversation?',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Add session flow analysis
  output.addJSON('Session Flow Analysis', {
    sessionIds: {
      first: result1.sessionDetails.sessionId,
      continued: result2.sessionDetails.sessionId,
      new: result3.sessionDetails.sessionId,
      resumed: result4.sessionDetails.sessionId
    },
    contextPreservation: {
      continuePreserved: result2.sessionDetails.conversationContext,
      resumePreserved: result4.sessionDetails.conversationContext
    },
    compactBoundaries: {
      first: result1.sessionDetails.compactBoundary,
      continued: result2.sessionDetails.compactBoundary,
      resumed: result4.sessionDetails.compactBoundary
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