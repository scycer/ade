export interface ExperimentMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  messagesReceived: number;
  messageTypes: Record<string, number>;
  tokensUsed?: {
    input: number;
    output: number;
    cacheCreation?: number;
    cacheRead?: number;
  };
  cost?: number;
  errors: string[];
  success: boolean;
}

export class MetricsCollector {
  private metrics: ExperimentMetrics;

  constructor() {
    this.metrics = {
      startTime: Date.now(),
      messagesReceived: 0,
      messageTypes: {},
      errors: [],
      success: false
    };
  }

  recordMessage(type: string) {
    this.metrics.messagesReceived++;
    this.metrics.messageTypes[type] = (this.metrics.messageTypes[type] || 0) + 1;
  }

  recordTokens(usage: any) {
    if (usage) {
      this.metrics.tokensUsed = {
        input: usage.input_tokens || 0,
        output: usage.output_tokens || 0,
        cacheCreation: usage.cache_creation_input_tokens,
        cacheRead: usage.cache_read_input_tokens
      };
    }
  }

  recordCost(cost: number) {
    this.metrics.cost = cost;
  }

  recordError(error: string) {
    this.metrics.errors.push(error);
  }

  complete(success: boolean) {
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    this.metrics.success = success;
  }

  getMetrics(): ExperimentMetrics {
    return { ...this.metrics };
  }

  getSummary(): string {
    const m = this.metrics;
    const lines = [
      `Duration: ${m.duration}ms`,
      `Messages: ${m.messagesReceived}`,
      `Message Types: ${Object.entries(m.messageTypes).map(([k, v]) => `${k}(${v})`).join(', ')}`,
    ];

    if (m.tokensUsed) {
      lines.push(`Tokens: in=${m.tokensUsed.input}, out=${m.tokensUsed.output}`);
    }

    if (m.cost !== undefined) {
      lines.push(`Cost: $${m.cost.toFixed(6)}`);
    }

    if (m.errors.length > 0) {
      lines.push(`Errors: ${m.errors.length}`);
    }

    lines.push(`Status: ${m.success ? 'SUCCESS' : 'FAILED'}`);

    return lines.join('\n');
  }
}