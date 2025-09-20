#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Additional Directories
 * Tests: Extended file access permissions beyond current working directory
 * Expected: Access to specified additional directories with proper permissions
 */

// Directory access configurations
interface DirectoryConfig {
  name: string;
  path: string;
  permissions: 'read' | 'write' | 'full';
  description: string;
}

const directoryConfigs: DirectoryConfig[] = [
  {
    name: 'temp',
    path: '/tmp',
    permissions: 'full',
    description: 'Temporary directory with full access'
  },
  {
    name: 'home',
    path: process.env.HOME || '/home/user',
    permissions: 'read',
    description: 'Home directory with read-only access'
  },
  {
    name: 'documents',
    path: `${process.env.HOME || '/home/user'}/Documents`,
    permissions: 'write',
    description: 'Documents directory with write access'
  },
  {
    name: 'projects',
    path: `${process.env.HOME || '/home/user'}/projects`,
    permissions: 'full',
    description: 'Projects directory with full access'
  },
  {
    name: 'system_logs',
    path: '/var/log',
    permissions: 'read',
    description: 'System logs with read-only access'
  }
];

// Helper to create test directories and files
async function setupTestEnvironment(configs: DirectoryConfig[]): Promise<{
  createdDirs: string[];
  createdFiles: string[];
  errors: string[];
}> {
  const createdDirs: string[] = [];
  const createdFiles: string[] = [];
  const errors: string[] = [];

  for (const config of configs) {
    try {
      // Try to create directory if it doesn't exist (where permissions allow)
      if (config.permissions === 'full' || config.permissions === 'write') {
        try {
          await Bun.write(`${config.path}/.test-sdk-access`, 'test');
          createdFiles.push(`${config.path}/.test-sdk-access`);
        } catch (error) {
          errors.push(`Failed to create test file in ${config.path}: ${error}`);
        }
      }

      // Check if directory is accessible
      try {
        const files = await Bun.glob('*', { cwd: config.path }).array();
        console.log(`✅ Directory ${config.path} accessible (${files.length} items)`);
      } catch (error) {
        errors.push(`Cannot access directory ${config.path}: ${error}`);
      }
    } catch (error) {
      errors.push(`Setup error for ${config.path}: ${error}`);
    }
  }

  return { createdDirs, createdFiles, errors };
}

// Helper to cleanup test environment
async function cleanupTestEnvironment(createdFiles: string[]): Promise<void> {
  for (const file of createdFiles) {
    try {
      await Bun.file(file).arrayBuffer(); // Check if exists
      console.log(`🧹 Cleaning up: ${file}`);
      // Note: In real implementation, we would delete the file here
    } catch (error) {
      // File doesn't exist or can't be accessed
    }
  }
}

// SDK Setup Function with additional directories
function setupAdditionalDirectoriesQuery(
  prompt: string,
  configs: DirectoryConfig[],
  options?: Options
): Query {
  const additionalDirectories = configs.map(config => ({
    path: config.path,
    permissions: config.permissions
  }));

  return query({
    prompt,
    additionalDirectories,
    options: options || { maxTurns: 5 }
  });
}

