# MCP TypeScript SDK - Hooks Documentation

## Overview

The Model Context Protocol (MCP) TypeScript SDK provides various hooks and event handling mechanisms for building robust MCP servers and clients. This document focuses on hooks, lifecycle events, and dynamic server capabilities.

## Dynamic Server Capabilities with Hooks

### Implementing Dynamic Servers

The SDK allows you to dynamically add, update, and remove `tools`, `prompts`, and `resources` after a server is connected, automatically emitting `listChanged` notifications:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "Dynamic Example",
  version: "1.0.0"
});

// Create a tool that can be enabled/disabled
const putMessageTool = server.tool(
  "putMessage",
  { channel: z.string(), message: z.string() },
  async ({ channel, message }) => ({
    content: [{ type: "text", text: await putMessage(channel, message) }]
  })
);

// Disable tool initially (won't show up in listTools)
putMessageTool.disable();

// Tool that upgrades auth and enables/disables other tools
const upgradeAuthTool = server.tool(
  "upgradeAuth",
  { permission: z.enum(["write", "admin"]) },
  async ({ permission }) => {
    const { ok, err, previous } = await upgradeAuthAndStoreToken(permission);
    if (!ok) return { content: [{ type: "text", text: `Error: ${err}` }] };

    // Enable putMessage tool when upgrading from read-only
    if (previous === "read") {
      putMessageTool.enable();
    }

    if (permission === 'write') {
      // Update tool schema for write permission
      upgradeAuthTool.update({
        paramsSchema: { permission: z.enum(["admin"]) },
      });
    } else {
      // Remove tool completely for admin users
      upgradeAuthTool.remove();
    }
  }
);
```

### Key Hook Features

1. **Automatic Notifications**: Any mutations automatically emit `listChanged` notifications
2. **Tool Lifecycle Methods**:
   - `.enable()` - Make tool available
   - `.disable()` - Hide tool from listings
   - `.update()` - Modify tool parameters/schema
   - `.remove()` - Permanently remove tool

## Session and Connection Hooks

### Session Initialization Hook

```typescript
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  onsessioninitialized: (sessionId) => {
    // Hook called when session is initialized
    console.log(`Session initialized: ${sessionId}`);

    // Store transport or perform setup
    transports[sessionId] = transport;
  }
});

// Cleanup hook
transport.onclose = () => {
  if (transport.sessionId) {
    delete transports[transport.sessionId];
  }
};
```

## Event Store Hooks for Resumability

### Database Event Store Integration

```typescript
const server = new McpServer(
  {
    name: "resumable-server",
    version: "1.0.0"
  },
  {
    // Hook for session ID generation
    sessionIdGenerator: () => randomUUID(),

    // Hook for event persistence
    eventStore: databaseEventStore
  }
);
```

This enables:
- Session state persistence
- Event storage for resumability
- Recovery from disconnections

## Request Handler Hooks

### Low-Level Server Request Hooks

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

const server = new Server(
  {
    name: "example-server",
    version: "1.0.0"
  },
  {
    capabilities: {
      prompts: {}
    }
  }
);

// Hook for handling list prompts requests
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [{
      name: "example-prompt",
      description: "An example prompt template",
      arguments: [{
        name: "arg1",
        description: "Example argument",
        required: true
      }]
    }]
  };
});

// Hook for handling get prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name !== "example-prompt") {
    throw new Error("Unknown prompt");
  }
  return {
    description: "Example prompt",
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: "Example prompt text"
      }
    }]
  };
});
```

## Notification Hooks and Debouncing

### Debounced Notification Methods

Improve network efficiency by debouncing notifications:

```typescript
const server = new McpServer(
  {
    name: "efficient-server",
    version: "1.0.0"
  },
  {
    // Hook configuration for debounced notifications
    debouncedNotificationMethods: [
      'notifications/tools/list_changed',
      'notifications/resources/list_changed',
      'notifications/prompts/list_changed'
    ]
  }
);

// Multiple rapid changes result in single notification
server.registerTool("tool1", ...).disable();
server.registerTool("tool2", ...).disable();
server.registerTool("tool3", ...).disable();
// Only one 'notifications/tools/list_changed' is sent
```

**Note**: Debouncing is automatically bypassed for notifications with `params` or `relatedRequestId`.

## Client-Side Hooks

### Elicitation Request Handler

