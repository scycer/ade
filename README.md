# ADE - AI Development Environment

A Terminal User Interface (TUI) for interacting with multiple AI models including Claude Code and OpenRouter's GPT-OSS-120B, featuring multi-turn conversations, tool calling, and weather demonstrations.

## Features

### 🤖 Multi-Model Support
- **Claude Code**: Anthropic's Claude via the Claude Code SDK
- **OpenRouter Integration**: Access to GPT-OSS-120B and 300+ other models
- **Mastra Framework**: Built-in support for agent creation and tool calling

### 💬 Multi-Turn Chat
- **Session Management**: Conversations maintain context across multiple messages
- **No Turn Limits**: Default `maxTurns: 999` for unlimited conversation
- **Session Persistence**: Resume previous sessions using session IDs
- **Hook Callbacks**: Monitor all message types and events

### 🛠️ Tool Calling Support
- **Claude Code Tools**: WebSearch, Read, Bash, and more
- **Weather Demo**: Built-in mock weather tool for testing
- **Real-time Execution**: Tools execute during conversation flow

### 💬 Conversation Features
- **Message History**: Full conversation history display
- **Role Indicators**: Clear user/assistant message differentiation
- **Session Tracking**: Display current session ID
- **Cost Monitoring**: Track API usage costs per turn

## Installation

```bash
# Install dependencies
bun install

# Run the TUI (interactive mode)
bun run index.tsx

# Run the test script
bun run test-chat.ts

# Run examples
bun run src/examples/multi-turn-chat.example.ts
bun run src/examples/simple-test.ts
```

## Usage

### TUI Navigation
- **Arrow Keys**: Navigate menu options
- **Enter**: Select an option
- **ESC**: Go back or exit
- **q**: Quit application

### Menu Options

#### 1. Message Claude Code
Single message to Claude with response.

#### 2. Multi-turn Chat
Interactive conversation mode with Claude:
- Continuous conversation in same session
- Weather tool demonstrations (type "weather in [city]")
- Full message history display
- Session ID tracking

#### 3. Weather Demo
Test the weather tool functionality with multiple cities.

#### 4. OpenRouter GPT-OSS-120B
Single query to GPT-OSS-120B model via OpenRouter API.

#### 5. OpenRouter Multi-turn Chat
Interactive conversation with GPT-OSS-120B:
- Persistent conversation history
- Model information display
- Token usage tracking

### Weather Tool Examples
In conversation mode, try:
- "What's the weather in San Francisco, CA?"
- "Check weather for New York, NY and London, UK"
- "Tell me about the weather in Paris, FR"

## API Configuration

### Claude API
Set your Claude API key:
```bash
export ANTHROPIC_API_KEY="your-api-key"
```

### OpenRouter API
Set your OpenRouter API key:
```bash
export OPENROUTER_API_KEY="your-api-key"
```

1. Sign up at [OpenRouter](https://openrouter.ai)
2. Get your API key from the dashboard
3. Set the environment variable as shown above

Or configure in the respective service files.

## Architecture

### Core Components
- **ClaudeChat**: Session-based conversation manager
- **ConversationView**: React component for chat UI
- **Weather Tools**: Mock implementations for testing

### Key Files
- `src/services/claude.service.ts` - Claude integration with multi-turn support
- `src/services/openrouter.service.ts` - OpenRouter integration with OpenAI SDK
- `src/components/ConversationView.tsx` - Chat UI component
- `src/App.tsx` - Main TUI application
- `test-chat.ts` - Test script for Claude features
- `test-openrouter.ts` - Test script for OpenRouter features

## Development

### Testing Features

#### Test Claude Integration
```bash
bun run test-chat.ts
```

#### Test OpenRouter Integration
```bash
bun run test-openrouter.ts
```

#### Weather Tool (No API Key Required)
```typescript
import { getMockWeatherData } from './src/services/claude.service';

const weather = getMockWeatherData('San Francisco, CA', 'fahrenheit');
console.log(weather);
```

### Custom Tools
While client-side tool execution isn't directly supported by the SDK, you can:
1. Define tool schemas for the API
2. Handle special commands locally (like weather)
3. Use MCP servers for advanced tools

## Features Summary

✅ **Multi-Model Support** - Claude Code and OpenRouter (GPT-OSS-120B + 300+ models)
✅ **Multi-turn Conversations** - Unlimited back-and-forth chat
✅ **Session Management** - Automatic session tracking and resumption  
✅ **Weather Tool** - Built-in mock weather for any city
✅ **Hook System** - Monitor all SDK events and messages
✅ **Cost Tracking** - See API costs per conversation turn
✅ **Tool Support** - WebSearch, Read, Bash, and custom tools
✅ **Conversation History** - Full message history with roles
✅ **No Turn Limits** - Default 999 turns (effectively unlimited)
✅ **Mastra Integration** - Agent framework for advanced AI applications

## Troubleshooting

### TUI Not Working
The TUI requires an interactive terminal. Run directly in terminal:
```bash
bun run index.tsx
```

### Model Switching
The TUI automatically routes to the appropriate service based on your menu selection:
- Claude options use the Claude Code SDK
- OpenRouter options use the OpenAI SDK with OpenRouter endpoint

### Available OpenRouter Models
While configured for GPT-OSS-120B by default, OpenRouter provides access to 300+ models including:
- GPT-4, GPT-3.5
- Claude models
- Llama models
- Mistral models
- And many more

Modify `src/services/openrouter.service.ts` to use different models.

## License

MIT