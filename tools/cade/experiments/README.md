# Claude Code SDK Experiments

This directory contains various experiments with the Claude Code SDK.

## Experiments

### 1. claude-code-sdk/
Complete test suite demonstrating all SDK features:
- Basic queries and message handling
- Permission modes (default, acceptEdits, bypassPermissions, plan)
- Session management and continuations
- MCP server integration
- Custom hooks and permissions
- Tool filtering and additional directories
- Error handling and streaming input
- Complete integration examples

### 2. cade-autonomous/
**CADE (Claude Autonomous Development Environment)**
- Fully autonomous agent that runs tasks from markdown files
- Uses `bypassPermissions` mode for unattended operation
- Captures session data and metrics
- Example tasks included for testing

## Running Experiments

### Claude Code SDK Tests
```bash
cd claude-code-sdk
bun 01-basic-query.ts   # Run individual experiments
bun 07-permission-modes.ts
```

### CADE Autonomous Agent
```bash
cd cade-autonomous
./run.sh task.md        # Run with task file
bun run example:simple  # Run example tasks
```

## Key Learnings

1. **Permission Modes**: The `permissionMode` must be set in the `options` object, not at the root level
2. **Authentication**: SDK uses subscription credentials from `~/.claude/credentials.json`
3. **Autonomous Operation**: `bypassPermissions` mode enables fully autonomous execution
4. **Session Management**: Sessions can be continued or resumed with proper IDs

## Notes

- All experiments require the Claude Code SDK subscription
- No API keys needed when using subscription authentication
- Experiments generate output files in their respective directories