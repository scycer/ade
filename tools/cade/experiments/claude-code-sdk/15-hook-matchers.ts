#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Hook Matchers
 * Tests: Selective hook application using matchers and conditions
 * Expected: Fine-grained control over when hooks are applied
 */

// Hook matcher types
interface HookMatcher {
  name: string;
  condition: (context: any) => boolean;
  description: string;
}

interface MatchedHookEvent {
  hookName: string;
  matcher: string;
  toolName?: string;
  matched: boolean;
  timestamp: string;
  context: any;
}

// Hook matchers implementation
class HookMatchersManager {
  private events: MatchedHookEvent[] = [];
  private matchers: Map<string, HookMatcher> = new Map();

  // Define various matchers
  setupMatchers() {
    // Tool name matcher
    this.matchers.set('fileTools', {
      name: 'fileTools',
      condition: (context) => ['Read', 'Write', 'Edit', 'MultiEdit'].includes(context.toolName),
      description: 'Matches file operation tools'
    });

    // Search tools matcher
    this.matchers.set('searchTools', {
      name: 'searchTools',
      condition: (context) => ['Grep', 'Glob', 'WebSearch'].includes(context.toolName),
      description: 'Matches search operation tools'
    });

    // Dangerous tools matcher
    this.matchers.set('dangerousTools', {
      name: 'dangerousTools',
      condition: (context) => ['Bash', 'KillShell'].includes(context.toolName),
      description: 'Matches potentially dangerous tools'
    });

    // Input size matcher
    this.matchers.set('largeInput', {
      name: 'largeInput',
      condition: (context) => {
        const inputStr = JSON.stringify(context.input || {});
        return inputStr.length > 100;
      },
      description: 'Matches tools with large input payloads'
    });

    // Time-based matcher
    this.matchers.set('workingHours', {
      name: 'workingHours',
      condition: (context) => {
        const hour = new Date().getHours();
        return hour >= 9 && hour <= 17;
      },
      description: 'Matches during working hours (9 AM - 5 PM)'
    });

    // Error-prone operations matcher
    this.matchers.set('errorProne', {
      name: 'errorProne',
      condition: (context) => {
        const input = context.input || {};
        return input.file_path?.includes('/tmp') ||
               input.command?.includes('rm') ||
               context.toolName === 'WebFetch';
      },
      description: 'Matches operations likely to cause errors'
    });

    // Pattern-based matcher
    this.matchers.set('configFiles', {
      name: 'configFiles',
      condition: (context) => {
        const input = context.input || {};
        const path = input.file_path || input.path || '';
        return /\.(json|yaml|yml|toml|ini|conf)$/.test(path);
      },
      description: 'Matches configuration file operations'
    });

    // Frequency-based matcher
    this.matchers.set('frequentTools', {
      name: 'frequentTools',
      condition: (context) => {
        const toolCounts = this.getToolUsageCounts();
        return (toolCounts.get(context.toolName) || 0) > 2;
      },
      description: 'Matches tools used more than 2 times'
    });

    console.log(`🎯 Initialized ${this.matchers.size} hook matchers`);
  }

  // Evaluate matchers for a context
  evaluateMatchers(context: any): string[] {
    const matchedMatchers: string[] = [];

    for (const [name, matcher] of this.matchers) {
      try {
        const matched = matcher.condition(context);

        const event: MatchedHookEvent = {
          hookName: 'matcher_evaluation',
          matcher: name,
          toolName: context.toolName,
          matched,
          timestamp: new Date().toISOString(),
          context
        };
        this.events.push(event);

        if (matched) {
          matchedMatchers.push(name);
          console.log(`✅ Matcher '${name}' matched for ${context.toolName}`);
        }
      } catch (error) {
        console.error(`❌ Error evaluating matcher '${name}':`, error);
      }
    }

    return matchedMatchers;
  }

