export class ExperimentLogger {
  private startTime: number;
  private experiment: string;
  private logs: string[] = [];
  private captureOutput: boolean;

  constructor(experimentName: string, captureOutput: boolean = true) {
    this.experiment = experimentName;
    this.startTime = Date.now();
    this.captureOutput = captureOutput;
    this.header();
  }

  private log(message: string) {
    console.log(message);
    if (this.captureOutput) {
      this.logs.push(message);
    }
  }

  private header() {
    this.log('\n' + '='.repeat(60));
    this.log(`🧪 EXPERIMENT: ${this.experiment}`);
    this.log('='.repeat(60));
    this.log(`⏰ Started at: ${new Date().toISOString()}`);
    this.log('');
  }

  info(message: string, data?: any) {
    this.log(`ℹ️  ${message}`);
    if (data !== undefined) {
      this.log('   Data: ' + JSON.stringify(data, null, 2).split('\n').join('\n   '));
    }
  }

  success(message: string, data?: any) {
    this.log(`✅ ${message}`);
    if (data !== undefined) {
      this.log('   Data: ' + JSON.stringify(data, null, 2).split('\n').join('\n   '));
    }
  }

  error(message: string, error?: any) {
    this.log(`❌ ${message}`);
    if (error) {
      this.log('   Error: ' + (error.message || error));
      if (error.stack) {
        this.log('   Stack: ' + error.stack.split('\n').slice(1).join('\n   '));
      }
    }
  }

  warning(message: string, data?: any) {
    this.log(`⚠️  ${message}`);
    if (data !== undefined) {
      this.log('   Data: ' + JSON.stringify(data, null, 2).split('\n').join('\n   '));
    }
  }

  section(title: string) {
    this.log('\n' + '-'.repeat(40));
    this.log(`📋 ${title}`);
    this.log('-'.repeat(40));
  }

  message(type: string, content: any) {
    const icon = {
      'assistant': '🤖',
      'user': '👤',
      'system': '⚙️',
      'result': '📊',
      'stream_event': '📡',
    }[type] || '📝';

    this.log(`\n${icon} ${type.toUpperCase()} Message:`);
    if (typeof content === 'string') {
      this.log('   ' + content.split('\n').join('\n   '));
    } else {
      this.log('   ' + JSON.stringify(content, null, 2).split('\n').join('\n   '));
    }
  }

  complete(success: boolean, details?: any) {
    const duration = Date.now() - this.startTime;
    this.log('\n' + '='.repeat(60));
    this.log(`${success ? '✅ SUCCESS' : '❌ FAILED'} - ${this.experiment}`);
    this.log(`⏱️  Duration: ${duration}ms`);
    if (details) {
      this.log('📝 Details: ' + JSON.stringify(details, null, 2).split('\n').join('\n   '));
    }
    this.log('='.repeat(60) + '\n');
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  getLogsAsString(): string {
    return this.logs.join('\n');
  }
}