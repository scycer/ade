#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Complete Example
 * Tests: Combined features demonstration using all SDK capabilities
 * Expected: Comprehensive showcase of integrated SDK functionality
 */

// Comprehensive configuration combining all features
interface CompleteConfig {
  name: string;
  description: string;
  features: {
    customPrompt?: string;
    permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';
    allowedTools?: string[];
    disallowedTools?: string[];
    additionalDirectories?: Array<{ path: string; permissions: string }>;
    mcpServers?: Array<{ name: string; transport: any }>;
    executables?: Record<string, any>;
    hooks?: {
      preToolUse?: boolean;
      postToolUse?: boolean;
      customPermissions?: boolean;
    };
  };
  workflow: string[];
}

const completeConfigs: CompleteConfig[] = [
  {
    name: 'Full Development Environment',
    description: 'Complete development setup with all features enabled',
    features: {
      customPrompt: `You are an expert full-stack developer assistant with comprehensive capabilities.

DEVELOPMENT GUIDELINES:
- Follow TypeScript and React best practices
- Implement proper error handling and logging
- Use modern development tools and patterns
- Ensure code quality and performance
- Document all significant changes
- Test functionality thoroughly

SAFETY PROTOCOLS:
- Validate all file operations
- Check permissions before writing
- Backup important files
- Use secure coding practices
- Monitor resource usage

You have access to multiple directories, MCP servers, and development tools.`,
      permissionMode: 'acceptEdits',
      allowedTools: ['Read', 'Write', 'Edit', 'MultiEdit', 'Glob', 'Grep', 'Bash', 'WebFetch'],
      additionalDirectories: [
        { path: '/tmp', permissions: 'full' },
        { path: `${process.env.HOME}/projects`, permissions: 'full' }
      ],
      mcpServers: [
        {
          name: 'filesystem',
          transport: {
            type: 'stdio',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp']
          }
        }
      ],
      executables: {
        node: { path: '/usr/bin/node', args: [] },
        bun: { path: '/usr/local/bin/bun', args: [] }
      },
      hooks: {
        preToolUse: true,
        postToolUse: true,
        customPermissions: true
      }
    },
    workflow: [
      'Create a new TypeScript project structure',
      'Set up development configuration files',
      'Implement a sample React component with tests',
      'Add error handling and logging',
      'Document the project setup',
      'Validate the complete setup works'
    ]
  },
  {
    name: 'Data Analysis Pipeline',
    description: 'Data processing and analysis with security focus',
    features: {
      customPrompt: `You are a data analysis specialist focused on secure data processing.

DATA PROCESSING GUIDELINES:
- Validate all data sources and integrity
- Implement proper data sanitization
- Use appropriate statistical methods
- Document data transformations
- Ensure privacy and security compliance
- Generate comprehensive reports

SECURITY REQUIREMENTS:
- Never access sensitive directories
- Validate file permissions
- Log all data access operations
- Use read-only access where possible`,
      permissionMode: 'default',
      allowedTools: ['Read', 'Grep', 'Glob', 'Write', 'WebFetch'],
      disallowedTools: ['Bash', 'KillShell'],
      additionalDirectories: [
        { path: '/tmp', permissions: 'write' },
        { path: `${process.env.HOME}/data`, permissions: 'read' }
      ],
      hooks: {
        preToolUse: true,
        postToolUse: true,
        customPermissions: true
      }
    },
    workflow: [
      'Analyze available data sources',
      'Validate data quality and structure',
      'Perform statistical analysis',
      'Generate data visualizations',
      'Create comprehensive report',
      'Export results securely'
    ]
  },
  {
    name: 'System Administration',
    description: 'System administration with comprehensive monitoring',
    features: {
      customPrompt: `You are a system administrator with comprehensive monitoring capabilities.

SYSTEM ADMINISTRATION GUIDELINES:
- Monitor system health and performance
- Implement proper logging and alerting
- Follow security best practices
- Document all system changes
- Use automation where appropriate
- Maintain system documentation

OPERATIONAL SECURITY:
- Validate all commands before execution
- Use least privilege principles
- Monitor for suspicious activity
- Backup critical configurations`,
      permissionMode: 'plan',
      allowedTools: ['Read', 'Bash', 'Glob', 'Grep'],
      additionalDirectories: [
        { path: '/var/log', permissions: 'read' },
        { path: '/tmp', permissions: 'full' }
      ],
      executables: {
        node: { path: '/usr/bin/node', args: ['--version'] },
        bun: { path: '/usr/local/bin/bun', args: ['--version'] }
      },
      hooks: {
        preToolUse: true,
        postToolUse: true,
        customPermissions: true
      }
    },
    workflow: [
      'Assess current system status',
      'Check system resources and performance',
      'Review system logs for issues',
      'Create system monitoring plan',
      'Document findings and recommendations',
      'Prepare maintenance schedule'
    ]
  }
];