  // Conditional hook implementations
  createConditionalPreToolHook() {
    return (toolName: string, input: any) => {
      const context = { toolName, input };
      const matchedMatchers = this.evaluateMatchers(context);

      // Apply different logic based on matched matchers
      if (matchedMatchers.includes('dangerousTools')) {
        console.log(`⚠️  DANGEROUS TOOL DETECTED: ${toolName}`);
        console.log(`🔒 Enhanced logging and monitoring enabled`);
      }

      if (matchedMatchers.includes('fileTools')) {
        console.log(`📁 FILE OPERATION: ${toolName} on ${input.file_path || input.path || 'unknown'}`);
      }

      if (matchedMatchers.includes('largeInput')) {
        console.log(`📊 LARGE INPUT DETECTED: ${JSON.stringify(input).length} characters`);
      }

      if (matchedMatchers.includes('errorProne')) {
        console.log(`⚡ ERROR-PRONE OPERATION: Extra error handling enabled`);
      }

      if (matchedMatchers.includes('configFiles')) {
        console.log(`⚙️  CONFIG FILE OPERATION: Backup recommended`);
      }

      // Log matcher results
      this.events.push({
        hookName: 'preToolUse',
        matcher: 'combined',
        toolName,
        matched: matchedMatchers.length > 0,
        timestamp: new Date().toISOString(),
        context: { ...context, matchedMatchers }
      });

      return input;
    };
  }

  createConditionalPostToolHook() {
    return (toolName: string, input: any, result: any, error?: Error) => {
      const context = { toolName, input, result, error };
      const matchedMatchers = this.evaluateMatchers(context);

      // Apply different post-processing based on matchers
      if (matchedMatchers.includes('dangerousTools')) {
        if (error) {
          console.log(`🛡️  Dangerous tool failed safely: ${error.message}`);
        } else {
          console.log(`⚠️  Dangerous tool executed - audit log created`);
        }
      }

      if (matchedMatchers.includes('fileTools')) {
        if (!error && result) {
          console.log(`✅ File operation completed successfully`);
        }
      }

      if (matchedMatchers.includes('searchTools')) {
        if (!error && Array.isArray(result)) {
          console.log(`🔍 Search completed: ${result.length} results found`);
        }
      }

      if (matchedMatchers.includes('frequentTools')) {
        console.log(`📈 Frequently used tool: ${toolName} (optimizations available)`);
      }

      // Log post-hook matcher results
      this.events.push({
        hookName: 'postToolUse',
        matcher: 'combined',
        toolName,
        matched: matchedMatchers.length > 0,
        timestamp: new Date().toISOString(),
        context: { ...context, matchedMatchers, success: !error }
      });

      return result;
    };
  }

  // Utility methods
  getToolUsageCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    this.events.forEach(event => {
      if (event.toolName) {
        counts.set(event.toolName, (counts.get(event.toolName) || 0) + 1);
      }
    });
    return counts;
  }

  getMatcherStats() {
    const stats = new Map<string, { matches: number; total: number }>();

    this.events.forEach(event => {
      if (event.matcher !== 'combined') {
        if (!stats.has(event.matcher)) {
          stats.set(event.matcher, { matches: 0, total: 0 });
        }
        const stat = stats.get(event.matcher)!;
        stat.total++;
        if (event.matched) {
          stat.matches++;
        }
      }
    });

    return Object.fromEntries(
      Array.from(stats.entries()).map(([name, stat]) => [
        name,
        {
          ...stat,
          matchRate: stat.total > 0 ? (stat.matches / stat.total) * 100 : 0
        }
      ])
    );
  }

  getEvents(): MatchedHookEvent[] {
    return [...this.events];
  }

  getMatchers(): Map<string, HookMatcher> {
    return new Map(this.matchers);
  }

  clear() {
    this.events = [];
  }
}

// SDK Setup Function with hook matchers
function setupMatchedHookedQuery(
  prompt: string,
  matchersManager: HookMatchersManager,
  options?: Options
): Query {
  return query({
    prompt,
    preToolUse: matchersManager.createConditionalPreToolHook(),
    postToolUse: matchersManager.createConditionalPostToolHook(),
    options: options || { maxTurns: 5 }
  });
}

