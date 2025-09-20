# Claude Code SDK Progressive Learning Plan

This directory contains progressive experiments to test each feature of the Claude Code TypeScript SDK. Each example follows a consistent structure with a main SDK function and a tester function for logging and validation.

## Structure Pattern

Each experiment file contains:
1. **SDK Setup Function**: Configures and returns a query with specific features
2. **Tester Function**: Runs the SDK function, logs details, measures success
3. **Main Execution**: Orchestrates the test with timing and results

## Experiments Sequence

### Phase 1: Basic Foundation
- `01-basic-query.ts` - Simple one-shot query with string prompt
- `02-with-options.ts` - Basic options (model, cwd, maxTurns, env)

### Phase 2: Message Handling
- `03-message-types.ts` - Handle different SDKMessage types and results
- `04-partial-messages.ts` - Stream partial assistant responses

### Phase 3: Interactive Features
- `05-streaming-input.ts` - AsyncIterable input with interrupt capability
- `06-session-management.ts` - Continue and resume sessions

### Phase 4: Permission Control
- `07-permission-modes.ts` - Test all permission modes
- `08-custom-permissions.ts` - Custom canUseTool function
- `09-tool-filtering.ts` - allowedTools/disallowedTools

### Phase 5: MCP Servers
- `10-mcp-stdio.ts` - Configure stdio MCP server
- `11-mcp-network.ts` - SSE and HTTP MCP servers
- `12-sdk-mcp-server.ts` - Custom SDK MCP server with tools

### Phase 6: Hooks System
- `13-basic-hooks.ts` - PreToolUse and PostToolUse hooks
- `14-advanced-hooks.ts` - Lifecycle and control hooks
- `15-hook-matchers.ts` - Selective hook application

### Phase 7: Advanced Configuration
- `16-custom-prompts.ts` - System prompt customization
- `17-additional-directories.ts` - Extended file access
- `18-executables.ts` - Runtime configuration

### Phase 8: Error Handling & Recovery
- `19-error-handling.ts` - Error scenarios and recovery
- `20-complete-example.ts` - Combined features demonstration

## Running Experiments

Each experiment can be run independently:
```bash
bun run experiments/claude-code-sdk/01-basic-query.ts
```

Or run all experiments in sequence:
```bash
bun run experiments/claude-code-sdk/run-all.ts
```

## Common Utilities

- `utils/logger.ts` - Consistent logging utilities
- `utils/metrics.ts` - Performance and success measurement
- `utils/types.ts` - Shared type definitions

## Success Criteria

Each experiment validates:
1. **Functionality**: Does the feature work as expected?
2. **Performance**: Timing and resource usage
3. **Error Handling**: Graceful failure scenarios
4. **Output Quality**: Correct message types and data

## Notes

- All experiments use the subscription-based authentication (no API key required)
- Each file is self-contained and can be studied independently
- Logging is verbose to aid understanding of SDK behavior
- Error scenarios are intentionally tested where applicable