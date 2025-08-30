import React from 'react';
import { Text, Box } from 'ink';
import TextInput from 'ink-text-input';

interface InputPromptProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

export const InputPrompt: React.FC<InputPromptProps> = ({ value, onChange, onSubmit }) => {
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
          value={value} 
          onChange={onChange}
          onSubmit={onSubmit}
        />
      </Box>
    </Box>
  );
};