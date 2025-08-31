#!/usr/bin/env bun
import { 
  queryOpenRouter, 
  OpenRouterChat, 
  isOpenRouterAvailable,
  getAvailableModels 
} from './src/services/openrouter.service';

async function testOpenRouter() {
  console.log('🤖 Testing OpenRouter Integration with GPT-OSS-120B\n');
  console.log('=' .repeat(50));
  
  // Check if API key is configured
  if (!isOpenRouterAvailable()) {
    console.log('❌ OPENROUTER_API_KEY not configured!');
    console.log('\nTo use OpenRouter:');
    console.log('1. Sign up at https://openrouter.ai');
    console.log('2. Get your API key from the dashboard');
    console.log('3. Set the environment variable:');
    console.log('   export OPENROUTER_API_KEY="your-key-here"');
    console.log('\nThen run this test again.');
    return;
  }
  
  console.log('✅ OpenRouter API key configured\n');
  
  // Test 1: Single query
  console.log('📝 Test 1: Single Query');
  console.log('-'.repeat(30));
  
  const singleResult = await queryOpenRouter(
    'What is the capital of France? Answer in one sentence.',
    { temperature: 0.5 }
  );
  
  if (singleResult.success) {
    console.log('Response:', singleResult.result);
    console.log('Model:', singleResult.model);
    if (singleResult.usage) {
      console.log('Tokens:', {
        prompt: singleResult.usage.prompt_tokens,
        completion: singleResult.usage.completion_tokens,
        total: singleResult.usage.total_tokens
      });
    }
  } else {
    console.log('Error:', singleResult.error);
  }
  
  // Test 2: Multi-turn conversation
  console.log('\n📝 Test 2: Multi-turn Conversation');
  console.log('-'.repeat(30));
  
  const chat = new OpenRouterChat({
    systemPrompt: 'You are a helpful geography expert.',
    model: 'openai/gpt-oss-120b'
  });
  
  const messages = [
    'Name three major rivers in Europe.',
    'Which one is the longest?',
    'What countries does it flow through?'
  ];
  
  for (const msg of messages) {
    console.log(`\nUser: ${msg}`);
    const response = await chat.sendMessage(msg);
    
    if (response.success) {
      console.log(`Assistant: ${response.result}`);
    } else {
      console.log(`Error: ${response.error}`);
    }
  }
  
  // Test 3: Get available models (optional)
  console.log('\n📝 Test 3: Available Models');
  console.log('-'.repeat(30));
  
  const models = await getAvailableModels();
  if (models.length > 0) {
    console.log(`Found ${models.length} available models`);
    // Show first 5 models
    models.slice(0, 5).forEach((model: any) => {
      console.log(`- ${model.id}: $${model.pricing?.prompt || 0}/1K tokens`);
    });
  } else {
    console.log('Could not fetch model list');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ OpenRouter tests completed!');
  
  console.log('\n📋 Features Available:');
  console.log('  1. Single queries with queryOpenRouter()');
  console.log('  2. Multi-turn chat with OpenRouterChat class');
  console.log('  3. Model selection (GPT-OSS-120B and others)');
  console.log('  4. Temperature and token control');
  console.log('  5. System prompts for context');
  
  console.log('\n🎮 TUI Features:');
  console.log('  - "OpenRouter GPT-OSS-120B" - Single query mode');
  console.log('  - "OpenRouter Multi-turn Chat" - Conversation mode');
  console.log('  - Both support the GPT-OSS-120B model');
  console.log('  - Conversation history tracking');
}

// Run the test
testOpenRouter().catch(console.error);