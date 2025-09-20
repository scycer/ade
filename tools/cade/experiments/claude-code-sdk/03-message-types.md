# Experiment Output: 03-message-types

Generated: 2025-09-20T11:02:04.507Z

---

## Test: Simple Text Messages

### Prompt

```
Say "Hello" and then say "World"
```

### Metrics

```json
{
  "duration": "5090ms",
  "messages": 3,
  "messageTypes": {
    "system": 1,
    "assistant": 1,
    "result": 1
  },
  "tokens": {
    "input": 4,
    "output": 6,
    "cacheCreation": 5646,
    "cacheRead": 11897
  },
  "cost": "$0.124363",
  "success": true
}
```

### Messages

#### SYSTEM Message
*Subtype: init*

```json
{
  "session_id": "c848b744-f0fb-4aec-9a91-7017535022d1",
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
      "text": "Hello\n\nWorld"
    }
  ],
  "uuid": "fcb78a0f-c825-4f3c-91d9-59d1c7438a8b"
}
```

#### RESULT Message
```json
{
  "subtype": "success",
  "duration_ms": 3244,
  "num_turns": 1,
  "total_cost_usd": 0.1243628,
  "usage": {
    "input_tokens": 4,
    "cache_creation_input_tokens": 5646,
    "cache_read_input_tokens": 11897,
    "output_tokens": 6,
    "server_tool_use": {
      "web_search_requests": 0
    },
    "service_tier": "standard",
    "cache_creation": {
      "ephemeral_1h_input_tokens": 0,
      "ephemeral_5m_input_tokens": 5646
    }
  }
}
```

### Execution Log

```

============================================================
🧪 EXPERIMENT: 03-message-types - Simple Text
============================================================
⏰ Started at: 2025-09-20T11:02:04.508Z


----------------------------------------
📋 Configuration
----------------------------------------
ℹ️  Prompt
   Data: "Say \"Hello\" and then say \"World\""
ℹ️  Options
   Data: {
     "maxTurns": 3
   }

----------------------------------------
📋 Execution
----------------------------------------
ℹ️  System message (init)
   Data: {
     "sessionId": "c848b744-f0fb-4aec-9a91-7017535022d1",
     "model": "claude-opus-4-1-20250805"
   }

🤖 ASSISTANT Message:
   [
     {
       "type": "text",
       "text": "Hello\n\nWorld"
     }
   ]
ℹ️  Result message
   Data: {
     "subtype": "success",
     "numTurns": 1,
     "durationMs": 3244,
     "totalCostUsd": 0.1243628,
     "usage": {
       "input_tokens": 4,
       "cache_creation_input_tokens": 5646,
       "cache_read_input_tokens": 11897,
       "output_tokens": 6,
       "server_tool_use": {
         "web_search_requests": 0
       },
       "service_tier": "standard",
       "cache_creation": {
         "ephemeral_1h_input_tokens": 0,
         "ephemeral_5m_input_tokens": 5646
       }
     }
   }

----------------------------------------
📋 Message Type Summary
----------------------------------------
ℹ️  Message counts
   Data: {
     "system": 1,
     "assistant": 1,
     "user": 0,
     "streamEvents": 0,
     "hasResult": true
   }

============================================================
✅ SUCCESS - 03-message-types - Simple Text
⏱️  Duration: 5090ms
============================================================

```

---

## Test: Tool Use Messages

### Prompt

```
Create a file called test.txt with content "Message types test"
```

### Metrics

```json
{
  "duration": "14225ms",
  "messages": 10,
  "messageTypes": {
    "system": 1,
    "assistant": 5,
    "user": 3,
    "result": 1
  },
  "tokens": {
    "input": 20,
    "output": 306,
    "cacheCreation": 2713,
    "cacheRead": 50431
  },
  "cost": "$0.149765",
  "success": true
}
```

### Messages

#### SYSTEM Message
*Subtype: init*

```json
{
  "session_id": "b5e5ec98-dd97-4c15-9570-7d7979eb9f68",
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
      "text": "I'll create the test.txt file with the specified content."
    }
  ],
  "uuid": "74e39c32-478d-405b-a42c-8d442ec8b733"
}
```

#### ASSISTANT Message
```json
{
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_01CzYFvxEFiHtG1RFixFnqqm",
      "name": "Write",
      "input": {
        "file_path": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk/test.txt",
        "content": "Message types test"
      }
    }
  ],
  "uuid": "a00bf9c0-daa7-4455-8026-25d6c23d089f"
}
```

