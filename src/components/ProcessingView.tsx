import React from 'react';
import { Text, Box } from 'ink';

export const ProcessingView: React.FC = () => {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Text color="yellow">Processing your request...</Text>
    </Box>
  );
};