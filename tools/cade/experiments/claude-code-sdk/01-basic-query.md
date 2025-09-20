# Experiment Output: 01-basic-query

Generated: 2025-09-20T07:55:14.940Z

---

## Test: Simple Calculation

### Prompt

```
What is 42 + 58? Just give me the number.
```

### Metrics

```json
{
  "duration": "5745ms",
  "messages": 3,
  "messageTypes": {
    "system": 1,
    "assistant": 1,
    "result": 1
  },
  "tokens": {
    "input": 4,
    "output": 5,
    "cacheCreation": 5651,
    "cacheRead": 11897
  },
  "cost": "$0.124351",
  "success": true
}
```

### Messages

#### SYSTEM Message
*Subtype: init*

```json
{
  "session_id": "bf20501c-6cae-402b-9b26-b59b2690f452",
  "model": "claude-opus-4-1-20250805",
  "tools": 16,
  "cwd": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk"
}
```

#### ASSISTANT Message
```json
{
  "content": [
    {
      "type": "text",
      "text": "100"
    }
  ],
  "uuid": "3f9abf18-1e26-4af0-bef4-e8ae2f09b53d"
}
```

#### RESULT Message
```json
{
  "subtype": "success",
  "duration_ms": 2900,
  "num_turns": 1,
  "total_cost_usd": 0.12435115000000001,
  "usage": {
    "input_tokens": 4,
    "cache_creation_input_tokens": 5651,
    "cache_read_input_tokens": 11897,
    "output_tokens": 5,
    "server_tool_use": {
      "web_search_requests": 0
    },
    "service_tier": "standard",
    "cache_creation": {
      "ephemeral_1h_input_tokens": 0,
      "ephemeral_5m_input_tokens": 5651
    }
  }
}
```

### Execution Log

```

============================================================
🧪 EXPERIMENT: 01-basic-query - Calculation
============================================================
⏰ Started at: 2025-09-20T07:55:14.940Z


----------------------------------------
📋 Configuration
----------------------------------------
ℹ️  Prompt
   Data: "What is 42 + 58? Just give me the number."
ℹ️  Options
   Data: {
     "maxTurns": 1
   }

----------------------------------------
📋 Execution
----------------------------------------
✅ System initialized
   Data: {
     "sessionId": "bf20501c-6cae-402b-9b26-b59b2690f452",
     "model": "claude-opus-4-1-20250805",
     "tools": 16,
     "cwd": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk"
   }

🤖 ASSISTANT Message:
   [
     {
       "type": "text",
       "text": "100"
     }
   ]
✅ Query completed successfully
   Data: {
     "turns": 1,
     "duration": "2900ms",
     "tokens": {
       "input_tokens": 4,
       "cache_creation_input_tokens": 5651,
       "cache_read_input_tokens": 11897,
       "output_tokens": 5,
       "server_tool_use": {
         "web_search_requests": 0
       },
       "service_tier": "standard",
       "cache_creation": {
         "ephemeral_1h_input_tokens": 0,
         "ephemeral_5m_input_tokens": 5651
       }
     },
     "cost": "$0.124351"
   }

----------------------------------------
📋 Metrics Summary
----------------------------------------
ℹ️  Summary
Duration: 5745ms
Messages: 3
Message Types: system(1), assistant(1), result(1)
Tokens: in=4, out=5
Cost: $0.124351
Status: SUCCESS

============================================================
✅ SUCCESS - 01-basic-query - Calculation
⏱️  Duration: 5745ms
📝 Details: {
     "totalMessages": 3,
     "messageTypes": [
       "system",
       "assistant",
       "result"
     ]
   }
============================================================

```

---

## Test: Code Generation

### Prompt

```
Write a TypeScript function that reverses a string. Just the code, no explanation.
```

### Metrics

```json
{
  "duration": "4619ms",
  "messages": 3,
  "messageTypes": {
    "system": 1,
    "assistant": 1,
    "result": 1
  },
  "tokens": {
    "input": 4,
    "output": 34,
    "cacheCreation": 2385,
    "cacheRead": 15166
  },
  "cost": "$0.070078",
  "success": true
}
```