#### USER Message
```json
{
  "content": [
    {
      "type": "tool_result",
      "content": "Claude requested permissions to write to /home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk/test.txt, but you haven't granted it yet.",
      "is_error": true,
      "tool_use_id": "toolu_01CzYFvxEFiHtG1RFixFnqqm"
    }
  ],
  "uuid": "750539ff-caa1-4766-9107-16a47eb12982"
}
```

#### ASSISTANT Message
```json
{
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_01UZW86dYfyWjL24EoJyS5n5",
      "name": "Write",
      "input": {
        "file_path": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk/test.txt",
        "content": "Message types test"
      }
    }
  ],
  "uuid": "8da9f2e6-016c-4e7a-8753-3cace89c17ed"
}
```

#### USER Message
```json
{
  "content": [
    {
      "type": "tool_result",
      "content": "Claude requested permissions to write to /home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk/test.txt, but you haven't granted it yet.",
      "is_error": true,
      "tool_use_id": "toolu_01UZW86dYfyWjL24EoJyS5n5"
    }
  ],
  "uuid": "b2358b03-6493-48d1-a352-e3e54ead49cf"
}
```

#### ASSISTANT Message
```json
{
  "content": [
    {
      "type": "text",
      "text": "I need permission to write the file. Let me check the current directory first and then create the file."
    }
  ],
  "uuid": "2f15e4f1-79f2-4ab3-b3dd-266675aaa0c6"
}
```

#### ASSISTANT Message
```json
{
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_01U8oNz4tD6RapRdwpSuvLLP",
      "name": "Bash",
      "input": {
        "command": "pwd",
        "description": "Check current working directory"
      }
    }
  ],
  "uuid": "1ff4a926-7189-44f3-9c9b-206eba15c6c8"
}
```

#### USER Message
```json
{
  "content": [
    {
      "tool_use_id": "toolu_01U8oNz4tD6RapRdwpSuvLLP",
      "type": "tool_result",
      "content": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk",
      "is_error": false
    }
  ],
  "uuid": "685d2048-8c57-4122-8448-ff4e6262f407"
}
```

#### RESULT Message
```json
{
  "subtype": "error_max_turns",
  "duration_ms": 12235,
  "num_turns": 3,
  "total_cost_usd": 0.14976525,
  "usage": {
    "input_tokens": 20,
    "cache_creation_input_tokens": 2713,
    "cache_read_input_tokens": 50431,
    "output_tokens": 306,
    "server_tool_use": {
      "web_search_requests": 0
    },
    "service_tier": "standard",
    "cache_creation": {
      "ephemeral_1h_input_tokens": 0,
      "ephemeral_5m_input_tokens": 2713
    }
  }
}
```

### Execution Log

