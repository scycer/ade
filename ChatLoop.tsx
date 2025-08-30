import { useState, useEffect } from 'react';
import { Text, Box, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { query, createSdkMcpServer, tool } from '@anthropic-ai/claude-code';
import { z } from 'zod';
import * as fs from 'fs/promises';
import { claudeConfig } from './config';

// Create a custom MCP server with inline tools
const customToolsServer = createSdkMcpServer({
  name: "CustomTools",
  version: "1.0.0",
  tools: [
    tool(
      "get_timestamp",
      "Get the current timestamp with a custom message",
      { message: z.string().describe("Message to include with timestamp") },
      async ({ message }) => {
        const timestamp = new Date().toISOString();
        console.log(`[TOOL CALLED] get_timestamp at ${timestamp}`);
        return {
          content: [{
            type: "text",
            text: `${message} - Current time: ${timestamp}`
          }]
        };
      }
    ),
    tool(
      "count_files",
      "Count files in a directory",
      { directory: z.string().describe("Directory path to count files in") },
      async ({ directory }) => {
        try {
          const files = await fs.readdir(directory);
          const count = files.length;
          console.log(`[TOOL CALLED] count_files: ${count} files in ${directory}`);
          return {
            content: [{
              type: "text",
              text: `Found ${count} files in ${directory}: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: "text",
              text: `Error accessing directory: ${error.message}`
            }]
          };
        }
      }
    )
  ]
});

// Comprehensive hook logging
const createLoggingHooks = () => {
  const hookLogger = (hookName: string) => {
    return async (input: any, toolUseId: string | undefined) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        hook: hookName,
        sessionId: input.session_id,
        toolUseId,
        details: {} as any
      };

      // Add hook-specific details
      switch (hookName) {
        case 'PreToolUse':
          logEntry.details = {
            tool: input.tool_name,
            input: input.tool_input
          };
          break;
        case 'PostToolUse':
          logEntry.details = {
            tool: input.tool_name,
            input: input.tool_input,
            response: input.tool_response
          };
          break;
        case 'UserPromptSubmit':
          logEntry.details = {
            prompt: input.prompt
          };
          break;
        case 'SessionStart':
          logEntry.details = {
            source: input.source
          };
          break;
        case 'SessionEnd':
          logEntry.details = {
            reason: input.reason
          };
          break;
      }

      console.log(`\n[HOOK] ${hookName}:`, JSON.stringify(logEntry, null, 2));

      // Return appropriate response
      if (hookName === 'PreToolUse') {
        // Example: Add confirmation for dangerous operations
        if (input.tool_name === 'Bash' && input.tool_input?.command?.includes('rm')) {
          console.log('[HOOK] Dangerous operation detected!');
        }
      }

      return { continue: true };
    };
  };

  return {
    PreToolUse: [{
      hooks: [hookLogger('PreToolUse')]
    }],
    PostToolUse: [{
      hooks: [hookLogger('PostToolUse')]
    }],
    UserPromptSubmit: [{
      hooks: [hookLogger('UserPromptSubmit')]
    }],
    SessionStart: [{
      hooks: [hookLogger('SessionStart')]
    }],
    SessionEnd: [{
      hooks: [hookLogger('SessionEnd')]
    }],
    Notification: [{
      hooks: [hookLogger('Notification')]
    }]
  };
};

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
};

interface ChatLoopProps {
  onExit?: () => void;
}

const ChatLoop = ({ onExit }: ChatLoopProps) => {
  const { exit } = useApp();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      if (onExit) {
        onExit();
      } else {
        exit();
      }
    }
  });

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: value,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      let assistantResponse = '';
      
      for await (const message of query({
        prompt: value,
        options: {
          // Use config from shared config file
          ...claudeConfig.defaultOptions,
          pathToClaudeCodeExecutable: claudeConfig.pathToClaudeCodeExecutable,
          executable: claudeConfig.executable,
          
          // Configure hooks
          hooks: createLoggingHooks(),
          
          // Configure MCP servers
          mcpServers: {
            custom: customToolsServer
          },
          
          // Allow our custom tools and standard tools
          allowedTools: [
            "mcp__custom__get_timestamp",
            "mcp__custom__count_files",
            "Read",
            "Grep",
            "Bash"
          ],
          
          // Continue session if exists
          resume: sessionId || undefined,
          
          // Limit turns for demo
          maxTurns: 3,
          
          // Custom system prompt
          appendSystemPrompt: "You have access to custom tools: get_timestamp and count_files. Use them when appropriate."
        }
      })) {
        // Log message types
        console.log(`[MESSAGE] Type: ${message.type}, Subtype: ${(message as any).subtype || 'N/A'}`);
        
        if (message.type === "system" && message.subtype === "init") {
          setSessionId(message.session_id);
          console.log(`[SESSION] Initialized: ${message.session_id}`);
          console.log(`[SESSION] Available tools:`, message.tools);
          console.log(`[SESSION] MCP Servers:`, message.mcp_servers);
        }
        
        if (message.type === "assistant") {
          // Extract text content from assistant messages
          const textContent = message.message.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('\n');
          
          if (textContent) {
            assistantResponse += textContent;
          }
        }
        
        if (message.type === "result") {
          if (message.subtype === "success") {
            assistantResponse = message.result;
            console.log(`[RESULT] Success - Cost: $${message.total_cost_usd}, Duration: ${message.duration_ms}ms`);
            console.log(`[RESULT] Usage:`, message.usage);
          } else {
            assistantResponse = `Error: ${message.subtype}`;
            console.log(`[RESULT] Error:`, message.subtype);
          }
        }
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: assistantResponse || 'No response',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('[ERROR]', error);
      const errorMessage: ChatMessage = {
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Box borderStyle="round" borderColor="cyan" flexDirection="column" flexGrow={1} padding={1}>
        <Text bold color="green">🤖 Claude Chat with Hook Logging</Text>
        <Text dimColor>Session: {sessionId || 'Not initialized'} | Press ESC to return to menu</Text>
        <Box marginTop={1} flexDirection="column">
          {messages.slice(-10).map((msg, i) => (
            <Box key={i} marginBottom={1}>
              <Text bold color={
                msg.role === 'user' ? 'blue' : 
                msg.role === 'assistant' ? 'green' : 'yellow'
              }>
                {msg.role === 'user' ? 'You: ' : 
                 msg.role === 'assistant' ? 'Claude: ' : 'System: '}
              </Text>
              <Text wrap="wrap">{msg.content.substring(0, 200)}{msg.content.length > 200 ? '...' : ''}</Text>
            </Box>
          ))}
          {isProcessing && (
            <Box>
              <Text color="yellow">Processing...</Text>
            </Box>
          )}
        </Box>
      </Box>
      
      <Box marginTop={1}>
        <Text bold>{'> '}</Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="Type your message..."
        />
      </Box>
      
      <Box marginTop={1}>
        <Text dimColor>
          Try: "What time is it?" | "Count files in ." | "Show me the package.json"
        </Text>
      </Box>
    </Box>
  );
};

export default ChatLoop;