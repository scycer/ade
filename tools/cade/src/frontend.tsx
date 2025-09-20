import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

interface Message {
  type: "user" | "assistant" | "system" | "tool_use";
  content: string;
  toolCalls?: any[];
  timestamp?: number;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("claude-opus-4-1-20250805");
  const [models, setModels] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [allowFileOps, setAllowFileOps] = useState(true); // Always true - full permissions
  const [streamingResponse, setStreamingResponse] = useState("");

  // Fetch available models on mount
  useEffect(() => {
    fetch("/api/models")
      .then(res => res.json())
      .then(data => setModels(data.models || []))
      .catch(console.error);
  }, []);

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage("");
    setLoading(true);
    setStreamingResponse("");

    // Add user message to chat
    const newUserMessage: Message = {
      type: "user",
      content: userMessage,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          model: selectedModel,
          sessionId,
          allowFileOperations: allowFileOps
        }),
      });

      const data = await res.json();
      console.log("Response received:", data);

      if (data.success) {
        // Add assistant response to chat
        const assistantMessage: Message = {
          type: "assistant",
          content: data.response,
          toolCalls: data.toolsUsed,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Update session ID for continuity
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }

        // Add tool use messages if any
        if (data.toolsUsed && data.toolsUsed.length > 0) {
          data.toolsUsed.forEach((tool: any) => {
            const toolMessage: Message = {
              type: "tool_use",
              content: `🔧 Used tool: ${tool.name}`,
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, toolMessage]);
          });
        }
      } else {
        // Add error message
        const errorMessage: Message = {
          type: "system",
          content: `Error: ${data.error || "Failed to get response"}`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error fetching message:", error);
      const errorMessage: Message = {
        type: "system",
        content: `Error: ${error}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setSessionId(undefined);
    setStreamingResponse("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Claude Code Conversation</h1>
          <button
            onClick={handleClearChat}
            className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
          >
            Clear Chat
          </button>
        </div>

        {/* Configuration */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex gap-4 items-center">
            {models.length > 0 && (
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Model:
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.default && "(Default)"}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-700 font-medium">
                ✅ Full Permissions Enabled
              </span>
            </div>
            {sessionId && (
              <div className="text-xs text-gray-500">
                Session: {sessionId.substring(0, 8)}...
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="mb-4 h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Start a conversation with Claude Code. Full file system access enabled.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={`${
                  msg.type === "user" ? "ml-auto bg-blue-100" :
                  msg.type === "assistant" ? "mr-auto bg-white" :
                  msg.type === "tool_use" ? "mr-auto bg-yellow-50 text-sm" :
                  "mr-auto bg-red-50"
                } p-3 rounded-lg max-w-[80%] shadow-sm`}>
                  <div className={`text-xs font-semibold mb-1 ${
                    msg.type === "user" ? "text-blue-700" :
                    msg.type === "assistant" ? "text-green-700" :
                    msg.type === "tool_use" ? "text-yellow-700" :
                    "text-gray-600"
                  }`}>
                    {msg.type === "user" ? "You" :
                     msg.type === "assistant" ? "Claude" :
                     msg.type === "tool_use" ? "Tool" :
                     "System"}
                  </div>
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-2 pt-2 border-t text-xs text-gray-600">
                      Tools used: {msg.toolCalls.map((t: any) => t.name).join(", ")}
                    </div>
                  )}
                </div>
              ))}
              {loading && streamingResponse && (
                <div className="mr-auto bg-white p-3 rounded-lg max-w-[80%] shadow-sm">
                  <div className="text-xs font-semibold mb-1 text-green-700">Claude (typing...)</div>
                  <div className="whitespace-pre-wrap break-words">{streamingResponse}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
            placeholder="Ask Claude anything - full file system access enabled..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !inputMessage.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);