```

============================================================
🧪 EXPERIMENT: 03-message-types - Tool Use
============================================================
⏰ Started at: 2025-09-20T11:02:09.598Z


----------------------------------------
📋 Configuration
----------------------------------------
ℹ️  Prompt
   Data: "Create a file called test.txt with content \"Message types test\""
ℹ️  Options
   Data: {
     "maxTurns": 3
   }

----------------------------------------
📋 Execution
----------------------------------------
ℹ️  System message (init)
   Data: {
     "sessionId": "b5e5ec98-dd97-4c15-9570-7d7979eb9f68",
     "model": "claude-opus-4-1-20250805"
   }

🤖 ASSISTANT Message:
   [
     {
       "type": "text",
       "text": "I'll create the test.txt file with the specified content."
     }
   ]

🤖 ASSISTANT Message:
   [
     {
       "type": "tool_use",
       "id": "toolu_01CzYFvxEFiHtG1RFixFnqqm",
       "name": "Write",
       "input": {
         "file_path": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk/test.txt",
         "content": "Message types test"
       }
     }
   ]

👤 USER Message:
   [
     {
       "type": "tool_result",
       "content": "Claude requested permissions to write to /home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk/test.txt, but you haven't granted it yet.",
       "is_error": true,
       "tool_use_id": "toolu_01CzYFvxEFiHtG1RFixFnqqm"
     }
   ]

🤖 ASSISTANT Message:
   [
     {
       "type": "tool_use",
       "id": "toolu_01UZW86dYfyWjL24EoJyS5n5",
       "name": "Write",
       "input": {
         "file_path": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk/test.txt",
         "content": "Message types test"
       }
     }
   ]

👤 USER Message:
   [
     {
       "type": "tool_result",
       "content": "Claude requested permissions to write to /home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk/test.txt, but you haven't granted it yet.",
       "is_error": true,
       "tool_use_id": "toolu_01UZW86dYfyWjL24EoJyS5n5"
     }
   ]

🤖 ASSISTANT Message:
   [
     {
       "type": "text",
       "text": "I need permission to write the file. Let me check the current directory first and then create the file."
     }
   ]

🤖 ASSISTANT Message:
   [
     {
       "type": "tool_use",
       "id": "toolu_01U8oNz4tD6RapRdwpSuvLLP",
       "name": "Bash",
       "input": {
         "command": "pwd",
         "description": "Check current working directory"
       }
     }
   ]

👤 USER Message:
   [
     {
       "tool_use_id": "toolu_01U8oNz4tD6RapRdwpSuvLLP",
       "type": "tool_result",
       "content": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk",
       "is_error": false
     }
   ]
ℹ️  Result message
   Data: {
     "subtype": "error_max_turns",
     "numTurns": 3,
     "durationMs": 12235,
     "totalCostUsd": 0.14976525,
     "usage": {
       "input_tokens": 20,
       "cache_creation_input_tokens": 2713,
       "cache_read_input_tokens": 50431,
       "output_tokens": 306,
       "server_tool_use": {
         "web_search_requests": 0
       },
       "service_tier": "standard",
       "cache_creation": {
         "ephemeral_1h_input_tokens": 0,
         "ephemeral_5m_input_tokens": 2713
       }
     }
   }

----------------------------------------
📋 Message Type Summary
----------------------------------------
ℹ️  Message counts
   Data: {
     "system": 1,
     "assistant": 5,
     "user": 3,
     "streamEvents": 0,
     "hasResult": true
   }

============================================================
✅ SUCCESS - 03-message-types - Tool Use
⏱️  Duration: 14225ms
============================================================

```

---

## Test: Error Result Message

### Prompt

```
Count from 1 to 100
```

### Metrics

```json
{
  "duration": "6764ms",
  "messages": 5,
  "messageTypes": {
    "system": 1,
    "assistant": 2,
    "user": 1,
    "result": 1
  },
  "tokens": {
    "input": 4,
    "output": 104,
    "cacheCreation": 2375,
    "cacheRead": 15166
  },
  "cost": "$0.075295",
  "success": true
}
```

### Messages

#### SYSTEM Message
*Subtype: init*

```json
{
  "session_id": "096cd4fd-6ff7-48c0-aeda-425872b62f8a",
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
      "text": "I'll count from 1 to 100 for you."
    }
  ],
  "uuid": "d9387d1a-e819-497e-9ac4-d669c0b0e61a"
}
```

#### ASSISTANT Message
```json
{
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_01AMQ9TLSAaHkndBcbwK9aju",
      "name": "TodoWrite",
      "input": {
        "todos": [
          {
            "content": "Count from 1 to 100",
            "status": "in_progress",
            "activeForm": "Counting from 1 to 100"
          }
        ]
      }
    }
  ],
  "uuid": "f700cba0-97cf-4a0b-8881-5d03be7fe52c"
}
```

#### USER Message
```json
{
  "content": [
    {
      "tool_use_id": "toolu_01AMQ9TLSAaHkndBcbwK9aju",
      "type": "tool_result",
      "content": "Todos have been modified successfully. Ensure that you continue to use the todo list to track your progress. Please proceed with the current tasks if applicable"
    }
  ],
  "uuid": "3600bf0e-c9fe-40fe-a966-6d4d3bc731c5"
}
```

#### RESULT Message
```json
{
  "subtype": "error_max_turns",
  "duration_ms": 4837,
  "num_turns": 1,
  "total_cost_usd": 0.07529545,
  "usage": {
    "input_tokens": 4,
    "cache_creation_input_tokens": 2375,
    "cache_read_input_tokens": 15166,
    "output_tokens": 104,
    "server_tool_use": {
      "web_search_requests": 0
    },
    "service_tier": "standard",
    "cache_creation": {
      "ephemeral_1h_input_tokens": 0,
      "ephemeral_5m_input_tokens": 2375
    }
  }
}
```

### Execution Log

