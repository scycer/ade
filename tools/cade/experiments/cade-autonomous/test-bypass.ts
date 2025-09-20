#!/usr/bin/env bun

import { query } from '@anthropic-ai/claude-code';

async function testBypass() {
  console.log('Testing bypassPermissions mode...\n');

  const q = query({
    prompt: 'Create a file called test-bypass-output.txt with content "Bypass mode works!"',
    permissionMode: 'bypassPermissions',
    options: { maxTurns: 5 }
  });

  let sessionInfo: any = null;

  for await (const message of q) {
    if (message.type === 'system' && message.subtype === 'init') {
      sessionInfo = message;
      console.log('Session ID:', message.session_id);
      console.log('Permission Mode:', message.permissionMode);
      console.log('Model:', message.model);
    }

    if (message.type === 'user') {
      // Check for permission errors
      if (Array.isArray(message.message.content)) {
        const toolResults = message.message.content.filter((c: any) => c.type === 'tool_result');
        toolResults.forEach((result: any) => {
          if (result.is_error) {
            console.error('Tool error:', result.content);
          }
        });
      }
    }

    if (message.type === 'result') {
      console.log('\nResult:', message.subtype);
      console.log('Turns:', message.num_turns);
      console.log('Cost:', message.total_cost_usd);
    }
  }

  // Check if file was created
  const fs = await import('fs');
  if (fs.existsSync('test-bypass-output.txt')) {
    console.log('\n✅ File created successfully!');
    const content = fs.readFileSync('test-bypass-output.txt', 'utf-8');
    console.log('Content:', content);
  } else {
    console.log('\n❌ File was not created');
  }
}

testBypass().catch(console.error);