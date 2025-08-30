import React, { useState } from 'react';
import { useApp, useInput } from 'ink';
import { Menu } from './components/Menu';
import { InputPrompt } from './components/InputPrompt';
import { ProcessingView } from './components/ProcessingView';
import { ResultView } from './components/ResultView';
import { queryClaude } from './services/claude.service';
import type { AppState, Action } from './types';

const actions: Action[] = [
  { id: 'claude', label: 'Message Claude Code', description: 'Send requests to Claude to help with your development tasks' }
];

export const App: React.FC = () => {
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
    
    const result = await queryClaude({ prompt: value });
    
    if (result.success) {
      setResponse(result.result || '');
    } else {
      setResponse(`Error: ${result.error}`);
    }
    setState('result');
  };

  // Clear console on startup
  useState(() => {
    console.clear();
  });

  switch (state) {
    case 'menu':
      return <Menu actions={actions} selectedIndex={selectedIndex} />;
    case 'input':
      return <InputPrompt value={message} onChange={setMessage} onSubmit={handleSubmit} />;
    case 'processing':
      return <ProcessingView />;
    case 'result':
      return <ResultView response={response} />;
    default:
      return null;
  }
};