```

============================================================
🧪 EXPERIMENT: 03-message-types - Error Result
============================================================
⏰ Started at: 2025-09-20T11:02:23.824Z


----------------------------------------
📋 Configuration
----------------------------------------
ℹ️  Prompt
   Data: "Count from 1 to 100"
ℹ️  Options
   Data: {
     "maxTurns": 1
   }

----------------------------------------
📋 Execution
----------------------------------------
ℹ️  System message (init)
   Data: {
     "sessionId": "096cd4fd-6ff7-48c0-aeda-425872b62f8a",
     "model": "claude-opus-4-1-20250805"
   }

🤖 ASSISTANT Message:
   [
     {
       "type": "text",
       "text": "I'll count from 1 to 100 for you."
     }
   ]

🤖 ASSISTANT Message:
   [
     {
       "type": "tool_use",
       "id": "toolu_01AMQ9TLSAaHkndBcbwK9aju",
       "name": "TodoWrite",
       "input": {
         "todos": [
           {
             "content": "Count from 1 to 100",
             "status": "in_progress",
             "activeForm": "Counting from 1 to 100"
           }
         ]
       }
     }
   ]

👤 USER Message:
   [
     {
       "tool_use_id": "toolu_01AMQ9TLSAaHkndBcbwK9aju",
       "type": "tool_result",
       "content": "Todos have been modified successfully. Ensure that you continue to use the todo list to track your progress. Please proceed with the current tasks if applicable"
     }
   ]
ℹ️  Result message
   Data: {
     "subtype": "error_max_turns",
     "numTurns": 1,
     "durationMs": 4837,
     "totalCostUsd": 0.07529545,
     "usage": {
       "input_tokens": 4,
       "cache_creation_input_tokens": 2375,
       "cache_read_input_tokens": 15166,
       "output_tokens": 104,
       "server_tool_use": {
         "web_search_requests": 0
       },
       "service_tier": "standard",
       "cache_creation": {
         "ephemeral_1h_input_tokens": 0,
         "ephemeral_5m_input_tokens": 2375
       }
     }
   }

----------------------------------------
📋 Message Type Summary
----------------------------------------
ℹ️  Message counts
   Data: {
     "system": 1,
     "assistant": 2,
     "user": 1,
     "streamEvents": 0,
     "hasResult": true
   }

============================================================
✅ SUCCESS - 03-message-types - Error Result
⏱️  Duration: 6764ms
============================================================

```

---

## Test: Usage Statistics

### Prompt

```
Write a haiku about coding
```

### Metrics

```json
{
  "duration": "4510ms",
  "messages": 3,
  "messageTypes": {
    "system": 1,
    "assistant": 1,
    "result": 1
  },
  "tokens": {
    "input": 4,
    "output": 24,
    "cacheCreation": 2373,
    "cacheRead": 15166
  },
  "cost": "$0.069103",
  "success": true
}
```

### Messages

#### SYSTEM Message
*Subtype: init*

```json
{
  "session_id": "50bb6abf-bdcf-4858-acd9-81bada37cdbe",
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
      "text": "Code flows like a stream,\nLogic branches, functions bloom—\nBugs hide in the night."
    }
  ],
  "uuid": "dc99625b-3437-4bc9-b6f1-516427d42a95"
}
```

#### RESULT Message
```json
{
  "subtype": "success",
  "duration_ms": 2675,
  "num_turns": 1,
  "total_cost_usd": 0.06910275,
  "usage": {
    "input_tokens": 4,
    "cache_creation_input_tokens": 2373,
    "cache_read_input_tokens": 15166,
    "output_tokens": 24,
    "server_tool_use": {
      "web_search_requests": 0
    },
    "service_tier": "standard",
    "cache_creation": {
      "ephemeral_1h_input_tokens": 0,
      "ephemeral_5m_input_tokens": 2373
    }
  }
}
```

### Execution Log

