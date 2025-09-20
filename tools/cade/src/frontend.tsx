import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

function App() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("claude-opus-4-1-20250805");
  const [models, setModels] = useState<any[]>([]);

  // Fetch available models on mount
  useEffect(() => {
    fetch("/api/models")
      .then(res => res.json())
      .then(data => setModels(data.models || []))
      .catch(console.error);
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;

    console.log("Sending message:", message);
    setLoading(true);

    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          model: selectedModel
        }),
      });

      const data = await res.json();
      console.log("Response received:", data);
      setResponse(data);
    } catch (error) {
      console.error("Error fetching message:", error);
      setResponse({ error: "Failed to fetch message" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Claude Chat (SDK)</h1>

        {/* Model selector */}
        {models.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model:
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} {model.default && "(Default)"}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
            placeholder="Type your message to Claude..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

        {response && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {response.success ? (
              <div>
                <p className="text-gray-700 mb-2 whitespace-pre-wrap">{response.response}</p>
                <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
                  {response.model && (
                    <div className="mb-1">Model: {response.model}</div>
                  )}
                  <div>
                    Session: {response.sessionId}
                    {response.costUsd !== undefined && (
                      <span className="ml-4">
                        Cost: ${typeof response.costUsd === 'number' ? response.costUsd.toFixed(6) : response.costUsd}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-red-600">
                Error: {response.error || "Unknown error"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);