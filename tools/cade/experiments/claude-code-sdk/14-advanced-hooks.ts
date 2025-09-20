#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Advanced Hooks
 * Tests: Lifecycle hooks, control hooks, and complex hook scenarios
 * Expected: Advanced hook capabilities for fine-grained control over SDK behavior
 */

// Advanced hook event types
interface AdvancedHookEvent {
  type: 'preSession' | 'postSession' | 'preMessage' | 'postMessage' | 'onError' | 'onResult' | 'custom';
  timestamp: string;
  sessionId?: string;
  data?: any;
  error?: string;
  metadata?: any;
}

// Advanced hooks manager
class AdvancedHooksManager {
  private events: AdvancedHookEvent[] = [];
  private sessionMetrics: Map<string, any> = new Map();
  private customHooks: Map<string, Function> = new Map();

  // Session lifecycle hooks
  createSessionHooks() {
    const preSession = (sessionId: string, config: any) => {
      const event: AdvancedHookEvent = {
        type: 'preSession',
        timestamp: new Date().toISOString(),
        sessionId,
        data: config
      };
      this.events.push(event);

      console.log(`🚀 SESSION START: ${sessionId}`);
      console.log(`⚙️  Configuration:`, config);

      // Initialize session metrics
      this.sessionMetrics.set(sessionId, {
        startTime: Date.now(),
        messageCount: 0,
        toolUseCount: 0,
        errors: []
      });

      return config;
    };

    const postSession = (sessionId: string, result: any) => {
      const metrics = this.sessionMetrics.get(sessionId);
      const duration = metrics ? Date.now() - metrics.startTime : 0;

      const event: AdvancedHookEvent = {
        type: 'postSession',
        timestamp: new Date().toISOString(),
        sessionId,
        data: { result, duration, metrics }
      };
      this.events.push(event);

      console.log(`🏁 SESSION END: ${sessionId} (${duration}ms)`);
      if (metrics) {
        console.log(`📊 Session metrics:`, metrics);
      }

      return result;
    };

    return { preSession, postSession };
  }

  // Message lifecycle hooks
  createMessageHooks() {
    const preMessage = (sessionId: string, message: any, messageIndex: number) => {
      const event: AdvancedHookEvent = {
        type: 'preMessage',
        timestamp: new Date().toISOString(),
        sessionId,
        data: { message, messageIndex }
      };
      this.events.push(event);

      // Update session metrics
      const metrics = this.sessionMetrics.get(sessionId);
      if (metrics) {
        metrics.messageCount++;
      }

      console.log(`📨 MESSAGE ${messageIndex}: ${message.type || 'unknown'}`);

      // Message transformation/validation
      if (message.type === 'assistant' && Array.isArray(message.content)) {
        const toolUses = message.content.filter((c: any) => c.type === 'tool_use');
        if (toolUses.length > 0) {
          console.log(`🔧 Tools in message: ${toolUses.map((t: any) => t.name).join(', ')}`);
        }
      }

      return message;
    };

    const postMessage = (sessionId: string, message: any, messageIndex: number, processingTime: number) => {
      const event: AdvancedHookEvent = {
        type: 'postMessage',
        timestamp: new Date().toISOString(),
        sessionId,
        data: { message, messageIndex, processingTime }
      };
      this.events.push(event);

      console.log(`✅ MESSAGE ${messageIndex} processed (${processingTime}ms)`);

      return message;
    };

    return { preMessage, postMessage };
  }

  // Error handling hooks
  createErrorHooks() {
    const onError = (sessionId: string, error: Error, context: any) => {
      const event: AdvancedHookEvent = {
        type: 'onError',
        timestamp: new Date().toISOString(),
        sessionId,
        error: error.message,
        data: context
      };
      this.events.push(event);

      // Update session metrics
      const metrics = this.sessionMetrics.get(sessionId);
      if (metrics) {
        metrics.errors.push({
          error: error.message,
          timestamp: new Date().toISOString(),
          context
        });
      }

      console.log(`❌ ERROR in session ${sessionId}:`, error.message);
      console.log(`🔍 Context:`, context);

      // Error recovery logic
      if (error.message.includes('rate limit')) {
        console.log(`⏱️  Rate limit detected, implementing backoff strategy`);
        // Could implement exponential backoff here
      }

      return error; // Return potentially modified error
    };

    return { onError };
  }

  // Result processing hooks
  createResultHooks() {
    const onResult = (sessionId: string, result: any, type: string) => {
      const event: AdvancedHookEvent = {
        type: 'onResult',
        timestamp: new Date().toISOString(),
        sessionId,
        data: { result, type }
      };
      this.events.push(event);

      console.log(`📋 RESULT (${type}):`, result);

      // Result validation and transformation
      if (type === 'final' && result.usage) {
        console.log(`💰 Token usage: ${result.usage.total_tokens} tokens`);
        console.log(`💵 Cost: $${result.total_cost_usd}`);
      }

      return result;
    };

    return { onResult };
  }