```

============================================================
🧪 EXPERIMENT: 03-message-types - Usage Statistics
============================================================
⏰ Started at: 2025-09-20T11:02:30.588Z


----------------------------------------
📋 Configuration
----------------------------------------
ℹ️  Prompt
   Data: "Write a haiku about coding"
ℹ️  Options
   Data: {
     "maxTurns": 3
   }

----------------------------------------
📋 Execution
----------------------------------------
ℹ️  System message (init)
   Data: {
     "sessionId": "50bb6abf-bdcf-4858-acd9-81bada37cdbe",
     "model": "claude-opus-4-1-20250805"
   }

🤖 ASSISTANT Message:
   [
     {
       "type": "text",
       "text": "Code flows like a stream,\nLogic branches, functions bloom—\nBugs hide in the night."
     }
   ]
ℹ️  Result message
   Data: {
     "subtype": "success",
     "numTurns": 1,
     "durationMs": 2675,
     "totalCostUsd": 0.06910275,
     "usage": {
       "input_tokens": 4,
       "cache_creation_input_tokens": 2373,
       "cache_read_input_tokens": 15166,
       "output_tokens": 24,
       "server_tool_use": {
         "web_search_requests": 0
       },
       "service_tier": "standard",
       "cache_creation": {
         "ephemeral_1h_input_tokens": 0,
         "ephemeral_5m_input_tokens": 2373
       }
     }
   }

----------------------------------------
📋 Message Type Summary
----------------------------------------
ℹ️  Message counts
   Data: {
     "system": 1,
     "assistant": 1,
     "user": 0,
     "streamEvents": 0,
     "hasResult": true
   }

============================================================
✅ SUCCESS - 03-message-types - Usage Statistics
⏱️  Duration: 4510ms
============================================================

```

---

## Message Type Analysis