Handle user input requests from the server:

```typescript
client.setRequestHandler(ElicitRequestSchema, async (request) => {
  const userResponse = await getInputFromUser(
    request.params.message,
    request.params.requestedSchema
  );

  return {
    action: userResponse.action,
    content: userResponse.action === "accept" ? userResponse.data : undefined
  };
});
```

### SSE Event Hooks

For SSE transport with event stream handling:

```typescript
const transport = new SSEClientTransport(baseUrl);

// Hook for connection events
transport.on('open', () => {
  console.log('SSE connection established');
});

transport.on('error', (error) => {
  console.error('SSE error:', error);
});

transport.on('close', () => {
  console.log('SSE connection closed');
});
```

## Authentication Hooks

### OAuth Provider Hooks

```typescript
const proxyProvider = new ProxyOAuthServerProvider({
  endpoints: {
    authorizationUrl: "https://auth.external.com/oauth2/v1/authorize",
    tokenUrl: "https://auth.external.com/oauth2/v1/token",
    revocationUrl: "https://auth.external.com/oauth2/v1/revoke",
  },

  // Hook for token verification
  verifyAccessToken: async (token) => {
    return {
      token,
      clientId: "123",
      scopes: ["openid", "email", "profile"],
    };
  },

  // Hook for client retrieval
  getClient: async (client_id) => {
    return {
      client_id,
      redirect_uris: ["http://localhost:3000/callback"],
    };
  }
});
```

## Transport Lifecycle Hooks

### Streamable HTTP Transport Hooks

```typescript
const transport = new StreamableHTTPServerTransport({
  // Session initialization hook
  sessionIdGenerator: () => randomUUID(),

  // DNS rebinding protection hooks
  enableDnsRebindingProtection: true,
  allowedHosts: ['127.0.0.1'],

  // Session initialized callback
  onsessioninitialized: (sessionId) => {
    console.log(`Session ${sessionId} initialized`);
  }
});

// Connection close hook
transport.onclose = () => {
  console.log('Transport closed');
  // Cleanup logic here
};
```

## Best Practices for Hooks

1. **Error Handling**: Always wrap hook implementations in try-catch blocks
2. **Cleanup**: Implement cleanup logic in close/disconnect hooks
3. **State Management**: Use hooks for proper session and state management
4. **Performance**: Use debouncing hooks to reduce network overhead
5. **Security**: Validate and sanitize data in authentication hooks

## Common Hook Patterns

### Pattern 1: Progressive Enhancement

```typescript
// Start with basic capabilities
const basicTool = server.tool("basic", ...);

// Enhance based on user actions or auth level
authHook.on('upgrade', (level) => {
  if (level === 'premium') {
    server.tool("advanced", ...);
    basicTool.update({ /* enhanced params */ });
  }
});
```

### Pattern 2: Resource Lifecycle Management

```typescript
const resourceManager = {
  resources: new Map(),

  add: (id, resource) => {
    resources.set(id, resource);
    server.notifyResourcesChanged();
  },

  remove: (id) => {
    resources.delete(id);
    server.notifyResourcesChanged();
  }
};
```

### Pattern 3: Connection Recovery

```typescript
const connectionManager = {
  lastEventId: null,

  onConnect: (transport) => {
    if (lastEventId) {
      // Resume from last known state
      transport.resumeFrom(lastEventId);
    }
  },

  onEvent: (event) => {
    lastEventId = event.id;
  }
};
```

## Advanced Hook Configurations

### Multi-Node Deployment Hooks

For distributed systems:

```typescript
const server = new McpServer(
  { name: "distributed-server", version: "1.0.0" },
  {
    // Stateless mode - no session persistence
    sessionIdGenerator: undefined,

    // Or with persistent storage
    sessionIdGenerator: () => randomUUID(),
    eventStore: databaseEventStore,

    // Load balancer aware hooks
    onNodeSelection: (sessionId) => {
      return selectOptimalNode(sessionId);
    }
  }
);
```

## Summary

The MCP TypeScript SDK provides comprehensive hook support for:

- Dynamic server capabilities management
- Session and connection lifecycle
- Request/response handling
- Authentication and authorization
- Event streaming and notifications
- Error handling and recovery
- Performance optimization through debouncing

These hooks enable building robust, scalable, and maintainable MCP applications with proper separation of concerns and lifecycle management.