### Messages

#### SYSTEM Message
*Subtype: init*

```json
{
  "session_id": "97b85ce1-43f7-407f-9d0e-eb687190d4c9",
  "model": "claude-opus-4-1-20250805",
  "tools": 16,
  "cwd": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk"
}
```

#### ASSISTANT Message
```json
{
  "content": [
    {
      "type": "text",
      "text": "```typescript\nfunction reverseString(str: string): string {\n  return str.split('').reverse().join('');\n}\n```"
    }
  ],
  "uuid": "5b5753af-a62f-49d2-9f7f-9cee725f512a"
}
```

#### RESULT Message
```json
{
  "subtype": "success",
  "duration_ms": 2671,
  "num_turns": 1,
  "total_cost_usd": 0.07007775000000001,
  "usage": {
    "input_tokens": 4,
    "cache_creation_input_tokens": 2385,
    "cache_read_input_tokens": 15166,
    "output_tokens": 34,
    "server_tool_use": {
      "web_search_requests": 0
    },
    "service_tier": "standard",
    "cache_creation": {
      "ephemeral_1h_input_tokens": 0,
      "ephemeral_5m_input_tokens": 2385
    }
  }
}
```

### Execution Log

```

============================================================
🧪 EXPERIMENT: 01-basic-query - Code Gen
============================================================
⏰ Started at: 2025-09-20T07:55:20.685Z


----------------------------------------
📋 Configuration
----------------------------------------
ℹ️  Prompt
   Data: "Write a TypeScript function that reverses a string. Just the code, no explanation."
ℹ️  Options
   Data: {
     "maxTurns": 1
   }

----------------------------------------
📋 Execution
----------------------------------------
✅ System initialized
   Data: {
     "sessionId": "97b85ce1-43f7-407f-9d0e-eb687190d4c9",
     "model": "claude-opus-4-1-20250805",
     "tools": 16,
     "cwd": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk"
   }

🤖 ASSISTANT Message:
   [
     {
       "type": "text",
       "text": "```typescript\nfunction reverseString(str: string): string {\n  return str.split('').reverse().join('');\n}\n```"
     }
   ]
✅ Query completed successfully
   Data: {
     "turns": 1,
     "duration": "2671ms",
     "tokens": {
       "input_tokens": 4,
       "cache_creation_input_tokens": 2385,
       "cache_read_input_tokens": 15166,
       "output_tokens": 34,
       "server_tool_use": {
         "web_search_requests": 0
       },
       "service_tier": "standard",
       "cache_creation": {
         "ephemeral_1h_input_tokens": 0,
         "ephemeral_5m_input_tokens": 2385
       }
     },
     "cost": "$0.070078"
   }

----------------------------------------
📋 Metrics Summary
----------------------------------------
ℹ️  Summary
Duration: 4619ms
Messages: 3
Message Types: system(1), assistant(1), result(1)
Tokens: in=4, out=34
Cost: $0.070078
Status: SUCCESS

============================================================
✅ SUCCESS - 01-basic-query - Code Gen
⏱️  Duration: 4619ms
📝 Details: {
     "totalMessages": 3,
     "messageTypes": [
       "system",
       "assistant",
       "result"
     ]
   }
============================================================

```

---

## Test: Tool Usage

### Prompt

```
What files are in the current directory? List just the names.
```

### Metrics

```json
{
  "duration": "5887ms",
  "messages": 5,
  "messageTypes": {
    "system": 1,
    "assistant": 2,
    "user": 1,
    "result": 1
  },
  "tokens": {
    "input": 4,
    "output": 88,
    "cacheCreation": 2380,
    "cacheRead": 15166
  },
  "cost": "$0.074174",
  "success": true
}
```

### Messages

#### SYSTEM Message
*Subtype: init*

```json
{
  "session_id": "b532b6dd-92d6-466e-81b5-96d0c4ff134c",
  "model": "claude-opus-4-1-20250805",
  "tools": 16,
  "cwd": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk"
}
```

