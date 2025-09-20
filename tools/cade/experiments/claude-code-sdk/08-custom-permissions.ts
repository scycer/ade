#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Custom Permissions
 * Tests: Custom canUseTool permission handlers with different policies
 * Expected: Fine-grained control over tool execution based on custom logic
 */

// Custom permission handler types
type PermissionPolicy = 'allowAll' | 'blockDangerous' | 'requireApproval' | 'logOnly';

interface ToolUseContext {
  toolName: string;
  input: any;
  previousAttempts: number;
  sessionId: string;
}

// Custom permission handlers
function createCustomPermissionHandler(policy: PermissionPolicy) {
  const dangerousTools = ['Bash', 'KillShell', 'Write'];
  const attempts = new Map<string, number>();

  return (context: ToolUseContext): boolean | Promise<boolean> => {
    const { toolName, input, sessionId } = context;
    const attemptKey = `${sessionId}-${toolName}`;
    const currentAttempts = attempts.get(attemptKey) || 0;
    attempts.set(attemptKey, currentAttempts + 1);

    switch (policy) {
      case 'allowAll':
        console.log(`✅ ALLOW: ${toolName} (allowAll policy)`);
        return true;

      case 'blockDangerous':
        if (dangerousTools.includes(toolName)) {
          console.log(`❌ BLOCK: ${toolName} (dangerous tool blocked)`);
          return false;
        }
        console.log(`✅ ALLOW: ${toolName} (safe tool)`);
        return true;

      case 'requireApproval':
        if (currentAttempts > 2) {
          console.log(`❌ BLOCK: ${toolName} (too many attempts: ${currentAttempts})`);
          return false;
        }
        console.log(`✅ ALLOW: ${toolName} (attempt ${currentAttempts})`);
        return true;

      case 'logOnly':
        console.log(`📝 LOG: ${toolName} with input:`, JSON.stringify(input, null, 2));
        return true;

      default:
        return true;
    }
  };
}

// SDK Setup Function with custom permissions
function setupCustomPermissionQuery(
  prompt: string,
  permissionHandler: (context: ToolUseContext) => boolean | Promise<boolean>,
  options?: Options
): Query {
  return query({
    prompt,
    canUseTool: permissionHandler,
    options: options || { maxTurns: 5 }
  });
}

// Async permission handler for complex logic
async function createAsyncPermissionHandler(policy: 'apiCheck' | 'fileValidation') {
  return async (context: ToolUseContext): Promise<boolean> => {
    const { toolName, input } = context;

    switch (policy) {
      case 'apiCheck':
        // Simulate API permission check
        await new Promise(resolve => setTimeout(resolve, 100));
        const allowed = Math.random() > 0.3; // 70% success rate
        console.log(`🌐 API CHECK: ${toolName} -> ${allowed ? 'ALLOWED' : 'DENIED'}`);
        return allowed;

      case 'fileValidation':
        if (toolName === 'Write' || toolName === 'Edit') {
          const filePath = input.file_path || input.path;
          if (filePath && filePath.includes('system')) {
            console.log(`🔒 FILE VALIDATION: Blocking system file access: ${filePath}`);
            return false;
          }
        }
        console.log(`✅ FILE VALIDATION: ${toolName} approved`);
        return true;

      default:
        return true;
    }
  };
}

