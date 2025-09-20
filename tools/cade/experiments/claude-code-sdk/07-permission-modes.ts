#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query, PermissionMode } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Permission Modes
 * Tests: All permission modes (default, acceptEdits, bypassPermissions, plan)
 * Expected: Different behaviors for file operations based on permission mode
 */

// SDK Setup Function with specific permission mode
function setupPermissionQuery(
  prompt: string,
  permissionMode: PermissionMode,
  options?: Options
): Query {
  return query({
    prompt,
    permissionMode,
    options: options || { maxTurns: 5 }
  });
}

// Helper for streaming input with permission changes
async function* createInteractiveStream(
  prompts: string[],
  q: Query,
  changePermissions?: { afterPrompt: number; newMode: PermissionMode }
): AsyncIterable<string> {
  for (let i = 0; i < prompts.length; i++) {
    yield prompts[i];

    // Change permissions mid-stream if specified
    if (changePermissions && i === changePermissions.afterPrompt) {
      try {
        q.setPermissionMode(changePermissions.newMode);
        console.log(`Changed permission mode to: ${changePermissions.newMode}`);
      } catch (e) {
        console.error('Failed to change permission mode:', e);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Tester Function
async function testPermissionMode(
  testName: string,
  permissionMode: PermissionMode,
  prompts: string | string[],
  expectPlanMode: boolean = false
): Promise<ExperimentResult & { logs: string; permissionDetails: any }> {
  const logger = new ExperimentLogger(`07-permission-modes - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];
  const permissionDetails = {
    mode: permissionMode,
    toolUseAttempts: 0,
    toolUseBlocked: 0,
    planModeExited: false,
    userInterventions: 0,
    fileOperations: [] as string[]
  };

  try {
    logger.section('Configuration');
    logger.info('Test', testName);
    logger.info('Permission Mode', permissionMode);
    logger.info('Prompts', Array.isArray(prompts) ? prompts : [prompts]);
    logger.info('Expect Plan Mode', expectPlanMode);

    logger.section('Execution');

    let q: Query;
    if (Array.isArray(prompts)) {
      // Use streaming for multiple prompts
      const promptStream = createInteractiveStream(prompts, q!, undefined);
      q = query({
        prompt: promptStream,
        permissionMode,
        options: { maxTurns: 10 }
      });
    } else {
      q = setupPermissionQuery(prompts, permissionMode);
    }

    let inPlanMode = permissionMode === 'plan';

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized', {
              sessionId: message.session_id,
              permissionMode: permissionMode
            });
          } else if (message.subtype === 'plan_mode_exited') {
            permissionDetails.planModeExited = true;
            inPlanMode = false;
            logger.success('Exited plan mode');
          }
          break;

        case 'assistant':
          const content = message.message.content;

          // Check for tool use attempts
          if (Array.isArray(content)) {
            const toolUses = content.filter((c: any) => c.type === 'tool_use');
            if (toolUses.length > 0) {
              permissionDetails.toolUseAttempts += toolUses.length;
              toolUses.forEach((tool: any) => {
                logger.info(`Tool use attempt: ${tool.name}`, tool.input);
                if (tool.name === 'Write' || tool.name === 'Edit' || tool.name === 'MultiEdit') {
                  permissionDetails.fileOperations.push(`${tool.name}: ${tool.input.file_path || tool.input.path}`);
                }
              });
            }
          }

          logger.message('assistant', content);
          break;

        case 'user':
          const userContent = message.message.content;

          // Check for tool result errors (permission denied)
          if (Array.isArray(userContent)) {
            const toolResults = userContent.filter((c: any) => c.type === 'tool_result');
            toolResults.forEach((result: any) => {
              if (result.is_error || result.content?.includes('permission')) {
                permissionDetails.toolUseBlocked++;
                logger.warning('Tool use blocked', result.content);
              }
            });
          }

          // Check if this is user intervention
          if (!Array.isArray(prompts) && messages.filter(m => m.type === 'user').length > 1) {
            permissionDetails.userInterventions++;
          }

          logger.message('user', userContent);
          break;

        case 'result':
          metrics.recordTokens(message.usage);
          metrics.recordCost(message.total_cost_usd);

          logger.info('Result', {
            subtype: message.subtype,
            turns: message.num_turns,
            inPlanMode
          });
          break;

        default:
          logger.warning(`Unexpected message type: ${message.type}`);
      }
    }

    // Exit plan mode if needed
    if (inPlanMode && expectPlanMode) {
      logger.info('Attempting to exit plan mode...');
      try {
        q.exitPlanMode();
        permissionDetails.planModeExited = true;
        logger.success('Plan mode exit requested');
      } catch (e) {
        logger.error('Failed to exit plan mode', e);
      }
    }

    metrics.complete(true);

    logger.section('Permission Mode Summary');
    logger.info('Details', {
      mode: permissionDetails.mode,
      toolAttempts: permissionDetails.toolUseAttempts,
      toolBlocked: permissionDetails.toolUseBlocked,
      fileOps: permissionDetails.fileOperations.length,
      planModeExited: permissionDetails.planModeExited
    });

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      permissionDetails
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
      permissionDetails
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Permission Modes Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: Default mode (requires user confirmation)
  console.log('Test 1: Default permission mode');
  const result1 = await testPermissionMode(
    'Default Mode',
    'default',
    'Create a file called permission-test.txt with content "Default mode test"'
  );

  results.push({
    test: 'Default Mode',
    success: result1.success,
    details: {
      toolAttempts: result1.permissionDetails.toolUseAttempts,
      fileOps: result1.permissionDetails.fileOperations
    }
  });

  output.addTest('Default Permission Mode', {
    prompt: 'Create a file called permission-test.txt with content "Default mode test"',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Accept edits mode (auto-accepts file edits)
  console.log('\nTest 2: Accept edits mode');
  const result2 = await testPermissionMode(
    'Accept Edits',
    'acceptEdits',
    'Create a file called accept-edits-test.txt with "Auto accepted edit"'
  );

  results.push({
    test: 'Accept Edits Mode',
    success: result2.success,
    details: {
      toolAttempts: result2.permissionDetails.toolUseAttempts,
      toolBlocked: result2.permissionDetails.toolUseBlocked
    }
  });

  output.addTest('Accept Edits Mode', {
    prompt: 'Create a file called accept-edits-test.txt with "Auto accepted edit"',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Bypass permissions mode (all operations auto-approved)
  console.log('\nTest 3: Bypass permissions mode');
  const result3 = await testPermissionMode(
    'Bypass Permissions',
    'bypassPermissions',
    [
      'Create bypass-test.txt with "Bypassed permissions"',
      'Now read that file back',
      'Delete the file'
    ]
  );

  results.push({
    test: 'Bypass Permissions',
    success: result3.success,
    details: {
      toolAttempts: result3.permissionDetails.toolUseAttempts,
      fileOps: result3.permissionDetails.fileOperations.length
    }
  });

  output.addTest('Bypass Permissions Mode', {
    prompt: 'Multiple file operations with bypass',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Plan mode (planning without execution)
  console.log('\nTest 4: Plan mode');
  const result4 = await testPermissionMode(
    'Plan Mode',
    'plan',
    'Create a comprehensive plan to refactor a JavaScript codebase to TypeScript',
    true
  );

  results.push({
    test: 'Plan Mode',
    success: result4.success,
    details: {
      planModeExited: result4.permissionDetails.planModeExited,
      toolAttempts: result4.permissionDetails.toolUseAttempts
    }
  });

  output.addTest('Plan Mode', {
    prompt: 'Create a comprehensive plan to refactor a JavaScript codebase to TypeScript',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Add permission mode analysis
  output.addJSON('Permission Mode Analysis', {
    default: {
      toolAttempts: result1.permissionDetails.toolUseAttempts,
      toolBlocked: result1.permissionDetails.toolUseBlocked,
      userInterventions: result1.permissionDetails.userInterventions
    },
    acceptEdits: {
      toolAttempts: result2.permissionDetails.toolUseAttempts,
      fileOperations: result2.permissionDetails.fileOperations
    },
    bypassPermissions: {
      toolAttempts: result3.permissionDetails.toolUseAttempts,
      fileOperations: result3.permissionDetails.fileOperations
    },
    plan: {
      planModeExited: result4.permissionDetails.planModeExited,
      toolAttempts: result4.permissionDetails.toolUseAttempts
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