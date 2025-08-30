#!/usr/bin/env bun
import { useState } from 'react';
import { render, Text, Box, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { query } from '@anthropic-ai/claude-code';
import { claudeConfig } from './config';

type AppState = 'menu' | 'input' | 'processing' | 'result';

const actions = [
  { id: 'claude', label: 'Message Claude Code', description: 'Send requests to Claude to help with your development tasks' }
];

const App = () => {
  const { exit } = useApp();
  const [state, setState] = useState<AppState>('menu');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  
  useInput((input, key) => {
    if (state === 'menu') {
      if (input === 'q' || key.escape) {
        console.clear();
        exit();
      } else if (key.upArrow) {
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      } else if (key.downArrow) {
        setSelectedIndex(Math.min(actions.length - 1, selectedIndex + 1));
      } else if (key.return) {
        setState('input');
      }
    } else if (state === 'input') {
      if (key.escape) {
        setState('menu');
        setMessage('');
      }
    } else if (state === 'result') {
      if (key.escape || key.return) {
        setState('menu');
        setMessage('');
        setResponse('');
      }
    }
  });

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;
    
    setState('processing');
    
    try {
      for await (const msg of query({
        prompt: value,
        options: {
          ...claudeConfig.defaultOptions,
          pathToClaudeCodeExecutable: claudeConfig.pathToClaudeCodeExecutable,
          executable: claudeConfig.executable,
          maxTurns: 1
        }
      })) {
        if (msg.type === "result" && msg.subtype === "success") {
          setResponse(msg.result);
          setState('result');
        }
      }
    } catch (error: any) {
      setResponse(`Error: ${error.message}`);
      setState('result');
    }
  };

  // Clear console on startup
  useState(() => {
    console.clear();
  });

  if (state === 'menu') {
    return (
      <Box flexDirection="column" paddingY={1}>
          <Box marginBottom={1}>
            <Text bold color="green">🤖 ADE CLI - AI Development Environment</Text>
          </Box>
        
        <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
          <Text color="yellow" bold>Available Actions:</Text>
          <Box flexDirection="column" marginTop={1}>
            {actions.map((action, index) => (
              <Box key={action.id}>
                <Text color={selectedIndex === index ? 'green' : 'white'}>
                  {selectedIndex === index ? '▶ ' : '  '}
                  <Text bold={selectedIndex === index} color="cyan">{action.label}</Text>
                  {' - '}
                  <Text dimColor>{action.description}</Text>
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>Use arrow keys to navigate, Enter to select, 'q' or ESC to exit</Text>
        </Box>
      </Box>
    );
  }

  if (state === 'input') {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Box marginBottom={1}>
          <Text bold color="green">🤖 ADE CLI - Message Claude Code</Text>
        </Box>
        
        <Box marginBottom={1}>
          <Text>Enter your message (ESC to cancel):</Text>
        </Box>
        
        <Box>
          <Text color="cyan">{'> '}</Text>
          <TextInput 
            value={message} 
            onChange={setMessage}
            onSubmit={handleSubmit}
          />
        </Box>
      </Box>
    );
  }

  if (state === 'processing') {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text color="yellow">Processing your request...</Text>
      </Box>
    );
  }

  if (state === 'result') {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Box marginBottom={1}>
          <Text bold color="green">Claude's Response:</Text>
        </Box>
        
        <Box borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
          <Text>{response}</Text>
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>Press Enter or ESC to continue</Text>
        </Box>
      </Box>
    );
  }

  return null;
};

render(<App />);