// Advanced hook implementations for complete example
class CompleteHooksManager {
  private events: Array<{ type: string; timestamp: string; data: any }> = [];
  private metrics: Map<string, any> = new Map();

  createComprehensiveHooks() {
    const preToolUse = (toolName: string, input: any) => {
      const timestamp = new Date().toISOString();
      this.events.push({
        type: 'preToolUse',
        timestamp,
        data: { toolName, input }
      });

      // Advanced logging
      console.log(`🔧 [${timestamp}] PRE-TOOL: ${toolName}`);

      // Security validation
      if (toolName === 'Bash' && input.command) {
        if (input.command.includes('rm -rf') || input.command.includes('sudo')) {
          console.log(`⚠️  SECURITY WARNING: Potentially dangerous command detected`);
        }
      }

      // Performance tracking
      this.metrics.set(`${toolName}-start`, Date.now());

      return input;
    };

    const postToolUse = (toolName: string, input: any, result: any, error?: Error) => {
      const timestamp = new Date().toISOString();
      const startTime = this.metrics.get(`${toolName}-start`);
      const duration = startTime ? Date.now() - startTime : 0;

      this.events.push({
        type: 'postToolUse',
        timestamp,
        data: { toolName, input, result: error ? undefined : result, error: error?.message, duration }
      });

      console.log(`✅ [${timestamp}] POST-TOOL: ${toolName} (${duration}ms)`);

      if (error) {
        console.log(`❌ Error: ${error.message}`);
      } else {
        // Success metrics
        if (toolName === 'Read' && result) {
          console.log(`📄 File read: ${result.length} characters`);
        } else if (toolName === 'Write') {
          console.log(`💾 File written successfully`);
        }
      }

      // Update tool usage statistics
      const toolStats = this.metrics.get('toolStats') || {};
      toolStats[toolName] = (toolStats[toolName] || 0) + 1;
      this.metrics.set('toolStats', toolStats);

      return result;
    };

    const customPermissions = (toolName: string, input: any) => {
      // Advanced permission logic
      if (toolName === 'Write' || toolName === 'Edit') {
        const filePath = input.file_path || input.path;
        if (filePath) {
          // Check for sensitive paths
          const sensitivePaths = ['/etc', '/var/lib', '/root'];
          if (sensitivePaths.some(path => filePath.startsWith(path))) {
            console.log(`🔒 PERMISSION DENIED: Attempt to modify sensitive path: ${filePath}`);
            return false;
          }

          // Check file extensions
          if (filePath.endsWith('.exe') || filePath.endsWith('.sh')) {
            console.log(`⚠️  CAUTION: Modifying executable file: ${filePath}`);
            return true; // Allow but log
          }
        }
      }

      return true; // Allow by default
    };

    return {
      preToolUse,
      postToolUse,
      customPermissions
    };
  }