```json
{
  "test1": {
    "system": [
      {
        "subtype": "init",
        "sessionId": "c848b744-f0fb-4aec-9a91-7017535022d1",
        "model": "claude-opus-4-1-20250805",
        "toolCount": 16,
        "cwd": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk"
      }
    ],
    "assistant": [
      {
        "uuid": "fcb78a0f-c825-4f3c-91d9-59d1c7438a8b",
        "contentType": "array",
        "contentLength": 1,
        "contentBlocks": [
          {
            "type": "text"
          }
        ]
      }
    ],
    "user": [],
    "result": {
      "subtype": "success",
      "numTurns": 1,
      "durationMs": 3244,
      "totalCostUsd": 0.1243628,
      "usage": {
        "input_tokens": 4,
        "cache_creation_input_tokens": 5646,
        "cache_read_input_tokens": 11897,
        "output_tokens": 6,
        "server_tool_use": {
          "web_search_requests": 0
        },
        "service_tier": "standard",
        "cache_creation": {
          "ephemeral_1h_input_tokens": 0,
          "ephemeral_5m_input_tokens": 5646
        }
      }
    },
    "streamEvents": []
  },
  "test2": {
    "system": [
      {
        "subtype": "init",
        "sessionId": "b5e5ec98-dd97-4c15-9570-7d7979eb9f68",
        "model": "claude-opus-4-1-20250805",
        "toolCount": 16,
        "cwd": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk"
      }
    ],
    "assistant": [
      {
        "uuid": "74e39c32-478d-405b-a42c-8d442ec8b733",
        "contentType": "array",
        "contentLength": 1,
        "contentBlocks": [
          {
            "type": "text"
          }
        ]
      },
      {
        "uuid": "a00bf9c0-daa7-4455-8026-25d6c23d089f",
        "contentType": "array",
        "contentLength": 1,
        "contentBlocks": [
          {
            "type": "tool_use",
            "name": "Write",
            "id": "toolu_01CzYFvxEFiHtG1RFixFnqqm"
          }
        ]
      },
      {
        "uuid": "8da9f2e6-016c-4e7a-8753-3cace89c17ed",
        "contentType": "array",
        "contentLength": 1,
        "contentBlocks": [
          {
            "type": "tool_use",
            "name": "Write",
            "id": "toolu_01UZW86dYfyWjL24EoJyS5n5"
          }
        ]
      },
      {
        "uuid": "2f15e4f1-79f2-4ab3-b3dd-266675aaa0c6",
        "contentType": "array",
        "contentLength": 1,
        "contentBlocks": [
          {
            "type": "text"
          }
        ]
      },
      {
        "uuid": "1ff4a926-7189-44f3-9c9b-206eba15c6c8",
        "contentType": "array",
        "contentLength": 1,
        "contentBlocks": [
          {
            "type": "tool_use",
            "name": "Bash",
            "id": "toolu_01U8oNz4tD6RapRdwpSuvLLP"
          }
        ]
      }
    ],
    "user": [
      {
        "uuid": "750539ff-caa1-4766-9107-16a47eb12982",
        "contentType": "array",
        "hasToolResults": true
      },
      {
        "uuid": "b2358b03-6493-48d1-a352-e3e54ead49cf",
        "contentType": "array",
        "hasToolResults": true
      },
      {
        "uuid": "685d2048-8c57-4122-8448-ff4e6262f407",
        "contentType": "array",
        "hasToolResults": true
      }
    ],
    "result": {
      "subtype": "error_max_turns",
      "numTurns": 3,
      "durationMs": 12235,
      "totalCostUsd": 0.14976525,
      "usage": {
        "input_tokens": 20,
        "cache_creation_input_tokens": 2713,
        "cache_read_input_tokens": 50431,
        "output_tokens": 306,
        "server_tool_use": {
          "web_search_requests": 0
        },
        "service_tier": "standard",
        "cache_creation": {
          "ephemeral_1h_input_tokens": 0,
          "ephemeral_5m_input_tokens": 2713
        }
      }
    },
    "streamEvents": []
  },
  "test3": {
    "system": [
      {
        "subtype": "init",
        "sessionId": "096cd4fd-6ff7-48c0-aeda-425872b62f8a",
        "model": "claude-opus-4-1-20250805",
        "toolCount": 16,
        "cwd": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk"
      }
    ],
    "assistant": [
      {
        "uuid": "d9387d1a-e819-497e-9ac4-d669c0b0e61a",
        "contentType": "array",
        "contentLength": 1,
        "contentBlocks": [
          {
            "type": "text"
          }
        ]
      },
      {
        "uuid": "f700cba0-97cf-4a0b-8881-5d03be7fe52c",
        "contentType": "array",
        "contentLength": 1,
        "contentBlocks": [
          {
            "type": "tool_use",
            "name": "TodoWrite",
            "id": "toolu_01AMQ9TLSAaHkndBcbwK9aju"
          }
        ]
      }
    ],
    "user": [
      {
        "uuid": "3600bf0e-c9fe-40fe-a966-6d4d3bc731c5",
        "contentType": "array",
        "hasToolResults": true
      }
    ],
    "result": {
      "subtype": "error_max_turns",
      "numTurns": 1,
      "durationMs": 4837,
      "totalCostUsd": 0.07529545,
      "usage": {
        "input_tokens": 4,
        "cache_creation_input_tokens": 2375,
        "cache_read_input_tokens": 15166,
        "output_tokens": 104,
        "server_tool_use": {
          "web_search_requests": 0
        },
        "service_tier": "standard",
        "cache_creation": {
          "ephemeral_1h_input_tokens": 0,
          "ephemeral_5m_input_tokens": 2375
        }
      }
    },
    "streamEvents": []
  },
  "test4": {
    "system": [
      {
        "subtype": "init",
        "sessionId": "50bb6abf-bdcf-4858-acd9-81bada37cdbe",
        "model": "claude-opus-4-1-20250805",
        "toolCount": 16,
        "cwd": "/home/scycer/dev/ade/tools/cade/experiments/claude-code-sdk"
      }
    ],
    "assistant": [
      {
        "uuid": "dc99625b-3437-4bc9-b6f1-516427d42a95",
        "contentType": "array",
        "contentLength": 1,
        "contentBlocks": [
          {
            "type": "text"
          }
        ]
      }
    ],
    "user": [],
    "result": {
      "subtype": "success",
      "numTurns": 1,
      "durationMs": 2675,
      "totalCostUsd": 0.06910275,
      "usage": {
        "input_tokens": 4,
        "cache_creation_input_tokens": 2373,
        "cache_read_input_tokens": 15166,
        "output_tokens": 24,
        "server_tool_use": {
          "web_search_requests": 0
        },
        "service_tier": "standard",
        "cache_creation": {
          "ephemeral_1h_input_tokens": 0,
          "ephemeral_5m_input_tokens": 2373
        }
      }
    },
    "streamEvents": []
  }
}
```

## Summary

| Test | Result | Details |
| --- | --- | --- |
| Simple Text Messages | ✅ Success | {"messages":3,"assistantMessages":1} |
| Tool Use Messages | ✅ Success | {"messages":10,"toolUses":3} |
| Error Result Message | ✅ Success | {"resultSubtype":"error_max_turns"} |
| Usage Statistics | ✅ Success | {"tokens":{"input_tokens":4,"cache_creation_input_tokens":2373,"cache_read_input_tokens":15166,"output_tokens":24,"server_tool_use":{"web_search_requests":0},"service_tier":"standard","cache_creation":{"ephemeral_1h_input_tokens":0,"ephemeral_5m_input_tokens":2373}},"cost":0.06910275} |
