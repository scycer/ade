// Test file for indexing functionality
import { indexFile } from './lib/server-functions';

async function testIndexing() {
  console.log('Testing file indexing...');
  
  // Sample file content to index
  const testFile = {
    path: '/test/example.ts',
    content: `
// This is a test TypeScript file
export function helloWorld() {
  console.log('Hello, World!');
  return 'Hello from the test file';
}

export class TestClass {
  constructor(private name: string) {}
  
  greet() {
    return \`Hello, \${this.name}!\`;
  }
}
    `.trim()
  };

  try {
    const result = await indexFile({ data: testFile });
    console.log('File indexed successfully:', result);
  } catch (error) {
    console.error('Error indexing file:', error);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testIndexing().catch(console.error);
}