  getEvents() {
    return [...this.events];
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  clear() {
    this.events = [];
    this.metrics.clear();
  }
}

// SDK Setup Function with complete configuration
function setupCompleteQuery(
  prompt: string,
  config: CompleteConfig,
  hooksManager: CompleteHooksManager,
  options?: Options
): Query {
  const hooks = hooksManager.createComprehensiveHooks();

  const queryConfig: any = {
    prompt,
    options: options || { maxTurns: 10 }
  };

  // Apply all configuration features
  if (config.features.customPrompt) {
    queryConfig.systemPrompt = config.features.customPrompt;
  }

  if (config.features.permissionMode) {
    queryConfig.permissionMode = config.features.permissionMode;
  }

  if (config.features.allowedTools) {
    queryConfig.allowedTools = config.features.allowedTools;
  }

  if (config.features.disallowedTools) {
    queryConfig.disallowedTools = config.features.disallowedTools;
  }

  if (config.features.additionalDirectories) {
    queryConfig.additionalDirectories = config.features.additionalDirectories;
  }

  if (config.features.mcpServers) {
    queryConfig.mcpServers = config.features.mcpServers;
  }

  if (config.features.executables) {
    queryConfig.executables = config.features.executables;
  }

  if (config.features.hooks?.preToolUse) {
    queryConfig.preToolUse = hooks.preToolUse;
  }

  if (config.features.hooks?.postToolUse) {
    queryConfig.postToolUse = hooks.postToolUse;
  }

  if (config.features.hooks?.customPermissions) {
    queryConfig.canUseTool = hooks.customPermissions;
  }

  return query(queryConfig);
}

// Comprehensive analysis function
function analyzeCompleteExecution(
  messages: SDKMessage[],
  hooksManager: CompleteHooksManager,
  config: CompleteConfig
): {
  featureUsage: Record<string, boolean>;
  workflowCompletion: Record<string, boolean>;
  performanceMetrics: any;
  securityEvents: any[];
  overallScore: number;
} {
  const featureUsage = {
    customPrompt: !!config.features.customPrompt,
    permissionControl: !!config.features.permissionMode,
    toolFiltering: !!(config.features.allowedTools || config.features.disallowedTools),
    additionalDirectories: !!config.features.additionalDirectories,
    mcpServers: !!config.features.mcpServers,
    executables: !!config.features.executables,
    hooks: !!config.features.hooks
  };

  const workflowCompletion = config.workflow.reduce((acc, step, index) => {
    // Simple heuristic: check if the workflow step was addressed
    const stepCompleted = messages.some(msg => {
      if (msg.type === 'assistant') {
        const content = Array.isArray(msg.message.content)
          ? msg.message.content.map((c: any) => c.text || '').join(' ')
          : msg.message.content || '';

        const stepKeywords = step.toLowerCase().split(' ');
        return stepKeywords.some(keyword => content.toLowerCase().includes(keyword));
      }
      return false;
    });

    acc[`step_${index + 1}_${step.slice(0, 20)}...`] = stepCompleted;
    return acc;
  }, {} as Record<string, boolean>);

  const events = hooksManager.getEvents();
  const metrics = hooksManager.getMetrics();

  const securityEvents = events.filter(event =>
    event.data?.toolName === 'Bash' ||
    event.type.includes('security') ||
    (event.data?.error && event.data.error.includes('permission'))
  );

  const performanceMetrics = {
    totalEvents: events.length,
    toolUsage: metrics.toolStats || {},
    avgToolDuration: events
      .filter(e => e.data?.duration)
      .reduce((sum, e) => sum + e.data.duration, 0) /
      events.filter(e => e.data?.duration).length || 0
  };

  // Calculate overall score
  const featureScore = Object.values(featureUsage).filter(Boolean).length / Object.keys(featureUsage).length;
  const workflowScore = Object.values(workflowCompletion).filter(Boolean).length / Object.keys(workflowCompletion).length;
  const overallScore = (featureScore + workflowScore) / 2 * 100;

  return {
    featureUsage,
    workflowCompletion,
    performanceMetrics,
    securityEvents,
    overallScore
  };
}

// Tester Function
async function testCompleteExample(
  config: CompleteConfig
): Promise<ExperimentResult & { logs: string; completeAnalysis: any }> {
  const logger = new ExperimentLogger(`20-complete-example - ${config.name}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];
  const hooksManager = new CompleteHooksManager();

  try {
    logger.section('Configuration');
    logger.info('Complete Config', config.name);
    logger.info('Description', config.description);
    logger.info('Features Enabled', Object.keys(config.features).filter(key => config.features[key]));
    logger.info('Workflow Steps', config.workflow.length);

    logger.section('Feature Configuration Details');
    Object.entries(config.features).forEach(([feature, value]) => {
      if (value) {
        logger.info(feature, typeof value === 'object' ? JSON.stringify(value, null, 2) : value);
      }
    });

    logger.section('Complete Example Execution');

    const q = setupCompleteQuery(config.workflow[0], config, hooksManager);
    let workflowIndex = 0;

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('Complete system initialized', {
              sessionId: message.session_id,
              featuresEnabled: Object.keys(config.features).length
            });
          }
          break;

        case 'assistant':
          const content = message.message.content;
          logger.message('assistant', content);

          // Check for workflow progression
          const currentStep = config.workflow[workflowIndex];
          const responseText = Array.isArray(content)
            ? content.map((c: any) => c.text || '').join(' ')
            : content || '';

          if (currentStep && responseText.toLowerCase().includes(currentStep.toLowerCase().split(' ')[0])) {
            logger.success(`Workflow step ${workflowIndex + 1} addressed: ${currentStep}`);
          }
          break;

        case 'user':
          const userContent = message.message.content;
          logger.message('user', userContent);

          // Progress to next workflow step
          if (workflowIndex < config.workflow.length - 1) {
            workflowIndex++;
            const nextStep = config.workflow[workflowIndex];
            logger.info(`Progressing to workflow step ${workflowIndex + 1}: ${nextStep}`);
            q.input(nextStep);
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

    // Comprehensive analysis
    const completeAnalysis = analyzeCompleteExecution(messages, hooksManager, config);

    metrics.complete(true);

    logger.section('Complete Example Analysis');
    logger.info('Feature Usage', completeAnalysis.featureUsage);
    logger.info('Workflow Completion', completeAnalysis.workflowCompletion);
    logger.info('Performance Metrics', completeAnalysis.performanceMetrics);
    logger.info('Security Events', completeAnalysis.securityEvents.length);
    logger.info('Overall Score', `${completeAnalysis.overallScore.toFixed(1)}%`);

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      completeAnalysis: {
        ...completeAnalysis,
        config,
        hookEvents: hooksManager.getEvents(),
        hookMetrics: hooksManager.getMetrics()
      }
    };

  } catch (error) {
    const err = error as Error;
    metrics.recordError(err.message);
    metrics.complete(false);
    logger.error('Experiment failed', err);
    logger.complete(false);

    const completeAnalysis = analyzeCompleteExecution(messages, hooksManager, config);

    return {
      success: false,
      messages,
      error: err,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      completeAnalysis: {
        ...completeAnalysis,
        config,
        hookEvents: hooksManager.getEvents(),
        hookMetrics: hooksManager.getMetrics()
      }
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Complete Example Experiment\n');
  console.log('🎯 This experiment demonstrates all SDK features working together\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test each complete configuration
  for (let i = 0; i < completeConfigs.length; i++) {
    const config = completeConfigs[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔧 Testing Complete Configuration ${i + 1}: ${config.name}`);
    console.log(`${'='.repeat(60)}`);

    const result = await testCompleteExample(config);

    results.push({
      test: config.name,
      success: result.success,
      overallScore: result.completeAnalysis.overallScore,
      featuresUsed: Object.values(result.completeAnalysis.featureUsage).filter(Boolean).length,
      workflowCompleted: Object.values(result.completeAnalysis.workflowCompletion).filter(Boolean).length,
      securityEvents: result.completeAnalysis.securityEvents.length,
      performanceScore: result.completeAnalysis.performanceMetrics.totalEvents
    });

    output.addTest(`Complete Example: ${config.name}`, {
      prompt: `Complete SDK demonstration: ${config.description}`,
      messages: result.messages,
      metrics: result.metrics,
      logs: result.logs
    });

    // Progress indicator
    console.log(`\n✅ Configuration ${i + 1}/${completeConfigs.length} completed`);
    console.log(`📊 Score: ${result.completeAnalysis.overallScore.toFixed(1)}%`);
  }

