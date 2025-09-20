import { writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';

export class OutputWriter {
  private content: string[] = [];
  private filePath: string;

  constructor(scriptPath: string) {
    // Convert .ts to .md in the same directory
    const dir = dirname(scriptPath);
    const name = basename(scriptPath, '.ts');
    this.filePath = join(dir, `${name}.md`);

    // Initialize with header
    this.addHeader(name);
  }

  private addHeader(name: string) {
    this.content.push(`# Experiment Output: ${name}`);
    this.content.push(`\nGenerated: ${new Date().toISOString()}\n`);
    this.content.push('---\n');
  }

  addSection(title: string, content: string) {
    this.content.push(`## ${title}\n`);
    this.content.push('```');
    this.content.push(content);
    this.content.push('```\n');
  }

  addTest(testName: string, data: {
    prompt: string;
    messages: any[];
    metrics: any;
    logs?: string;
  }) {
    this.content.push(`## Test: ${testName}\n`);

    // Prompt
    this.content.push('### Prompt\n');
    this.content.push('```');
    this.content.push(data.prompt);
    this.content.push('```\n');

    // Metrics
    this.content.push('### Metrics\n');
    this.content.push('```json');
    this.content.push(JSON.stringify({
      duration: `${data.metrics.duration}ms`,
      messages: data.metrics.messagesReceived,
      messageTypes: data.metrics.messageTypes,
      tokens: data.metrics.tokensUsed,
      cost: data.metrics.cost ? `$${data.metrics.cost.toFixed(6)}` : 'N/A',
      success: data.metrics.success
    }, null, 2));
    this.content.push('```\n');

    // Messages
    this.content.push('### Messages\n');
    for (const msg of data.messages) {
      this.content.push(`#### ${msg.type.toUpperCase()} Message`);

      if (msg.type === 'system' && msg.subtype) {
        this.content.push(`*Subtype: ${msg.subtype}*\n`);
      }

      this.content.push('```json');

      // Format message content based on type
      let displayContent: any = {};

      switch(msg.type) {
        case 'system':
          if (msg.subtype === 'init') {
            displayContent = {
              session_id: msg.session_id,
              model: msg.model,
              tools: msg.tools?.length,
              cwd: msg.cwd
            };
          }
          break;
        case 'assistant':
        case 'user':
          displayContent = {
            content: msg.message?.content,
            uuid: msg.uuid
          };
          break;
        case 'result':
          displayContent = {
            subtype: msg.subtype,
            duration_ms: msg.duration_ms,
            num_turns: msg.num_turns,
            total_cost_usd: msg.total_cost_usd,
            usage: msg.usage
          };
          break;
        default:
          displayContent = msg;
      }

      this.content.push(JSON.stringify(displayContent, null, 2));
      this.content.push('```\n');
    }

    // Execution Log (if provided)
    if (data.logs) {
      this.content.push('### Execution Log\n');
      this.content.push('```');
      this.content.push(data.logs);
      this.content.push('```\n');
    }

    this.content.push('---\n');
  }

  addRaw(content: string) {
    this.content.push(content);
  }

  addJSON(title: string, data: any) {
    this.content.push(`## ${title}\n`);
    this.content.push('```json');
    this.content.push(JSON.stringify(data, null, 2));
    this.content.push('```\n');
  }

  addTable(title: string, headers: string[], rows: string[][]) {
    this.content.push(`## ${title}\n`);
    this.content.push(`| ${headers.join(' | ')} |`);
    this.content.push(`| ${headers.map(() => '---').join(' | ')} |`);
    for (const row of rows) {
      this.content.push(`| ${row.join(' | ')} |`);
    }
    this.content.push('');
  }

  addSummary(results: Array<{ test: string; success: boolean; details?: any }>) {
    this.content.push('## Summary\n');
    this.content.push('| Test | Result | Details |');
    this.content.push('| --- | --- | --- |');

    for (const result of results) {
      const status = result.success ? '✅ Success' : '❌ Failed';
      const details = result.details ? JSON.stringify(result.details) : '-';
      this.content.push(`| ${result.test} | ${status} | ${details} |`);
    }
    this.content.push('');
  }

  save(): string {
    const fullContent = this.content.join('\n');
    writeFileSync(this.filePath, fullContent, 'utf-8');
    return this.filePath;
  }

  getPath(): string {
    return this.filePath;
  }
}