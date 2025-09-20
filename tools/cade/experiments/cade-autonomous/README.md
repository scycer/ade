# CADE - Claude Autonomous Development Environment

An experimental autonomous agent runner for Claude Code SDK that executes tasks from markdown files with full bypass permissions.

This experiment demonstrates how to use the Claude Code SDK in fully autonomous mode without user interaction.

## Features

- 🚀 **Fully Autonomous**: Runs with `bypassPermissions` mode - no user interaction needed
- 📄 **Markdown Task Files**: Define tasks in readable markdown format
- 🔧 **All Tools Available**: Access to all inline Claude Code tools
- 📊 **Session Tracking**: Saves session ID and complete execution logs
- 💾 **Result Persistence**: Stores all session results in JSON format
- ⚡ **Bun Powered**: Fast execution with Bun runtime

## Installation

From the `experiments/cade-autonomous` directory:

```bash
bun install
```

## Usage

### Basic Usage

```bash
# Run with default task.md file
./run.sh

# Run with specific task file
./run.sh tasks/example-analysis.md

# Or using bun directly
bun cade-agent.ts task.md

# Or using npm scripts
bun run example:simple
bun run example:analysis
bun run example:refactor
```

### Creating Task Files

Create a markdown file with your task description:

```markdown
# Task: Build a Feature

Create a new feature that:
1. Does something specific
2. Handles errors properly
3. Includes tests

Please complete all steps.
```

### Configuration

The agent runs with these settings:
- **Max Turns**: 100 (prevents runaway execution)
- **Permission Mode**: `bypassPermissions` (no prompts)
- **Output Directory**: `./cade-sessions/`
- **Default Task File**: `./task.md`

### Session Results

Each run creates a session file in `./cade-sessions/` containing:
- Session ID for future reference
- All messages exchanged
- Token usage and cost metrics
- Execution duration
- Success/failure status

## Example Tasks

### Simple Task (`task.md`)
Basic CLI tool creation with tests

### Analysis Task (`tasks/example-analysis.md`)
Project structure analysis and documentation

### Refactor Task (`tasks/example-refactor.md`)
Code refactoring and organization

## How It Works

1. **Load Task**: Reads markdown file containing task instructions
2. **Initialize Agent**: Creates Claude Code query with bypass permissions
3. **Execute Autonomously**: Runs without any user interaction
4. **Track Progress**: Logs tool usage and progress
5. **Save Results**: Stores complete session data for review

## Key Components

- `cade-agent.ts`: Main agent runner
- `task.md`: Default task file
- `tasks/`: Example task templates
- `cade-sessions/`: Session result storage

## Security Note

This agent runs with `bypassPermissions` mode, meaning it can:
- Read/write any accessible files
- Execute shell commands
- Make network requests
- Modify system files

Use with appropriate caution and only run trusted task files.

## Exit Codes

- `0`: Success - task completed
- `1`: Failure - task failed or error occurred

## Development

```bash
# Run directly
bun run cade-agent.ts

# Make executable
chmod +x cade-agent.ts
./cade-agent.ts task.md
```

## Requirements

- Bun runtime
- Claude Code SDK subscription (credentials in `~/.claude/`)
- No API key needed (uses subscription auth)