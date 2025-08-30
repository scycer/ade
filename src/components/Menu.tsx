import React from 'react';
import { Text, Box } from 'ink';
import type { Action } from '../types';

interface MenuProps {
  actions: Action[];
  selectedIndex: number;
}

export const Menu: React.FC<MenuProps> = ({ actions, selectedIndex }) => {
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
};