// Helper to analyze directory access patterns
function analyzeDirectoryAccess(messages: SDKMessage[], configs: DirectoryConfig[]): {
  accessAttempts: Array<{
    directory: string;
    operation: string;
    success: boolean;
    toolUsed: string;
  }>;
  permissionViolations: Array<{
    directory: string;
    operation: string;
    expectedPermission: string;
  }>;
  successfulOperations: number;
  totalAttempts: number;
} {
  const accessAttempts: Array<{
    directory: string;
    operation: string;
    success: boolean;
    toolUsed: string;
  }> = [];
  const permissionViolations: Array<{
    directory: string;
    operation: string;
    expectedPermission: string;
  }> = [];

  const configMap = new Map(configs.map(c => [c.path, c]));

  for (const message of messages) {
    if (message.type === 'assistant' && Array.isArray(message.message.content)) {
      // Find file operations
      const toolUses = message.message.content.filter((c: any) => c.type === 'tool_use');

      toolUses.forEach((tool: any) => {
        if (['Read', 'Write', 'Edit', 'MultiEdit', 'Glob'].includes(tool.name)) {
          const filePath = tool.input.file_path || tool.input.path || tool.input.pattern || '';

          // Determine which configured directory this operation targets
          const targetDir = configs.find(config => filePath.startsWith(config.path));

          if (targetDir) {
            const operation = tool.name === 'Read' || tool.name === 'Glob' ? 'read' : 'write';

            accessAttempts.push({
              directory: targetDir.path,
              operation,
              success: false, // Will be updated when we see the result
              toolUsed: tool.name
            });

            // Check if operation matches permissions
            if ((operation === 'write' && targetDir.permissions === 'read') ||
                (operation === 'read' && targetDir.permissions === 'write')) {
              permissionViolations.push({
                directory: targetDir.path,
                operation,
                expectedPermission: targetDir.permissions
              });
            }
          }
        }
      });
    }

    if (message.type === 'user' && Array.isArray(message.message.content)) {
      // Update success status based on tool results
      const toolResults = message.message.content.filter((c: any) => c.type === 'tool_result');

      toolResults.forEach((result: any, index: number) => {
        if (index < accessAttempts.length) {
          accessAttempts[accessAttempts.length - 1 - index].success = !result.is_error;
        }
      });
    }
  }

  return {
    accessAttempts,
    permissionViolations,
    successfulOperations: accessAttempts.filter(a => a.success).length,
    totalAttempts: accessAttempts.length
  };
}