#### ASSISTANT Message
```json
{
  "content": [
    {
      "type": "text",
      "text": "I'll list the files in the current directory for you."
    }
  ],
  "uuid": "863e4171-47a3-4ee0-89e7-acc386211500"
}
```

#### ASSISTANT Message
```json
{
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_01RKrMemjDHLzAazXU6rebX1",
      "name": "Bash",
      "input": {
        "command": "ls -1",
        "description": "List files in current directory"
      }
    }
  ],
  "uuid": "12f80a5f-5d82-4f02-bc4d-90b3d8df2d70"
}
```

#### USER Message
```json
{
  "content": [
    {
      "tool_use_id": "toolu_01RKrMemjDHLzAazXU6rebX1",
      "type": "tool_result",
      "content": "01-basic-query.md\n01-basic-query.ts\nbun.lock\nCLAUDE.md\nnode_modules\npackage.json\nPLAN.md\nREADME.md\ntsconfig.json\nutils",
      "is_error": false
    }
  ],
  "uuid": "f4612ed8-f554-4dca-a2e7-728bba2ae436"
}
```

#### RESULT Message
```json
{
  "subtype": "error_max_turns",
  "duration_ms": 4004,
  "num_turns": 1,
  "total_cost_usd": 0.074174,
  "usage": {
    "input_tokens": 4,
    "cache_creation_input_tokens": 2380,
    "cache_read_input_tokens": 15166,
    "output_tokens": 88,
    "server_tool_use": {
      "web_search_requests": 0
    },
    "service_tier": "standard",
    "cache_creation": {
      "ephemeral_1h_input_tokens": 0,
      "ephemeral_5m_input_tokens": 2380
    }
  }
}
```

### Execution Log

```

============================================================
🧪 EXPERIMENT: 01-basic-query - Tool Usage
============================================================
⏰ Started at: 2025-09-20T07:55:25.304Z


----------------------------------------
📋 Configuration
----------------------------------------
ℹ️  Prompt
   Data: "What files are in the current directory? List just the names."
ℹ️  Options
   Data: {
     "maxTurns": 1
   }

----------------------------------------
📋 Execution
----------------------------------------
✅ System initialized
   Data: {
     "sessionId": "b532b6dd-92d6-466e-81b5-96d0c4ff134c",
     "model": "claude-opus-4-1-20250805",
     "tools": 16,
     "cwd": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk"
   }

🤖 ASSISTANT Message:
   [
     {
       "type": "text",
       "text": "I'll list the files in the current directory for you."
     }
   ]

🤖 ASSISTANT Message:
   [
     {
       "type": "tool_use",
       "id": "toolu_01RKrMemjDHLzAazXU6rebX1",
       "name": "Bash",
       "input": {
         "command": "ls -1",
         "description": "List files in current directory"
       }
     }
   ]
ℹ️  Tools used: 1

👤 USER Message:
   [
     {
       "tool_use_id": "toolu_01RKrMemjDHLzAazXU6rebX1",
       "type": "tool_result",
       "content": "01-basic-query.md\n01-basic-query.ts\nbun.lock\nCLAUDE.md\nnode_modules\npackage.json\nPLAN.md\nREADME.md\ntsconfig.json\nutils",
       "is_error": false
     }
   ]
❌ Query ended with: error_max_turns

----------------------------------------
📋 Metrics Summary
----------------------------------------
ℹ️  Summary
Duration: 5887ms
Messages: 5
Message Types: system(1), assistant(2), user(1), result(1)
Tokens: in=4, out=88
Cost: $0.074174
Status: SUCCESS

============================================================
✅ SUCCESS - 01-basic-query - Tool Usage
⏱️  Duration: 5887ms
📝 Details: {
     "totalMessages": 5,
     "messageTypes": [
       "system",
       "assistant",
       "user",
       "result"
     ]
   }
============================================================

```

---

## Summary

| Test | Result | Details |
| --- | --- | --- |
| Simple Calculation | ✅ Success | {"messages":3,"cost":0.12435115000000001} |
| Code Generation | ✅ Success | {"messages":3,"cost":0.07007775000000001} |
| Tool Usage | ✅ Success | {"messages":5,"cost":0.074174,"toolsUsed":true} |