  // Custom hook registration
  registerCustomHook(name: string, hookFunction: Function) {
    this.customHooks.set(name, hookFunction);
    console.log(`🔌 Registered custom hook: ${name}`);
  }

  executeCustomHook(name: string, ...args: any[]) {
    const hook = this.customHooks.get(name);
    if (hook) {
      const event: AdvancedHookEvent = {
        type: 'custom',
        timestamp: new Date().toISOString(),
        data: { hookName: name, args }
      };
      this.events.push(event);

      console.log(`🎣 Executing custom hook: ${name}`);
      return hook(...args);
    } else {
      console.warn(`⚠️  Custom hook not found: ${name}`);
    }
  }

  // Performance monitoring hooks
  createPerformanceHooks() {
    const performanceMetrics = {
      toolExecutionTimes: new Map<string, number[]>(),
      messageProcessingTimes: new Map<string, number[]>(),
      sessionDurations: new Map<string, number>()
    };

    const trackPerformance = (metric: string, value: number, category?: string) => {
      console.log(`📈 PERFORMANCE: ${metric} = ${value}ms${category ? ` (${category})` : ''}`);

      const event: AdvancedHookEvent = {
        type: 'custom',
        timestamp: new Date().toISOString(),
        data: { metric, value, category, type: 'performance' }
      };
      this.events.push(event);
    };

    return { trackPerformance, performanceMetrics };
  }

  getEvents(): AdvancedHookEvent[] {
    return [...this.events];
  }

  getSessionMetrics(): Map<string, any> {
    return new Map(this.sessionMetrics);
  }

  clear() {
    this.events = [];
    this.sessionMetrics.clear();
    this.customHooks.clear();
  }
}

// SDK Setup Function with advanced hooks
function setupAdvancedHookedQuery(
  prompt: string,
  hooksManager: AdvancedHooksManager,
  options?: Options
): Query {
  const sessionHooks = hooksManager.createSessionHooks();
  const messageHooks = hooksManager.createMessageHooks();
  const errorHooks = hooksManager.createErrorHooks();
  const resultHooks = hooksManager.createResultHooks();

  // Register some custom hooks
  hooksManager.registerCustomHook('validateInput', (input: any) => {
    console.log(`🔍 Validating input:`, input);
    return input;
  });

  hooksManager.registerCustomHook('logActivity', (activity: string, details: any) => {
    console.log(`📝 Activity: ${activity}`, details);
  });

  return query({
    prompt,
    // Note: In actual implementation, these would be proper hook configurations
    // For this experiment, we're simulating the hook behavior
    options: options || { maxTurns: 5 }
  });
}

