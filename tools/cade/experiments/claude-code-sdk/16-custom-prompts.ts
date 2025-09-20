#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';
import type { SDKMessage, Options, Query } from '@anthropic-ai/claude-code';
import { ExperimentLogger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { OutputWriter } from './utils/output-writer';
import type { ExperimentResult } from './utils/types';
import { fileURLToPath } from 'url';

/**
 * Experiment: Custom Prompts
 * Tests: System prompt customization and prompt engineering
 * Expected: Modified behavior based on custom system prompts
 */

// Custom prompt templates
interface CustomPromptConfig {
  name: string;
  systemPrompt: string;
  description: string;
  expectedBehavior: string[];
}

const customPromptConfigs: CustomPromptConfig[] = [
  {
    name: 'Security Focused',
    systemPrompt: `You are a security-conscious AI assistant. Always prioritize safety and security in your responses.

SECURITY GUIDELINES:
- Never execute commands that could be dangerous
- Always validate file paths before operations
- Warn about potential security risks
- Prefer read-only operations when possible
- Ask for confirmation before making changes
- Log all file operations for audit purposes

When working with files:
1. Check if the operation is necessary
2. Validate the file path is safe
3. Warn about any potential risks
4. Proceed only with explicit permission`,
    description: 'Security-focused behavior with enhanced safety checks',
    expectedBehavior: ['security warnings', 'validation checks', 'cautious operations']
  },
  {
    name: 'Developer Assistant',
    systemPrompt: `You are an expert software developer assistant specializing in modern web development.

DEVELOPMENT FOCUS:
- Prioritize TypeScript and React best practices
- Follow conventional code structure patterns
- Suggest improvements and optimizations
- Use descriptive variable names and comments
- Implement proper error handling
- Consider performance implications

When writing code:
1. Use TypeScript for type safety
2. Follow functional programming principles where appropriate
3. Include proper JSDoc comments
4. Implement comprehensive error handling
5. Consider accessibility and performance`,
    description: 'Developer-focused behavior with coding best practices',
    expectedBehavior: ['TypeScript usage', 'best practices', 'code optimization']
  },
  {
    name: 'Data Analyst',
    systemPrompt: `You are a data analyst AI assistant focused on data processing and analysis.

DATA ANALYSIS APPROACH:
- Always validate data before processing
- Provide statistical summaries when working with datasets
- Suggest data visualization opportunities
- Identify patterns and anomalies
- Document data sources and transformations
- Consider data quality and integrity

When handling data:
1. Examine data structure and quality
2. Provide descriptive statistics
3. Identify missing or invalid values
4. Suggest appropriate analysis methods
5. Document findings clearly`,
    description: 'Data analysis focused with statistical approach',
    expectedBehavior: ['data validation', 'statistical analysis', 'pattern recognition']
  },
  {
    name: 'Documentation Writer',
    systemPrompt: `You are a technical documentation specialist focused on creating clear, comprehensive documentation.

DOCUMENTATION STANDARDS:
- Write clear, concise explanations
- Use consistent formatting and structure
- Include examples for complex concepts
- Create step-by-step instructions
- Add cross-references and links
- Consider different audience levels

When creating documentation:
1. Start with clear objectives
2. Use hierarchical structure
3. Include practical examples
4. Add troubleshooting sections
5. Maintain consistent style`,
    description: 'Documentation-focused with clear communication',
    expectedBehavior: ['structured output', 'clear explanations', 'examples included']
  },
  {
    name: 'Performance Optimizer',
    systemPrompt: `You are a performance optimization specialist focused on efficiency and speed.

PERFORMANCE PRIORITIES:
- Minimize resource usage
- Optimize for speed and efficiency
- Consider memory and CPU implications
- Suggest caching strategies
- Identify bottlenecks
- Measure and benchmark operations

When optimizing:
1. Profile current performance
2. Identify bottlenecks
3. Implement targeted optimizations
4. Measure improvements
5. Document performance gains`,
    description: 'Performance-focused with optimization strategies',
    expectedBehavior: ['performance monitoring', 'optimization suggestions', 'efficiency focus']
  }
];

// Helper to analyze behavior based on responses
function analyzeBehaviorPatterns(messages: SDKMessage[], expectedBehaviors: string[]): {
  detectedPatterns: string[];
  behaviorScore: number;
  evidenceCount: number;
} {
  const detectedPatterns: string[] = [];
  let evidenceCount = 0;

  // Look for behavior patterns in assistant messages
  const assistantMessages = messages.filter(m => m.type === 'assistant');

  assistantMessages.forEach(message => {
    const content = Array.isArray(message.message.content)
      ? message.message.content.map((c: any) => c.text || '').join(' ')
      : message.message.content || '';

    const contentLower = content.toLowerCase();

    expectedBehaviors.forEach(behavior => {
      const behaviorLower = behavior.toLowerCase();

      // Check for direct mentions or related keywords
      const keywords = {
        'security warnings': ['security', 'warning', 'caution', 'risk', 'dangerous', 'safe'],
        'validation checks': ['validate', 'check', 'verify', 'confirm', 'ensure'],
        'cautious operations': ['careful', 'cautious', 'permission', 'confirm', 'proceed'],
        'TypeScript usage': ['typescript', 'type', 'interface', 'generic', ':'],
        'best practices': ['best practice', 'recommend', 'should', 'pattern', 'convention'],
        'code optimization': ['optimize', 'performance', 'efficient', 'improve', 'faster'],
        'data validation': ['validate', 'data', 'quality', 'integrity', 'check'],
        'statistical analysis': ['statistic', 'mean', 'average', 'distribution', 'analysis'],
        'pattern recognition': ['pattern', 'trend', 'anomaly', 'outlier', 'correlation'],
        'structured output': ['structure', 'format', 'organize', 'section', 'hierarchy'],
        'clear explanations': ['explain', 'clarify', 'understand', 'example', 'detail'],
        'examples included': ['example', 'instance', 'sample', 'demonstrate', 'illustrate'],
        'performance monitoring': ['performance', 'measure', 'benchmark', 'monitor', 'profile'],
        'optimization suggestions': ['optimize', 'improve', 'enhance', 'faster', 'efficient'],
        'efficiency focus': ['efficient', 'fast', 'quick', 'minimal', 'resource']
      };

      const behaviorKeywords = keywords[behaviorLower] || [behaviorLower];
      const found = behaviorKeywords.some(keyword => contentLower.includes(keyword));

      if (found && !detectedPatterns.includes(behavior)) {
        detectedPatterns.push(behavior);
        evidenceCount++;
      }
    });
  });

  const behaviorScore = expectedBehaviors.length > 0
    ? (detectedPatterns.length / expectedBehaviors.length) * 100
    : 0;

  return {
    detectedPatterns,
    behaviorScore,
    evidenceCount
  };
}

// SDK Setup Function with custom system prompt
function setupCustomPromptQuery(
  prompt: string,
  config: CustomPromptConfig,
  options?: Options
): Query {
  return query({
    prompt,
    systemPrompt: config.systemPrompt,
    options: options || { maxTurns: 5 }
  });
}

// Tester Function
async function testCustomPrompt(
  config: CustomPromptConfig,
  testPrompts: string[]
): Promise<ExperimentResult & { logs: string; promptAnalysis: any }> {
  const logger = new ExperimentLogger(`16-custom-prompts - ${config.name}`);
  const metrics = new MetricsCollector();
  const messages: SDKMessage[] = [];

  try {
    logger.section('Configuration');
    logger.info('Test', config.name);
    logger.info('Description', config.description);
    logger.info('Expected Behaviors', config.expectedBehavior);
    logger.info('Test Prompts', testPrompts);

    logger.section('Custom System Prompt');
    logger.info('System Prompt Length', config.systemPrompt.length);
    logger.info('System Prompt Preview', config.systemPrompt.substring(0, 200) + '...');

    logger.section('Execution with Custom Prompt');

    const q = setupCustomPromptQuery(testPrompts[0], config);
    let promptIndex = 0;

    for await (const message of q) {
      messages.push(message);
      metrics.recordMessage(message.type);

      switch (message.type) {
        case 'system':
          if (message.subtype === 'init') {
            logger.success('System initialized with custom prompt', {
              sessionId: message.session_id,
              customPrompt: config.name
            });
          }
          break;

        case 'assistant':
          const content = message.message.content;

          // Analyze response for expected behavior patterns
          const responseText = Array.isArray(content)
            ? content.map((c: any) => c.text || '').join(' ')
            : content || '';

          logger.info('Assistant response length', responseText.length);

          // Look for specific behavior indicators
          config.expectedBehavior.forEach(behavior => {
            if (responseText.toLowerCase().includes(behavior.toLowerCase().split(' ')[0])) {
              logger.success(`Detected expected behavior: ${behavior}`);
            }
          });

          logger.message('assistant', content);
          break;

        case 'user':
          const userContent = message.message.content;
          logger.message('user', userContent);

          // Send next prompt if available
          if (promptIndex < testPrompts.length - 1) {
            promptIndex++;
            q.input(testPrompts[promptIndex]);
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

    // Analyze behavior patterns
    const behaviorAnalysis = analyzeBehaviorPatterns(messages, config.expectedBehavior);

    metrics.complete(true);

    logger.section('Prompt Behavior Analysis');
    logger.info('Expected Behaviors', config.expectedBehavior);
    logger.info('Detected Patterns', behaviorAnalysis.detectedPatterns);
    logger.info('Behavior Score', `${behaviorAnalysis.behaviorScore.toFixed(1)}%`);
    logger.info('Evidence Count', behaviorAnalysis.evidenceCount);

    // Response characteristics analysis
    const assistantMessages = messages.filter(m => m.type === 'assistant');
    const totalResponseLength = assistantMessages.reduce((sum, msg) => {
      const content = Array.isArray(msg.message.content)
        ? msg.message.content.map((c: any) => c.text || '').join(' ')
        : msg.message.content || '';
      return sum + content.length;
    }, 0);

    const avgResponseLength = assistantMessages.length > 0
      ? totalResponseLength / assistantMessages.length
      : 0;

    logger.info('Response Characteristics', {
      messageCount: assistantMessages.length,
      totalLength: totalResponseLength,
      avgLength: Math.round(avgResponseLength)
    });

    logger.complete(true);

    return {
      success: true,
      messages,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      promptAnalysis: {
        config,
        behaviorAnalysis,
        responseCharacteristics: {
          messageCount: assistantMessages.length,
          totalLength: totalResponseLength,
          avgLength: avgResponseLength
        }
      }
    };

  } catch (error) {
    const err = error as Error;
    metrics.recordError(err.message);
    metrics.complete(false);
    logger.error('Experiment failed', err);
    logger.complete(false);

    const behaviorAnalysis = analyzeBehaviorPatterns(messages, config.expectedBehavior);

    return {
      success: false,
      messages,
      error: err,
      metrics: metrics.getMetrics(),
      logs: logger.getLogsAsString(),
      promptAnalysis: {
        config,
        behaviorAnalysis,
        responseCharacteristics: {
          messageCount: 0,
          totalLength: 0,
          avgLength: 0
        }
      }
    };
  }
}

// Main execution
async function main() {
  console.log('\n🚀 Starting Custom Prompts Experiment\n');

  const scriptPath = import.meta.url.startsWith('file://')
    ? fileURLToPath(import.meta.url)
    : __filename;
  const output = new OutputWriter(scriptPath);
  const results = [];

  // Test 1: Security focused prompt
  console.log('Test 1: Security focused prompt');
  const result1 = await testCustomPrompt(
    customPromptConfigs[0],
    [
      'Create a new file in the /tmp directory',
      'Delete all files in a directory',
      'Run a system command to check disk usage'
    ]
  );

  results.push({
    test: customPromptConfigs[0].name,
    success: result1.success,
    behaviorScore: result1.promptAnalysis.behaviorAnalysis.behaviorScore,
    detectedPatterns: result1.promptAnalysis.behaviorAnalysis.detectedPatterns.length,
    avgResponseLength: result1.promptAnalysis.responseCharacteristics.avgLength
  });

  output.addTest('Security Focused Prompt', {
    prompt: 'Test security-focused behavior modification',
    messages: result1.messages,
    metrics: result1.metrics,
    logs: result1.logs
  });

  // Test 2: Developer assistant prompt
  console.log('\nTest 2: Developer assistant prompt');
  const result2 = await testCustomPrompt(
    customPromptConfigs[1],
    [
      'Create a TypeScript interface for a user object',
      'Write a React component with proper error handling',
      'Optimize this code for better performance'
    ]
  );

  results.push({
    test: customPromptConfigs[1].name,
    success: result2.success,
    behaviorScore: result2.promptAnalysis.behaviorAnalysis.behaviorScore,
    detectedPatterns: result2.promptAnalysis.behaviorAnalysis.detectedPatterns.length,
    avgResponseLength: result2.promptAnalysis.responseCharacteristics.avgLength
  });

  output.addTest('Developer Assistant Prompt', {
    prompt: 'Test developer-focused behavior modification',
    messages: result2.messages,
    metrics: result2.metrics,
    logs: result2.logs
  });

  // Test 3: Data analyst prompt
  console.log('\nTest 3: Data analyst prompt');
  const result3 = await testCustomPrompt(
    customPromptConfigs[2],
    [
      'Analyze the data in a CSV file',
      'Find patterns in user behavior data',
      'Create a summary of key statistics'
    ]
  );

  results.push({
    test: customPromptConfigs[2].name,
    success: result3.success,
    behaviorScore: result3.promptAnalysis.behaviorAnalysis.behaviorScore,
    detectedPatterns: result3.promptAnalysis.behaviorAnalysis.detectedPatterns.length,
    avgResponseLength: result3.promptAnalysis.responseCharacteristics.avgLength
  });

  output.addTest('Data Analyst Prompt', {
    prompt: 'Test data analysis behavior modification',
    messages: result3.messages,
    metrics: result3.metrics,
    logs: result3.logs
  });

  // Test 4: Documentation writer prompt
  console.log('\nTest 4: Documentation writer prompt');
  const result4 = await testCustomPrompt(
    customPromptConfigs[3],
    [
      'Create documentation for a new API endpoint',
      'Write a user guide for this feature',
      'Document the installation process'
    ]
  );

  results.push({
    test: customPromptConfigs[3].name,
    success: result4.success,
    behaviorScore: result4.promptAnalysis.behaviorAnalysis.behaviorScore,
    detectedPatterns: result4.promptAnalysis.behaviorAnalysis.detectedPatterns.length,
    avgResponseLength: result4.promptAnalysis.responseCharacteristics.avgLength
  });

  output.addTest('Documentation Writer Prompt', {
    prompt: 'Test documentation-focused behavior modification',
    messages: result4.messages,
    metrics: result4.metrics,
    logs: result4.logs
  });

  // Test 5: Performance optimizer prompt
  console.log('\nTest 5: Performance optimizer prompt');
  const result5 = await testCustomPrompt(
    customPromptConfigs[4],
    [
      'Optimize the performance of this code',
      'Identify bottlenecks in the application',
      'Suggest caching strategies'
    ]
  );

  results.push({
    test: customPromptConfigs[4].name,
    success: result5.success,
    behaviorScore: result5.promptAnalysis.behaviorAnalysis.behaviorScore,
    detectedPatterns: result5.promptAnalysis.behaviorAnalysis.detectedPatterns.length,
    avgResponseLength: result5.promptAnalysis.responseCharacteristics.avgLength
  });

  output.addTest('Performance Optimizer Prompt', {
    prompt: 'Test performance optimization behavior modification',
    messages: result5.messages,
    metrics: result5.metrics,
    logs: result5.logs
  });

  // Comprehensive custom prompt analysis
  const allPromptAnalysis = {
    securityFocused: result1.promptAnalysis,
    developerAssistant: result2.promptAnalysis,
    dataAnalyst: result3.promptAnalysis,
    documentationWriter: result4.promptAnalysis,
    performanceOptimizer: result5.promptAnalysis
  };

  // Aggregate prompt effectiveness analysis
  const promptEffectiveness = customPromptConfigs.map((config, index) => {
    const result = [result1, result2, result3, result4, result5][index];
    return {
      name: config.name,
      behaviorScore: result.promptAnalysis.behaviorAnalysis.behaviorScore,
      patternCount: result.promptAnalysis.behaviorAnalysis.detectedPatterns.length,
      expectedCount: config.expectedBehavior.length,
      effectiveness: result.promptAnalysis.behaviorAnalysis.behaviorScore
    };
  });

  output.addJSON('Custom Prompts Analysis', {
    configs: customPromptConfigs.map(config => ({
      name: config.name,
      description: config.description,
      expectedBehaviors: config.expectedBehavior,
      promptLength: config.systemPrompt.length
    })),
    results: allPromptAnalysis,
    effectiveness: promptEffectiveness,
    summary: {
      totalPrompts: customPromptConfigs.length,
      avgBehaviorScore: results.reduce((sum, r) => sum + r.behaviorScore, 0) / results.length,
      avgPatterns: results.reduce((sum, r) => sum + r.detectedPatterns, 0) / results.length,
      avgResponseLength: results.reduce((sum, r) => sum + r.avgResponseLength, 0) / results.length,
      mostEffective: promptEffectiveness.sort((a, b) => b.effectiveness - a.effectiveness)[0]?.name
    }
  });

  // Add final summary
  output.addSummary(results);

  // Console summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 CUSTOM PROMPTS EXPERIMENT SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.test}: ${r.success ? '✅' : '❌'} (${r.behaviorScore.toFixed(1)}% behavior, ${r.detectedPatterns} patterns, ${Math.round(r.avgResponseLength)} avg chars)`);
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