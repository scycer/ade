# Experiment Output: 05-streaming-input

Generated: 2025-09-20T11:03:10.308Z

---

## Test: Basic Streaming Conversation

### Prompt

```
Hello! Please introduce yourself briefly. -> What is 2 + 2? -> Thank you!
```

### Metrics

```json
{
  "duration": "1822ms",
  "messages": 0,
  "messageTypes": {},
  "cost": "N/A",
  "success": false
}
```

### Messages

### Execution Log

```

============================================================
🧪 EXPERIMENT: 05-streaming-input - Basic Streaming
============================================================
⏰ Started at: 2025-09-20T11:03:10.309Z


----------------------------------------
📋 Configuration
----------------------------------------
ℹ️  Test
   Data: "Basic Streaming"
ℹ️  Prompts to send
   Data: [
     "Hello! Please introduce yourself briefly.",
     "What is 2 + 2?",
     "Thank you!"
   ]
ℹ️  Use interrupt
   Data: false
ℹ️  Change permissions
   Data: false

----------------------------------------
📋 Execution
----------------------------------------
❌ Experiment failed
   Error: Claude Code process exited with code 1
   Stack:     at exitHandler (/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk/node_modules/@anthropic-ai/claude-code/sdk.mjs:6666:28)
       at emit (node:events:98:22)
       at #handleOnExit (node:child_process:520:14)
       at processTicksAndRejections (native:7:39)

============================================================
❌ FAILED - 05-streaming-input - Basic Streaming
⏱️  Duration: 1823ms
============================================================

```

---

## Test: Streaming with Interrupt

### Prompt

```
Count from 1 to 20 slowly -> Keep counting... -> Almost there...
```

### Metrics

```json
{
  "duration": "1637ms",
  "messages": 0,
  "messageTypes": {},
  "cost": "N/A",
  "success": false
}
```

### Messages

### Execution Log

```

============================================================
🧪 EXPERIMENT: 05-streaming-input - With Interrupt
============================================================
⏰ Started at: 2025-09-20T11:03:12.132Z


----------------------------------------
📋 Configuration
----------------------------------------
ℹ️  Test
   Data: "With Interrupt"
ℹ️  Prompts to send
   Data: [
     "Count from 1 to 20 slowly",
     "Keep counting...",
     "Almost there..."
   ]
ℹ️  Use interrupt
   Data: true
ℹ️  Change permissions
   Data: false

----------------------------------------
📋 Execution
----------------------------------------
❌ Experiment failed
   Error: Claude Code process exited with code 1
   Stack:     at exitHandler (/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk/node_modules/@anthropic-ai/claude-code/sdk.mjs:6666:28)
       at emit (node:events:98:22)
       at #handleOnExit (node:child_process:520:14)
       at processTicksAndRejections (native:7:39)

============================================================
❌ FAILED - 05-streaming-input - With Interrupt
⏱️  Duration: 1637ms
============================================================

```

---

## Test: Permission Mode Changes

### Prompt

```
I need to create a file -> Create test-streaming.txt with content "Hello from streaming" -> Now read that file back
```

### Metrics

```json
{
  "duration": "1664ms",
  "messages": 0,
  "messageTypes": {},
  "cost": "N/A",
  "success": false
}
```

### Messages

### Execution Log

```

============================================================
🧪 EXPERIMENT: 05-streaming-input - Permission Changes
============================================================
⏰ Started at: 2025-09-20T11:03:13.769Z


----------------------------------------
📋 Configuration
----------------------------------------
ℹ️  Test
   Data: "Permission Changes"
ℹ️  Prompts to send
   Data: [
     "I need to create a file",
     "Create test-streaming.txt with content \"Hello from streaming\"",
     "Now read that file back"
   ]
ℹ️  Use interrupt
   Data: false
ℹ️  Change permissions
   Data: true

----------------------------------------
📋 Execution
----------------------------------------
❌ Experiment failed
   Error: Claude Code process exited with code 1
   Stack:     at exitHandler (/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk/node_modules/@anthropic-ai/claude-code/sdk.mjs:6666:28)
       at emit (node:events:98:22)
       at #handleOnExit (node:child_process:520:14)
       at processTicksAndRejections (native:7:39)

============================================================
❌ FAILED - 05-streaming-input - Permission Changes
⏱️  Duration: 1664ms
============================================================

```

---

## Test: Complex Conversation Flow

### Prompt

```
Let's play a word association game -> I say "sun", you respond with a related word -> Moon -> Stars -> Great job! Game over.
```

### Metrics

```json
{
  "duration": "1618ms",
  "messages": 0,
  "messageTypes": {},
  "cost": "N/A",
  "success": false
}
```

### Messages

### Execution Log

```

============================================================
🧪 EXPERIMENT: 05-streaming-input - Complex Flow
============================================================
⏰ Started at: 2025-09-20T11:03:15.433Z


----------------------------------------
📋 Configuration
----------------------------------------
ℹ️  Test
   Data: "Complex Flow"
ℹ️  Prompts to send
   Data: [
     "Let's play a word association game",
     "I say \"sun\", you respond with a related word",
     "Moon",
     "Stars",
     "Great job! Game over."
   ]
ℹ️  Use interrupt
   Data: false
ℹ️  Change permissions
   Data: false

----------------------------------------
📋 Execution
----------------------------------------
❌ Experiment failed
   Error: Claude Code process exited with code 1
   Stack:     at exitHandler (/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk/node_modules/@anthropic-ai/claude-code/sdk.mjs:6666:28)
       at emit (node:events:98:22)
       at #handleOnExit (node:child_process:520:14)
       at processTicksAndRejections (native:7:39)

============================================================
❌ FAILED - 05-streaming-input - Complex Flow
⏱️  Duration: 1618ms
============================================================

```

---

## Streaming Analysis

```json
{
  "test1": {
    "flow": []
  },
  "test2": {
    "interruptDetails": {
      "used": false,
      "messageCount": 0
    }
  },
  "test3": {
    "permissionChanges": []
  },
  "test4": {
    "conversationSummary": {
      "turns": 0,
      "prompts": 0
    }
  }
}
```

## Summary

| Test | Result | Details |
| --- | --- | --- |
| Basic Streaming | ❌ Failed | {"promptsSent":0,"conversationTurns":0} |
| With Interrupt | ❌ Failed | {"interruptUsed":false,"messagesBeforeInterrupt":0} |
| Permission Mode Changes | ❌ Failed | {"permissionChanges":[],"promptsSent":0} |
| Complex Conversation Flow | ❌ Failed | {"conversationLength":0,"promptsSent":0} |
