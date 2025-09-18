import { useEffect, useState } from "react";
import "./index.css";

export function App() {
  const [message, setMessage] = useState<string>("");
  const [nodeId, setNodeId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/brain/hello")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setMessage(`Error: ${data.error}`);
        } else {
          setMessage(data.message || "Hello from Brain!");
          setNodeId(data.node_id || "");
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch from brain:", error);
        setMessage("Error connecting to brain");
        setLoading(false);
      });
  }, []);

  return (
    <div className="frame-window">
      <div className="content-center">
        <h1>Brain Architecture Demo</h1>
        {loading ? (
          <p>Connecting to brain...</p>
        ) : (
          <>
            <p className="message">{message}</p>
            {nodeId && (
              <p className="node-info">Node ID: {nodeId}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
