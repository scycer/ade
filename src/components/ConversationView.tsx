import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface ConversationViewProps {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  onSubmit: (value: string) => Promise<void>;
  sessionId?: string;
  title?: string;
}

export const ConversationView: React.FC<ConversationViewProps> = ({ messages, onSubmit, sessionId, title }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setInput('');
    await onSubmit(value);
    setIsProcessing(false);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">{title || '🤖 Multi-turn Chat'}</Text>
      </Box>
      
      {sessionId && (
        <Box marginBottom={1}>
          <Text dimColor>Session: {sessionId.substring(0, 8)}...</Text>
        </Box>
      )}
      
      <Box marginBottom={1}>
        <Text dimColor>
          💡 Tips: Type "weather in [city]" to test weather tool | ESC to exit
        </Text>
      </Box>
      
      <Box flexDirection="column" marginBottom={1} borderStyle="single" borderColor="gray" padding={1}>
        {messages.length === 0 ? (
          <Text dimColor italic>No messages yet. Start the conversation!</Text>
        ) : (
          <Box flexDirection="column">
            {messages.map((msg, index) => (
              <Box key={index} marginBottom={index < messages.length - 1 ? 1 : 0}>
                <Box marginRight={1}>
                  <Text bold color={msg.role === 'user' ? 'green' : 'blue'}>
                    {msg.role === 'user' ? '👤 You:' : '🤖 Claude:'}
                  </Text>
                </Box>
                <Box flexGrow={1}>
                  <Text wrap="wrap">{msg.content}</Text>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      
      <Box>
        <Box marginRight={1}>
          <Text bold color="yellow">{'>'}</Text>
        </Box>
        {isProcessing ? (
          <Text dimColor italic>Processing...</Text>
        ) : (
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Type your message..."
          />
        )}
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>
          Available tools: WebSearch, Read, Bash | Weather demo built-in
        </Text>
      </Box>
    </Box>
  );
};