import { watch } from "fs";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any;
  id: string | number;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number;
}

const rpcMethods = {
  hello: async (_params: any) => {
    return { message: "Hello, World!", timestamp: new Date().toISOString() };
  },
  
  getTime: async (_params: any) => {
    return {
      unix: Date.now(),
      iso: new Date().toISOString(),
      local: new Date().toLocaleString(),
    };
  },
  
  echo: async (params: any) => {
    return { echo: params?.message || "No message provided", reversed: params?.message?.split('').reverse().join('') || "" };
  },
};

async function handleRpc(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  const { method, params, id } = request;
  
  if (!(method in rpcMethods)) {
    return {
      jsonrpc: "2.0",
      error: {
        code: -32601,
        message: "Method not found",
      },
      id,
    };
  }
  
  try {
    const result = await rpcMethods[method as keyof typeof rpcMethods](params);
    return {
      jsonrpc: "2.0",
      result,
      id,
    };
  } catch (error) {
    return {
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: "Internal error",
        data: error instanceof Error ? error.message : String(error),
      },
      id,
    };
  }
}

// Store WebSocket clients for hot reload
const wsClients = new Set<any>();

const server = Bun.serve({
  port: 3000,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    
    if (url.pathname === "/" || url.pathname === "/index.html") {
      // Always serve fresh HTML for hot reload
      const html = await Bun.file("../ui/index.html").text();
      
      // Inject hot reload client script
      const htmlWithHMR = html.replace(
        '</body>',
        `<script>
          // Simple hot reload client
          let ws = new WebSocket('ws://' + location.host + '/hmr');
          ws.onmessage = () => location.reload();
          ws.onclose = () => setTimeout(() => location.reload(), 1000);
        </script>
        </body>`
      );
      
      return new Response(htmlWithHMR, {
        headers: { "Content-Type": "text/html" },
      });
    }
    
    // WebSocket endpoint for hot reload notifications
    if (url.pathname === "/hmr") {
      const success = server.upgrade(req);
      if (success) return undefined;
    }
    
    // Bundle and serve TypeScript/JSX files with dependencies
    if (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts') || url.pathname.endsWith('.jsx') || url.pathname.endsWith('.js')) {
      const filePath = "../ui" + url.pathname;
      const file = Bun.file(filePath);
      
      if (await file.exists()) {
        // In development, always rebuild to get latest changes
        const result = await Bun.build({
          entrypoints: [filePath],
          target: "browser",
          format: "esm",
          // Add source maps for better debugging
          sourcemap: "inline",
        });
        
        if (result.success && result.outputs.length > 0) {
          const output = await result.outputs[0].text();
          
          return new Response(output, {
            headers: { 
              "Content-Type": "application/javascript",
              // Prevent caching in development
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          });
        }
      }
    }
    
    if (url.pathname === "/api/rpc" && req.method === "POST") {
      try {
        const body = await req.json() as JsonRpcRequest;
        const response = await handleRpc(body);
        
        return new Response(JSON.stringify(response), {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32700,
              message: "Parse error",
            },
            id: null,
          }),
          {
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }
    
    if (url.pathname === "/api/rpc" && req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    
    return new Response("Not Found", { status: 404 });
  },
  
  websocket: {
    message(ws, message) {
      // Handle WebSocket messages if needed
    },
    open(ws) {
      console.log("✅ Hot reload client connected");
      wsClients.add(ws);
    },
    close(ws) {
      wsClients.delete(ws);
    },
  },
});

// Watch for file changes
const watchDirs = ["../ui/src", "../ui/index.html"];
let debounceTimer: Timer | null = null;

function setupWatcher() {
  watchDirs.forEach(dir => {
    try {
      watch(dir, { recursive: true }, (event, filename) => {
        if (filename && (filename.endsWith('.tsx') || filename.endsWith('.ts') || filename.endsWith('.jsx') || filename.endsWith('.html'))) {
          // Debounce to avoid multiple reloads
          if (debounceTimer) clearTimeout(debounceTimer);
          
          debounceTimer = setTimeout(() => {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`\n🔄 [${timestamp}] Change detected: ${filename}`);
            console.log("   Triggering browser reload...");
            
            // Notify all connected clients to reload
            wsClients.forEach(ws => {
              try {
                ws.send("reload");
              } catch (e) {
                // Client might be disconnected
                wsClients.delete(ws);
              }
            });
          }, 100);
        }
      });
    } catch (e) {
      // If directory doesn't exist yet, ignore
    }
  });
}

setupWatcher();

console.log("🚀 Server running at http://0.0.0.0:3000");
console.log("   Local: http://localhost:3000");
console.log("   Network: http://<your-ip>:3000");
console.log("   Watching: ../ui/src, ../ui/index.html");
console.log("   Hot reload enabled ✨");