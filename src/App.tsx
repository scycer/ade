import React, { useState, useRef } from 'react';
import { useApp, useInput } from 'ink';
import { Menu } from './components/Menu';
import { InputPrompt } from './components/InputPrompt';
import { ProcessingView } from './components/ProcessingView';
import { ResultView } from './components/ResultView';
import { ConversationView } from './components/ConversationView';
import { ClaudeChat, getWeatherToolDefinition, getMockWeatherData } from './services/claude.service';
import { OpenRouterChat, queryOpenRouter, isOpenRouterAvailable } from './services/openrouter.service';
import type { AppState, Action } from './types';

const actions: Action[] = [
  { id: 'claude', label: 'Message Claude Code', description: 'Send requests to Claude to help with your development tasks' },
  { id: 'chat', label: 'Multi-turn Chat', description: 'Have a conversation with Claude with tool calling support' },
  { id: 'weather', label: 'Weather Demo', description: 'Test the weather tool functionality' },
  { id: 'openrouter', label: 'OpenRouter GPT-OSS-120B', description: 'Chat with GPT-OSS-120B via OpenRouter API' },
  { id: 'openrouter-chat', label: 'OpenRouter Multi-turn Chat', description: 'Multi-turn conversation with GPT-OSS-120B' }
];

export const App: React.FC = () => {
  const { exit } = useApp();
  const [state, setState] = useState<AppState>('menu');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [currentAction, setCurrentAction] = useState<string>('');
  const [conversation, setConversation] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const chatRef = useRef<ClaudeChat | null>(null);
  const openRouterChatRef = useRef<OpenRouterChat | null>(null);
  
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
        const action = actions[selectedIndex];
        setCurrentAction(action.id);
        if (action.id === 'chat' || action.id === 'openrouter-chat') {
          setState('conversation');
        } else {
          setState('input');
        }
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
        setCurrentAction('');
      }
    } else if (state === 'conversation') {
      if (key.escape) {
        setState('menu');
        setConversation([]);
        chatRef.current = null;
        openRouterChatRef.current = null;
        setCurrentAction('');
      }
    }
  });

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;
    
    if (currentAction === 'weather') {
      // Demo weather tool
      setState('processing');
      const locations = value.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*,? ?[A-Z]{2})/g) || ['San Francisco, CA'];
      let weatherResults = [];
      
      for (const location of locations) {
        const weather = getMockWeatherData(location, 'fahrenheit');
        weatherResults.push(weather);
      }
      
      setResponse(weatherResults.join('\n\n'));
      setState('result');
    } else if (currentAction === 'openrouter') {
      // OpenRouter single query
      setState('processing');
      
      if (!isOpenRouterAvailable()) {
        setResponse('Error: OPENROUTER_API_KEY not configured. Please set the environment variable.');
        setState('result');
        return;
      }
      
      const result = await queryOpenRouter(value, {
        systemPrompt: 'You are a helpful AI assistant powered by GPT-OSS-120B.'
      });
      
      if (result.success) {
        setResponse(`${result.result}\n\n[Model: ${result.model}]`);
      } else {
        setResponse(`Error: ${result.error}`);
      }
      setState('result');
    } else {
      // Regular Claude query
      setState('processing');
      
      if (!chatRef.current) {
        chatRef.current = new ClaudeChat({
          onHook: (type, data) => {
            if (type === 'system' && data.subtype === 'init') {
              console.log(`Session: ${data.session_id}`);
            }
          }
        });
      }
      
      const result = await chatRef.current.sendMessage(value, {
        allowedTools: ['WebSearch', 'Read', 'Bash']
      });
      
      if (result.success) {
        setResponse(result.result || '');
      } else {
        setResponse(`Error: ${result.error}`);
      }
      setState('result');
    }
  };
  
  const handleConversationSubmit = async (value: string) => {
    if (!value.trim()) return;
    
    // Add user message to conversation
    const newConversation = [...conversation, { role: 'user' as const, content: value }];
    setConversation(newConversation);
    
    // Handle OpenRouter chat
    if (currentAction === 'openrouter-chat') {
      if (!isOpenRouterAvailable()) {
        setConversation([...newConversation, { 
          role: 'assistant' as const, 
          content: 'Error: OPENROUTER_API_KEY not configured. Please set the environment variable.' 
        }]);
        return;
      }
      
      if (!openRouterChatRef.current) {
        openRouterChatRef.current = new OpenRouterChat({
          systemPrompt: 'You are a helpful AI assistant powered by GPT-OSS-120B via OpenRouter.',
          model: 'openai/gpt-oss-120b'
        });
      }
      
      const result = await openRouterChatRef.current.sendMessage(value);
      
      if (result.success && result.result) {
        setConversation([...newConversation, { 
          role: 'assistant' as const, 
          content: `${result.result}\n\n[Model: ${result.model}]` 
        }]);
      } else {
        setConversation([...newConversation, { 
          role: 'assistant' as const, 
          content: `Error: ${result.error || 'Unknown error'}` 
        }]);
      }
      return;
    }
    
    // Initialize chat if needed
    if (!chatRef.current) {
      chatRef.current = new ClaudeChat({
        onHook: (type, data) => {
          if (type === 'system' && data.subtype === 'init') {
            console.log(`Chat session started: ${data.session_id}`);
          } else if (type === 'result') {
            console.log(`Turn completed. Cost: $${data.total_cost_usd}`);
          }
        }
      });
    }
    
    // Handle special weather commands
    if (value.toLowerCase().includes('weather')) {
      const locations = value.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*,? ?[A-Z]{2})/g) || [];
      if (locations.length > 0) {
        let weatherData = [];
        for (const location of locations) {
          weatherData.push(getMockWeatherData(location, 'fahrenheit'));
        }
        const weatherResponse = weatherData.join('\n');
        setConversation([...newConversation, { role: 'assistant' as const, content: weatherResponse }]);
        return;
      }
    }
    
    // Send to Claude
    const result = await chatRef.current.sendMessage(value, {
      allowedTools: ['WebSearch', 'Read', 'Bash'],
      maxTurns: undefined // No limit
    });
    
    if (result.success && result.result) {
      setConversation([...newConversation, { role: 'assistant' as const, content: result.result }]);
    } else {
      setConversation([...newConversation, { role: 'assistant' as const, content: `Error: ${result.error || 'Unknown error'}` }]);
    }
  };

  // Clear console on startup
  useState(() => {
    console.clear();
  });

  switch (state) {
    case 'menu':
      return <Menu actions={actions} selectedIndex={selectedIndex} />;
    case 'input':
      const placeholders: Record<string, string> = {
        weather: 'Enter cities (e.g., San Francisco, CA)',
        openrouter: 'Ask GPT-OSS-120B anything...',
        default: 'Enter your message'
      };
      return <InputPrompt 
        value={message} 
        onChange={setMessage} 
        onSubmit={handleSubmit}
        placeholder={placeholders[currentAction] || placeholders.default}
      />;
    case 'processing':
      return <ProcessingView />;
    case 'result':
      return <ResultView response={response} />;
    case 'conversation':
      const sessionId = currentAction === 'openrouter-chat' 
        ? 'openrouter-session' 
        : chatRef.current?.getSessionId();
      const title = currentAction === 'openrouter-chat'
        ? '🤖 OpenRouter GPT-OSS-120B Chat'
        : '🤖 Multi-turn Chat with Claude';
      return <ConversationView 
        messages={conversation} 
        onSubmit={handleConversationSubmit}
        sessionId={sessionId}
        title={title}
      />;
    default:
      return null;
  }
};