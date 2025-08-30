import React from 'react';
import { Text, Box } from 'ink';

interface ResultViewProps {
  response: string;
}

export const ResultView: React.FC<ResultViewProps> = ({ response }) => {
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
};