  // Comprehensive analysis across all configurations
  const allAnalysis = results.map(r => r);
  const avgOverallScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
  const totalFeaturesUsed = results.reduce((sum, r) => sum + r.featuresUsed, 0);
  const totalWorkflowSteps = results.reduce((sum, r) => sum + r.workflowCompleted, 0);

  output.addJSON('Complete SDK Analysis', {
    configurations: completeConfigs.map(config => ({
      name: config.name,
      description: config.description,
      features: Object.keys(config.features).filter(key => config.features[key]),
      workflowSteps: config.workflow.length
    })),
    results: allAnalysis,
    overallMetrics: {
      totalConfigurations: completeConfigs.length,
      avgOverallScore,
      totalFeaturesUsed,
      totalWorkflowSteps,
      sdkCapabilities: [
        'Custom System Prompts',
        'Permission Modes',
        'Tool Filtering',
        'Additional Directories',
        'MCP Server Integration',
        'Custom Executables',
        'Advanced Hooks',
        'Error Handling',
        'Performance Monitoring',
        'Security Validation'
      ]
    },
    summary: {
      sdkMaturity: avgOverallScore > 80 ? 'Excellent' : avgOverallScore > 60 ? 'Good' : 'Developing',
      recommendedConfig: results.sort((a, b) => b.overallScore - a.overallScore)[0]?.test || 'None',
      keyStrengths: [
        'Comprehensive feature integration',
        'Flexible configuration options',
        'Robust error handling',
        'Advanced security controls'
      ],
      improvementAreas: results.filter(r => r.overallScore < 70).map(r => r.test)
    }
  });