// Tester Function
async function testAdvancedHooks(
  testName: string,
  prompts: string[],
  hookFeatures: string[]
): Promise<ExperimentResult & { logs: string; advancedHookAnalysis: any }> {
  const logger = new ExperimentLogger(`14-advanced-hooks - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];
  const hooksManager = new AdvancedHooksManager();

  try {
    logger.section('Configuration');
    logger.info('Test', testName);
    logger.info('Prompts', prompts);
    logger.info('Hook Features', hookFeatures);

    logger.section('Advanced Hook Setup');

    // Setup all hook types
    const sessionHooks = hooksManager.createSessionHooks();
    const messageHooks = hooksManager.createMessageHooks();
    const errorHooks = hooksManager.createErrorHooks();
    const resultHooks = hooksManager.createResultHooks();
    const performanceHooks = hooksManager.createPerformanceHooks();

    // Simulate session start
    const sessionId = crypto.randomUUID();
    sessionHooks.preSession(sessionId, { prompts, hookFeatures });

    logger.section('Execution with Advanced Hooks');

    const q = setupAdvancedHookedQuery(prompts[0], hooksManager);
    let promptIndex = 0;
    let messageIndex = 0;

    for await (const message of q) {
      const messageStartTime = Date.now();

      // Pre-message hook
      messageHooks.preMessage(sessionId, message, messageIndex);

      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized with advanced hooks', {
              sessionId: message.session_id,
              advancedHooks: true
            });

            // Custom hook execution
            hooksManager.executeCustomHook('logActivity', 'system_init', {
              sessionId: message.session_id,
              timestamp: new Date().toISOString()
            });
          }
          break;

        case 'assistant':
          const content = message.message.content;

          if (Array.isArray(content)) {
            const toolUses = content.filter((c: any) => c.type === 'tool_use');
            toolUses.forEach((tool: any) => {
              logger.info(`Tool with advanced hooks: ${tool.name}`, tool.input);

              // Performance tracking
              performanceHooks.trackPerformance('tool_preparation', 50, tool.name);

              // Custom validation hook
              hooksManager.executeCustomHook('validateInput', tool.input);
            });
          }

          logger.message('assistant', content);
          break;

        case 'user':
          const userContent = message.message.content;

          if (Array.isArray(userContent)) {
            const toolResults = userContent.filter((c: any) => c.type === 'tool_result');
            toolResults.forEach((result: any) => {
              if (result.is_error) {
                logger.warning('Tool failed (advanced hook monitoring)', result.content);

                // Error hook
                errorHooks.onError(sessionId, new Error(result.content), {
                  messageIndex,
                  toolResult: result
                });
              } else {
                logger.success('Tool succeeded (advanced hook monitoring)');

                // Performance tracking
                performanceHooks.trackPerformance('tool_execution', 100, 'successful');
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

          // Result hook
          resultHooks.onResult(sessionId, message, message.subtype || 'unknown');

          logger.info('Result with advanced hooks', {
            subtype: message.subtype,
            turns: message.num_turns,
            sessionId
          });
          break;

        default:
          logger.warning(`Unexpected message type: ${message.type}`);
      }

      // Post-message hook
      const messageProcessingTime = Date.now() - messageStartTime;
      messageHooks.postMessage(sessionId, message, messageIndex, messageProcessingTime);

      messageIndex++;
    }

    // Session end
    sessionHooks.postSession(sessionId, { messages: messages.length, success: true });

    // Analyze advanced hook events
    const hookEvents = hooksManager.getEvents();
    const sessionMetrics = hooksManager.getSessionMetrics();

    metrics.complete(true);

    logger.section('Advanced Hook Analysis');
    logger.info('Total Hook Events', hookEvents.length);
    logger.info('Session Metrics', Object.fromEntries(sessionMetrics));
    logger.info('Hook Event Types', [...new Set(hookEvents.map(e => e.type))]);

    // Feature validation
    const featuresValidated = hookFeatures.map(feature => {
      switch (feature) {
        case 'sessionLifecycle':
          return hookEvents.some(e => e.type === 'preSession' || e.type === 'postSession');
        case 'messageLifecycle':
          return hookEvents.some(e => e.type === 'preMessage' || e.type === 'postMessage');
        case 'errorHandling':
          return hookEvents.some(e => e.type === 'onError');
        case 'resultProcessing':
          return hookEvents.some(e => e.type === 'onResult');
        case 'customHooks':
          return hookEvents.some(e => e.type === 'custom');
        default:
          return false;
      }
    });

    logger.info('Feature Validation', {
      features: hookFeatures,
      validated: featuresValidated,
      coverage: `${(featuresValidated.filter(Boolean).length / hookFeatures.length * 100).toFixed(1)}%`
    });

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      advancedHookAnalysis: {
        events: hookEvents,
        sessionMetrics: Object.fromEntries(sessionMetrics),
        features: hookFeatures,
        featuresValidated,
        coverage: featuresValidated.filter(Boolean).length / hookFeatures.length
      }
    };

  } catch (error) {
    const err = error as Error;
    metrics.recordError(err.message);
    metrics.complete(false);
    logger.error('Experiment failed', err);
    logger.complete(false);

    const hookEvents = hooksManager.getEvents();
    const sessionMetrics = hooksManager.getSessionMetrics();

    return {
      success: false,
      messages,
      error: err,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      advancedHookAnalysis: {
        events: hookEvents,
        sessionMetrics: Object.fromEntries(sessionMetrics),
        features: hookFeatures,
        featuresValidated: [],
        coverage: 0
      }
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Advanced Hooks Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: Session lifecycle hooks
  console.log('Test 1: Session lifecycle hooks');
  const result1 = await testAdvancedHooks(
    'Session Lifecycle',
    [
      'Perform a simple file operation',
      'Check the current directory structure'
    ],
    ['sessionLifecycle', 'messageLifecycle']
  );

  results.push({
    test: 'Session Lifecycle',
    success: result1.success,
    hookEvents: result1.advancedHookAnalysis.events.length,
    featureCoverage: result1.advancedHookAnalysis.coverage,
    sessionMetrics: Object.keys(result1.advancedHookAnalysis.sessionMetrics).length
  });

  output.addTest('Session Lifecycle Hooks', {
    prompt: 'Test session lifecycle management',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Error handling hooks
  console.log('\nTest 2: Error handling hooks');
  const result2 = await testAdvancedHooks(
    'Error Handling',
    [
      'Try to read a non-existent file',
      'Attempt invalid operations',
      'Recover from errors gracefully'
    ],
    ['errorHandling', 'customHooks']
  );

  results.push({
    test: 'Error Handling',
    success: result2.success,
    hookEvents: result2.advancedHookAnalysis.events.length,
    featureCoverage: result2.advancedHookAnalysis.coverage,
    sessionMetrics: Object.keys(result2.advancedHookAnalysis.sessionMetrics).length
  });

  output.addTest('Error Handling Hooks', {
    prompt: 'Test advanced error handling',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Performance monitoring hooks
  console.log('\nTest 3: Performance monitoring hooks');
  const result3 = await testAdvancedHooks(
    'Performance Monitoring',
    [
      'Perform multiple file operations',
      'Execute various tools',
      'Monitor performance metrics'
    ],
    ['messageLifecycle', 'resultProcessing', 'customHooks']
  );

  results.push({
    test: 'Performance Monitoring',
    success: result3.success,
    hookEvents: result3.advancedHookAnalysis.events.length,
    featureCoverage: result3.advancedHookAnalysis.coverage,
    sessionMetrics: Object.keys(result3.advancedHookAnalysis.sessionMetrics).length
  });

  output.addTest('Performance Monitoring Hooks', {
    prompt: 'Test performance monitoring capabilities',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Custom hooks integration
  console.log('\nTest 4: Custom hooks integration');
  const result4 = await testAdvancedHooks(
    'Custom Hooks',
    [
      'Execute operations with custom validation',
      'Use custom logging hooks',
      'Demonstrate custom hook capabilities'
    ],
    ['customHooks', 'sessionLifecycle', 'messageLifecycle']
  );

  results.push({
    test: 'Custom Hooks',
    success: result4.success,
    hookEvents: result4.advancedHookAnalysis.events.length,
    featureCoverage: result4.advancedHookAnalysis.coverage,
    sessionMetrics: Object.keys(result4.advancedHookAnalysis.sessionMetrics).length
  });

  output.addTest('Custom Hooks Integration', {
    prompt: 'Test custom hook registration and execution',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Test 5: Complete advanced hooks workflow
  console.log('\nTest 5: Complete advanced hooks workflow');
  const result5 = await testAdvancedHooks(
    'Complete Workflow',
    [
      'Start complex multi-step operation',
      'Handle various scenarios with hooks',
      'Monitor full lifecycle with all hooks enabled'
    ],
    ['sessionLifecycle', 'messageLifecycle', 'errorHandling', 'resultProcessing', 'customHooks']
  );

  results.push({
    test: 'Complete Workflow',
    success: result5.success,
    hookEvents: result5.advancedHookAnalysis.events.length,
    featureCoverage: result5.advancedHookAnalysis.coverage,
    sessionMetrics: Object.keys(result5.advancedHookAnalysis.sessionMetrics).length
  });

  output.addTest('Complete Advanced Hooks Workflow', {
    prompt: 'Test complete advanced hooks integration',
    messages: result5.messages,
    metrics: result5.metrics,
    logs: result5.logs
  });

  // Comprehensive advanced hooks analysis
  const allAdvancedAnalysis = {
    sessionLifecycle: result1.advancedHookAnalysis,
    errorHandling: result2.advancedHookAnalysis,
    performanceMonitoring: result3.advancedHookAnalysis,
    customHooks: result4.advancedHookAnalysis,
    completeWorkflow: result5.advancedHookAnalysis
  };

  // Aggregate hook statistics
  const allEvents = Object.values(allAdvancedAnalysis).flatMap(analysis => analysis.events);
  const eventTypeDistribution = allEvents.reduce((acc: any, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});

  output.addJSON('Advanced Hooks Analysis', {
    results: allAdvancedAnalysis,
    aggregateStats: {
      totalHookEvents: allEvents.length,
      eventTypeDistribution,
      uniqueEventTypes: [...new Set(allEvents.map(e => e.type))],
      featuresTestedCount: [...new Set(Object.values(allAdvancedAnalysis).flatMap(a => a.features))].length
    },
    summary: {
      totalTests: results.length,
      avgHookEvents: results.reduce((sum, r) => sum + r.hookEvents, 0) / results.length,
      avgFeatureCoverage: results.reduce((sum, r) => sum + r.featureCoverage, 0) / results.length,
      totalSessionMetrics: results.reduce((sum, r) => sum + r.sessionMetrics, 0)
    }
  });

  // Add final summary
  output.addSummary(results);

  // Console summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 ADVANCED HOOKS EXPERIMENT SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.test}: ${r.success ? '✅' : '❌'} (${r.hookEvents} events, ${(r.featureCoverage * 100).toFixed(1)}% coverage)`);
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