// Tester Function
async function testAdditionalDirectories(
  testName: string,
  configs: DirectoryConfig[],
  prompts: string[]
): Promise<ExperimentResult & { logs: string; directoryAnalysis: any }> {
  const logger = new ExperimentLogger(`17-additional-directories - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];

  try {
    logger.section('Configuration');
    logger.info('Test', testName);
    logger.info('Directory Configs', configs.map(c => `${c.name}: ${c.path} (${c.permissions})`));
    logger.info('Test Prompts', prompts);

    logger.section('Test Environment Setup');
    const setupResult = await setupTestEnvironment(configs);
    logger.info('Setup Results', {
      createdDirs: setupResult.createdDirs.length,
      createdFiles: setupResult.createdFiles.length,
      errors: setupResult.errors.length
    });

    if (setupResult.errors.length > 0) {
      logger.warning('Setup Errors', setupResult.errors);
    }

    logger.section('Execution with Additional Directories');

    const q = setupAdditionalDirectoriesQuery(prompts[0], configs);
    let promptIndex = 0;

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized with additional directories', {
              sessionId: message.session_id,
              additionalDirs: configs.length
            });
          }
          break;

        case 'assistant':
          const content = message.message.content;

          // Log file operations with directory context
          if (Array.isArray(content)) {
            const toolUses = content.filter((c: any) => c.type === 'tool_use');
            toolUses.forEach((tool: any) => {
              if (['Read', 'Write', 'Edit', 'MultiEdit', 'Glob'].includes(tool.name)) {
                const filePath = tool.input.file_path || tool.input.path || tool.input.pattern || '';
                const targetConfig = configs.find(c => filePath.startsWith(c.path));

                if (targetConfig) {
                  logger.info(`File operation in ${targetConfig.name}`, {
                    tool: tool.name,
                    path: filePath,
                    permissions: targetConfig.permissions
                  });
                } else {
                  logger.info(`File operation outside configured directories`, {
                    tool: tool.name,
                    path: filePath
                  });
                }
              }
            });
          }

          logger.message('assistant', content);
          break;

        case 'user':
          const userContent = message.message.content;

          // Log access results
          if (Array.isArray(userContent)) {
            const toolResults = userContent.filter((c: any) => c.type === 'tool_result');
            toolResults.forEach((result: any) => {
              if (result.is_error) {
                logger.warning('Directory access failed', result.content);
              } else {
                logger.success('Directory access successful');
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

    // Analyze directory access patterns
    const directoryAnalysis = analyzeDirectoryAccess(messages, configs);

    metrics.complete(true);

    logger.section('Directory Access Analysis');
    logger.info('Total Access Attempts', directoryAnalysis.totalAttempts);
    logger.info('Successful Operations', directoryAnalysis.successfulOperations);
    logger.info('Permission Violations', directoryAnalysis.permissionViolations.length);
    logger.info('Success Rate', `${directoryAnalysis.totalAttempts > 0 ? (directoryAnalysis.successfulOperations / directoryAnalysis.totalAttempts * 100).toFixed(1) : 0}%`);

    // Directory usage statistics
    const directoryUsage = configs.map(config => {
      const attempts = directoryAnalysis.accessAttempts.filter(a => a.directory === config.path);
      const successful = attempts.filter(a => a.success);

      return {
        directory: config.name,
        path: config.path,
        permissions: config.permissions,
        attempts: attempts.length,
        successful: successful.length,
        operations: [...new Set(attempts.map(a => a.operation))]
      };
    });

    logger.info('Directory Usage Statistics', directoryUsage);

    logger.complete(true);

    // Cleanup
    await cleanupTestEnvironment(setupResult.createdFiles);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      directoryAnalysis: {
        ...directoryAnalysis,
        directoryUsage,
        setupResult,
        configuredDirectories: configs.length
      }
    };

  } catch (error) {
    const err = error as Error;
    metrics.recordError(err.message);
    metrics.complete(false);
    logger.error('Experiment failed', err);
    logger.complete(false);

    const directoryAnalysis = analyzeDirectoryAccess(messages, configs);

    return {
      success: false,
      messages,
      error: err,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      directoryAnalysis: {
        ...directoryAnalysis,
        directoryUsage: [],
        setupResult: { createdDirs: [], createdFiles: [], errors: [err.message] },
        configuredDirectories: configs.length
      }
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Additional Directories Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: Single additional directory (temp)
  console.log('Test 1: Single additional directory - temp');
  const result1 = await testAdditionalDirectories(
    'Single Directory',
    [directoryConfigs[0]], // temp directory
    [
      'Create a test file in the /tmp directory',
      'Read the contents of files in /tmp',
      'List all files in the /tmp directory'
    ]
  );

  results.push({
    test: 'Single Directory',
    success: result1.success,
    directories: 1,
    accessAttempts: result1.directoryAnalysis.totalAttempts,
    successfulOperations: result1.directoryAnalysis.successfulOperations,
    permissionViolations: result1.directoryAnalysis.permissionViolations.length
  });

  output.addTest('Single Additional Directory', {
    prompt: 'Test single additional directory access',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Multiple directories with different permissions
  console.log('\nTest 2: Multiple directories with different permissions');
  const result2 = await testAdditionalDirectories(
    'Multiple Directories',
    [directoryConfigs[0], directoryConfigs[1], directoryConfigs[2]], // temp, home, documents
    [
      'Read files from the home directory',
      'Create a file in the Documents directory',
      'Perform operations in the /tmp directory',
      'Try to access different directories with various operations'
    ]
  );

  results.push({
    test: 'Multiple Directories',
    success: result2.success,
    directories: 3,
    accessAttempts: result2.directoryAnalysis.totalAttempts,
    successfulOperations: result2.directoryAnalysis.successfulOperations,
    permissionViolations: result2.directoryAnalysis.permissionViolations.length
  });

  output.addTest('Multiple Directories with Different Permissions', {
    prompt: 'Test multiple directories with various permission levels',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Permission boundary testing
  console.log('\nTest 3: Permission boundary testing');
  const result3 = await testAdditionalDirectories(
    'Permission Boundaries',
    [directoryConfigs[1], directoryConfigs[4]], // home (read-only), system_logs (read-only)
    [
      'Try to write a file to the home directory (should fail)',
      'Read files from the home directory (should succeed)',
      'Try to write to system logs (should fail)',
      'Read system log files (should succeed if accessible)'
    ]
  );

  results.push({
    test: 'Permission Boundaries',
    success: result3.success,
    directories: 2,
    accessAttempts: result3.directoryAnalysis.totalAttempts,
    successfulOperations: result3.directoryAnalysis.successfulOperations,
    permissionViolations: result3.directoryAnalysis.permissionViolations.length
  });

  output.addTest('Permission Boundary Testing', {
    prompt: 'Test permission boundaries and violations',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: All configured directories
  console.log('\nTest 4: All configured directories');
  const result4 = await testAdditionalDirectories(
    'All Directories',
    directoryConfigs,
    [
      'Survey all accessible directories',
      'Perform appropriate operations based on permissions',
      'Test comprehensive directory access patterns'
    ]
  );

  results.push({
    test: 'All Directories',
    success: result4.success,
    directories: directoryConfigs.length,
    accessAttempts: result4.directoryAnalysis.totalAttempts,
    successfulOperations: result4.directoryAnalysis.successfulOperations,
    permissionViolations: result4.directoryAnalysis.permissionViolations.length
  });

  output.addTest('All Configured Directories', {
    prompt: 'Test all configured additional directories',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Test 5: Dynamic directory access patterns
  console.log('\nTest 5: Dynamic directory access patterns');
  const result5 = await testAdditionalDirectories(
    'Dynamic Access',
    [directoryConfigs[0], directoryConfigs[3]], // temp and projects
    [
      'Create a project structure in the projects directory',
      'Use temp directory for intermediate processing',
      'Demonstrate complex cross-directory workflows'
    ]
  );

  results.push({
    test: 'Dynamic Access',
    success: result5.success,
    directories: 2,
    accessAttempts: result5.directoryAnalysis.totalAttempts,
    successfulOperations: result5.directoryAnalysis.successfulOperations,
    permissionViolations: result5.directoryAnalysis.permissionViolations.length
  });

  output.addTest('Dynamic Directory Access Patterns', {
    prompt: 'Test dynamic and complex directory access patterns',
    messages: result5.messages,
    metrics: result5.metrics,
    logs: result5.logs
  });

  // Comprehensive directory analysis
  const allDirectoryAnalysis = {
    singleDirectory: result1.directoryAnalysis,
    multipleDirectories: result2.directoryAnalysis,
    permissionBoundaries: result3.directoryAnalysis,
    allDirectories: result4.directoryAnalysis,
    dynamicAccess: result5.directoryAnalysis
  };

  // Aggregate directory statistics
  const totalAttempts = results.reduce((sum, r) => sum + r.accessAttempts, 0);
  const totalSuccessful = results.reduce((sum, r) => sum + r.successfulOperations, 0);
  const totalViolations = results.reduce((sum, r) => sum + r.permissionViolations, 0);

  const directoryEffectiveness = directoryConfigs.map(config => {
    const allUsage = Object.values(allDirectoryAnalysis).flatMap(analysis =>
      analysis.directoryUsage?.filter((usage: any) => usage.path === config.path) || []
    );

    const totalAttempts = allUsage.reduce((sum: number, usage: any) => sum + usage.attempts, 0);
    const totalSuccessful = allUsage.reduce((sum: number, usage: any) => sum + usage.successful, 0);

    return {
      name: config.name,
      path: config.path,
      permissions: config.permissions,
      totalAttempts,
      totalSuccessful,
      successRate: totalAttempts > 0 ? (totalSuccessful / totalAttempts) * 100 : 0
    };
  });

  output.addJSON('Additional Directories Analysis', {
    configurations: directoryConfigs,
    results: allDirectoryAnalysis,
    effectiveness: directoryEffectiveness,
    summary: {
      totalTests: results.length,
      totalDirectories: directoryConfigs.length,
      totalAttempts,
      totalSuccessful,
      totalViolations,
      overallSuccessRate: totalAttempts > 0 ? (totalSuccessful / totalAttempts) * 100 : 0,
      avgAttemptsPerTest: totalAttempts / results.length
    }
  });

  // Add final summary
  output.addSummary(results);

  // Console summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 ADDITIONAL DIRECTORIES EXPERIMENT SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    const successRate = r.accessAttempts > 0 ? (r.successfulOperations / r.accessAttempts * 100).toFixed(1) : '0';
    console.log(`${r.test}: ${r.success ? '✅' : '❌'} (${r.directories} dirs, ${r.successfulOperations}/${r.accessAttempts} ops, ${successRate}% success, ${r.permissionViolations} violations)`);
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