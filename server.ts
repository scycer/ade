
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

Bun.serve({
  port: 3000,
  hostname: "0.0.0.0",  // Listen on all network interfaces
  async fetch(req) {
    const url = new URL(req.url);
    
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(await Bun.file("./index.html").text(), {
        headers: { "Content-Type": "text/html" },
      });
    }
    
    // Bundle and serve TypeScript/JSX files with dependencies
    if (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts') || url.pathname.endsWith('.jsx') || url.pathname.endsWith('.js')) {
      const filePath = "." + url.pathname;
      const file = Bun.file(filePath);
      
      if (await file.exists()) {
        // Use Bun.build to bundle the file with all its dependencies
        const result = await Bun.build({
          entrypoints: [filePath],
          target: "browser",
          format: "esm",
        });
        
        if (result.success && result.outputs.length > 0) {
          const output = await result.outputs[0].text();
          return new Response(output, {
            headers: { 
              "Content-Type": "application/javascript",
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
  
  development: {
    hmr: true,
    console: true,
  },
});

console.log("🚀 Server running at http://0.0.0.0:3000");
console.log("   Local: http://localhost:3000");
console.log("   Network: http://<your-ip>:3000");