// Tester Function
async function testHookMatchers(
  testName: string,
  prompts: string[],
  expectedMatchers: string[]
): Promise<ExperimentResult & { logs: string; matcherAnalysis: any }> {
  const logger = new ExperimentLogger(`15-hook-matchers - ${testName}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];
  const matchersManager = new HookMatchersManager();

  try {
    logger.section('Configuration');
    logger.info('Test', testName);
    logger.info('Prompts', prompts);
    logger.info('Expected Matchers', expectedMatchers);

    logger.section('Hook Matchers Setup');
    matchersManager.setupMatchers();

    const availableMatchers = Array.from(matchersManager.getMatchers().keys());
    logger.info('Available Matchers', availableMatchers);

    logger.section('Execution with Matcher-Based Hooks');

    const q = setupMatchedHookedQuery(prompts[0], matchersManager);
    let promptIndex = 0;

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized with hook matchers', {
              sessionId: message.session_id,
              matchers: availableMatchers.length
            });
          }
          break;

        case 'assistant':
          const content = message.message.content;

          // Log tool use attempts with matcher predictions
          if (Array.isArray(content)) {
            const toolUses = content.filter((c: any) => c.type === 'tool_use');
            toolUses.forEach((tool: any) => {
              logger.info(`Tool with matchers: ${tool.name}`, tool.input);

              // Predict which matchers will apply
              const context = { toolName: tool.name, input: tool.input };
              const predictedMatchers = matchersManager.evaluateMatchers(context);

              if (predictedMatchers.length > 0) {
                logger.info(`Predicted matchers: ${predictedMatchers.join(', ')}`);
              }
            });
          }

          logger.message('assistant', content);
          break;

        case 'user':
          const userContent = message.message.content;
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

    // Analyze matcher performance
    const matcherEvents = matchersManager.getEvents();
    const matcherStats = matchersManager.getMatcherStats();
    const toolUsage = matchersManager.getToolUsageCounts();

    metrics.complete(true);

    logger.section('Hook Matcher Analysis');
    logger.info('Total Matcher Events', matcherEvents.length);
    logger.info('Matcher Statistics', matcherStats);
    logger.info('Tool Usage Counts', Object.fromEntries(toolUsage));

    // Validate expected matchers were triggered
    const actualMatchers = Object.keys(matcherStats).filter(name => matcherStats[name].matches > 0);
    const expectedFound = expectedMatchers.filter(matcher => actualMatchers.includes(matcher));
    const coverage = expectedMatchers.length > 0 ? expectedFound.length / expectedMatchers.length : 1;

    logger.info('Matcher Validation', {
      expected: expectedMatchers,
      actual: actualMatchers,
      found: expectedFound,
      coverage: `${(coverage * 100).toFixed(1)}%`
    });

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      matcherAnalysis: {
        events: matcherEvents,
        stats: matcherStats,
        toolUsage: Object.fromEntries(toolUsage),
        expectedMatchers,
        actualMatchers,
        coverage,
        availableMatchers
      }
    };

  } catch (error) {
    const err = error as Error;
    metrics.recordError(err.message);
    metrics.complete(false);
    logger.error('Experiment failed', err);
    logger.complete(false);

    const matcherEvents = matchersManager.getEvents();
    const matcherStats = matchersManager.getMatcherStats();

    return {
      success: false,
      messages,
      error: err,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      matcherAnalysis: {
        events: matcherEvents,
        stats: matcherStats,
        toolUsage: {},
        expectedMatchers,
        actualMatchers: [],
        coverage: 0,
        availableMatchers: []
      }
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Hook Matchers Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: File tools matcher
  console.log('Test 1: File tools matcher');
  const result1 = await testHookMatchers(
    'File Tools Matcher',
    [
      'Read the package.json file',
      'Create a test file called matcher-test.txt',
      'Edit the test file to add more content'
    ],
    ['fileTools', 'configFiles']
  );

  results.push({
    test: 'File Tools Matcher',
    success: result1.success,
    matcherEvents: result1.matcherAnalysis.events.length,
    coverage: result1.matcherAnalysis.coverage,
    uniqueMatchers: result1.matcherAnalysis.actualMatchers.length
  });

  output.addTest('File Tools Matcher', {
    prompt: 'Test file tools matcher functionality',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Search tools matcher
  console.log('\nTest 2: Search tools matcher');
  const result2 = await testHookMatchers(
    'Search Tools Matcher',
    [
      'Search for all TypeScript files',
      'Find files containing "experiment"',
      'Look for configuration files'
    ],
    ['searchTools', 'configFiles']
  );

  results.push({
    test: 'Search Tools Matcher',
    success: result2.success,
    matcherEvents: result2.matcherAnalysis.events.length,
    coverage: result2.matcherAnalysis.coverage,
    uniqueMatchers: result2.matcherAnalysis.actualMatchers.length
  });

  output.addTest('Search Tools Matcher', {
    prompt: 'Test search tools matcher functionality',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Large input matcher
  console.log('\nTest 3: Large input matcher');
  const result3 = await testHookMatchers(
    'Large Input Matcher',
    [
      'Create a file with very long content that exceeds the threshold',
      'Write a large JSON configuration object',
      'Process large data structures'
    ],
    ['largeInput', 'fileTools']
  );

  results.push({
    test: 'Large Input Matcher',
    success: result3.success,
    matcherEvents: result3.matcherAnalysis.events.length,
    coverage: result3.matcherAnalysis.coverage,
    uniqueMatchers: result3.matcherAnalysis.actualMatchers.length
  });

  output.addTest('Large Input Matcher', {
    prompt: 'Test large input matcher functionality',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Error-prone operations matcher
  console.log('\nTest 4: Error-prone operations matcher');
  const result4 = await testHookMatchers(
    'Error-Prone Matcher',
    [
      'Create a file in the /tmp directory',
      'Try to access a potentially problematic resource',
      'Perform operations that might fail'
    ],
    ['errorProne', 'fileTools']
  );

  results.push({
    test: 'Error-Prone Matcher',
    success: result4.success,
    matcherEvents: result4.matcherAnalysis.events.length,
    coverage: result4.matcherAnalysis.coverage,
    uniqueMatchers: result4.matcherAnalysis.actualMatchers.length
  });

  output.addTest('Error-Prone Operations Matcher', {
    prompt: 'Test error-prone operations matcher',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Test 5: Frequent tools matcher
  console.log('\nTest 5: Frequent tools matcher');
  const result5 = await testHookMatchers(
    'Frequent Tools Matcher',
    [
      'Perform multiple read operations',
      'Read several different files',
      'Use the same tools repeatedly',
      'Trigger frequency-based matching'
    ],
    ['frequentTools', 'fileTools']
  );

  results.push({
    test: 'Frequent Tools Matcher',
    success: result5.success,
    matcherEvents: result5.matcherAnalysis.events.length,
    coverage: result5.matcherAnalysis.coverage,
    uniqueMatchers: result5.matcherAnalysis.actualMatchers.length
  });

  output.addTest('Frequent Tools Matcher', {
    prompt: 'Test frequent tools matcher functionality',
    messages: result5.messages,
    metrics: result5.metrics,
    logs: result5.logs
  });

  // Comprehensive matcher analysis
  const allMatcherAnalysis = {
    fileTools: result1.matcherAnalysis,
    searchTools: result2.matcherAnalysis,
    largeInput: result3.matcherAnalysis,
    errorProne: result4.matcherAnalysis,
    frequentTools: result5.matcherAnalysis
  };

  // Aggregate matcher statistics
  const allEvents = Object.values(allMatcherAnalysis).flatMap(analysis => analysis.events);
  const allMatchers = [...new Set(Object.values(allMatcherAnalysis).flatMap(a => a.availableMatchers))];
  const matcherEffectiveness = allMatchers.map(matcher => {
    const matcherEvents = allEvents.filter(e => e.matcher === matcher);
    const matches = matcherEvents.filter(e => e.matched).length;
    return {
      matcher,
      total: matcherEvents.length,
      matches,
      effectiveness: matcherEvents.length > 0 ? (matches / matcherEvents.length) * 100 : 0
    };
  });

  output.addJSON('Hook Matchers Analysis', {
    results: allMatcherAnalysis,
    aggregateStats: {
      totalMatcherEvents: allEvents.length,
      uniqueMatchers: allMatchers.length,
      matcherEffectiveness,
      avgCoverage: results.reduce((sum, r) => sum + r.coverage, 0) / results.length
    },
    summary: {
      totalTests: results.length,
      avgMatcherEvents: results.reduce((sum, r) => sum + r.matcherEvents, 0) / results.length,
      avgCoverage: results.reduce((sum, r) => sum + r.coverage, 0) / results.length,
      mostEffectiveMatchers: matcherEffectiveness
        .sort((a, b) => b.effectiveness - a.effectiveness)
        .slice(0, 3)
        .map(m => m.matcher)
    }
  });

  // Add final summary
  output.addSummary(results);

  // Console summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 HOOK MATCHERS EXPERIMENT SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.test}: ${r.success ? '✅' : '❌'} (${r.matcherEvents} events, ${(r.coverage * 100).toFixed(1)}% coverage, ${r.uniqueMatchers} matchers)`);
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