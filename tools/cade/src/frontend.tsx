import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

function App() {
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    console.log("Button clicked - sending action to backend");
    setLoading(true);

    try {
      console.log("Fetching /api/message...");
      const res = await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "button_clicked" }),
      });

      const data = await res.json();
      console.log("Response received:", data);
      setResponse(data.message);
    } catch (error) {
      console.error("Error fetching message:", error);
      setResponse("Error: Failed to fetch message");
    } finally {
      setLoading(false);
      console.log("Request completed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Simple App</h1>

        <button
          onClick={handleClick}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Loading..." : "Send Action"}
        </button>

        {response && (
          <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
            <p className="text-gray-700">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