  // Add final summary
  output.addSummary(results);

  // Console summary
  console.log('\n' + '='.repeat(80));
  console.log('🎉 COMPLETE SDK EXPERIMENT SUMMARY');
  console.log('='.repeat(80));
  console.log(`📊 Average Score: ${avgOverallScore.toFixed(1)}%`);
  console.log(`🔧 Total Features Used: ${totalFeaturesUsed}`);
  console.log(`📋 Total Workflow Steps: ${totalWorkflowSteps}`);
  console.log('='.repeat(80));

  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    const score = r.overallScore.toFixed(1);
    console.log(`${status} ${r.test}: ${score}% (${r.featuresUsed} features, ${r.workflowCompleted} steps, ${r.securityEvents} security events)`);
  });

  console.log('='.repeat(80));
  console.log(`🏆 Best Configuration: ${results.sort((a, b) => b.overallScore - a.overallScore)[0]?.test}`);
  console.log(`📈 SDK Maturity: ${avgOverallScore > 80 ? 'Excellent' : avgOverallScore > 60 ? 'Good' : 'Developing'}`);
  console.log('='.repeat(80));

  // Save output to file
  const outputPath = output.save();
  console.log(`\n💾 Complete analysis saved to: ${outputPath}`);
  console.log('\n🎯 Claude Code SDK Experiment Series Complete!');
}

// Run if executed directly
if (import.meta.main) {
  main().catch(console.error);
}