// Tester Function
async function testCustomPermissions(
  testName: string,
  permissionHandler: (context: ToolUseContext) => boolean | Promise<boolean>,
  prompts: string | string[]
): Promise<ExperimentResult & { logs: string; permissionEvents: any[] }> {
  const logger = new ExperimentLogger(`08-custom-permissions - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];
  const permissionEvents: any[] = [];

  try {
    logger.section('Configuration');
    logger.info('Test', testName);
    logger.info('Prompts', Array.isArray(prompts) ? prompts : [prompts]);

    logger.section('Execution');

    const q = setupCustomPermissionQuery(
      Array.isArray(prompts) ? prompts[0] : prompts,
      permissionHandler
    );

    let promptIndex = 0;

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized', {
              sessionId: message.session_id,
              customPermissions: 'enabled'
            });
          }
          break;

        case 'assistant':
          const content = message.message.content;

          // Track tool use attempts and permission checks
          if (Array.isArray(content)) {
            const toolUses = content.filter((c: any) => c.type === 'tool_use');
            toolUses.forEach((tool: any) => {
              const event = {
                timestamp: new Date().toISOString(),
                toolName: tool.name,
                input: tool.input,
                status: 'attempted'
              };
              permissionEvents.push(event);
              logger.info(`Tool use attempt: ${tool.name}`, tool.input);
            });
          }

          logger.message('assistant', content);
          break;

        case 'user':
          const userContent = message.message.content;

          // Check for tool results to see if permissions were applied
          if (Array.isArray(userContent)) {
            const toolResults = userContent.filter((c: any) => c.type === 'tool_result');
            toolResults.forEach((result: any) => {
              const lastEvent = permissionEvents[permissionEvents.length - 1];
              if (lastEvent) {
                lastEvent.status = result.is_error ? 'blocked' : 'allowed';
                lastEvent.result = result.content;
              }

              if (result.is_error) {
                logger.warning('Tool blocked by permissions', result.content);
              } else {
                logger.success('Tool executed successfully');
              }
            });
          }

          logger.message('user', userContent);

          // Send next prompt if available
          if (Array.isArray(prompts) && promptIndex < prompts.length - 1) {
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

    metrics.complete(true);

    logger.section('Permission Events Summary');
    const allowedCount = permissionEvents.filter(e => e.status === 'allowed').length;
    const blockedCount = permissionEvents.filter(e => e.status === 'blocked').length;

    logger.info('Permission Statistics', {
      totalAttempts: permissionEvents.length,
      allowed: allowedCount,
      blocked: blockedCount,
      blockRate: `${((blockedCount / permissionEvents.length) * 100).toFixed(1)}%`
    });

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      permissionEvents
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
      permissionEvents
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Custom Permissions Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: Allow All Policy
  console.log('Test 1: Allow all tools policy');
  const allowAllHandler = createCustomPermissionHandler('allowAll');
  const result1 = await testCustomPermissions(
    'Allow All Policy',
    allowAllHandler,
    'Create a file called test-allow-all.txt and then read it back'
  );

  results.push({
    test: 'Allow All Policy',
    success: result1.success,
    permissionEvents: result1.permissionEvents.length,
    blocked: result1.permissionEvents.filter(e => e.status === 'blocked').length
  });

  output.addTest('Allow All Policy', {
    prompt: 'Create a file called test-allow-all.txt and then read it back',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Block Dangerous Tools
  console.log('\nTest 2: Block dangerous tools policy');
  const blockDangerousHandler = createCustomPermissionHandler('blockDangerous');
  const result2 = await testCustomPermissions(
    'Block Dangerous Tools',
    blockDangerousHandler,
    [
      'Try to read a file using the Read tool',
      'Now try to write a file using the Write tool',
      'Finally, try to run a bash command'
    ]
  );

  results.push({
    test: 'Block Dangerous Tools',
    success: result2.success,
    permissionEvents: result2.permissionEvents.length,
    blocked: result2.permissionEvents.filter(e => e.status === 'blocked').length
  });

  output.addTest('Block Dangerous Tools', {
    prompt: 'Test various tools with dangerous tool blocking',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Require Approval (Attempt Limiting)
  console.log('\nTest 3: Require approval with attempt limiting');
  const requireApprovalHandler = createCustomPermissionHandler('requireApproval');
  const result3 = await testCustomPermissions(
    'Require Approval',
    requireApprovalHandler,
    [
      'Use the Read tool to check current directory',
      'Use the Read tool again',
      'Use the Read tool a third time',
      'Try using the Read tool once more (should be blocked)'
    ]
  );

  results.push({
    test: 'Require Approval',
    success: result3.success,
    permissionEvents: result3.permissionEvents.length,
    blocked: result3.permissionEvents.filter(e => e.status === 'blocked').length
  });

  output.addTest('Require Approval with Limits', {
    prompt: 'Test attempt limiting with approval requirements',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Async API Check
  console.log('\nTest 4: Async API permission check');
  const asyncApiHandler = await createAsyncPermissionHandler('apiCheck');
  const result4 = await testCustomPermissions(
    'Async API Check',
    asyncApiHandler,
    'Perform multiple operations that require API permission checks'
  );

  results.push({
    test: 'Async API Check',
    success: result4.success,
    permissionEvents: result4.permissionEvents.length,
    blocked: result4.permissionEvents.filter(e => e.status === 'blocked').length
  });

  output.addTest('Async API Permission Check', {
    prompt: 'Perform multiple operations that require API permission checks',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Test 5: File Validation
  console.log('\nTest 5: File validation permissions');
  const fileValidationHandler = await createAsyncPermissionHandler('fileValidation');
  const result5 = await testCustomPermissions(
    'File Validation',
    fileValidationHandler,
    [
      'Create a regular file called user-data.txt',
      'Try to create a file called system-config.txt',
      'Read the user-data.txt file'
    ]
  );

  results.push({
    test: 'File Validation',
    success: result5.success,
    permissionEvents: result5.permissionEvents.length,
    blocked: result5.permissionEvents.filter(e => e.status === 'blocked').length
  });

  output.addTest('File Validation Permissions', {
    prompt: 'Test file path validation with custom permissions',
    messages: result5.messages,
    metrics: result5.metrics,
    logs: result5.logs
  });

  // Add custom permissions analysis
  output.addJSON('Custom Permissions Analysis', {
    policies: {
      allowAll: {
        events: result1.permissionEvents.length,
        blocked: result1.permissionEvents.filter(e => e.status === 'blocked').length
      },
      blockDangerous: {
        events: result2.permissionEvents.length,
        blocked: result2.permissionEvents.filter(e => e.status === 'blocked').length
      },
      requireApproval: {
        events: result3.permissionEvents.length,
        blocked: result3.permissionEvents.filter(e => e.status === 'blocked').length
      },
      asyncApiCheck: {
        events: result4.permissionEvents.length,
        blocked: result4.permissionEvents.filter(e => e.status === 'blocked').length
      },
      fileValidation: {
        events: result5.permissionEvents.length,
        blocked: result5.permissionEvents.filter(e => e.status === 'blocked').length
      }
    },
    totalEvents: results.reduce((sum, r) => sum + r.permissionEvents, 0),
    totalBlocked: results.reduce((sum, r) => sum + r.blocked, 0)
  });

  // Add final summary
  output.addSummary(results);

  // Console summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 CUSTOM PERMISSIONS EXPERIMENT SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.test}: ${r.success ? '✅' : '❌'} (${r.blocked}/${r.permissionEvents} blocked)`);
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