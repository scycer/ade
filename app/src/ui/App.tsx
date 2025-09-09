import { useEffect, useState } from "react";
import "./index.css";

interface Tool {
  name: string;
  methods: string[];
}

export function App() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tools")
      .then((res) => res.json())
      .then((data) => {
        setTools(data.tools);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch tools:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="frame-window">
      <div className="split-container">
        <div className="left-panel">
          <h2>Available Tools</h2>
          {loading ? (
            <p>Loading tools...</p>
          ) : (
            <div>
              {tools.map((tool) => (
                <div key={tool.name}>
                  <h3>{tool.name}</h3>
                  <ul>
                    {tool.methods.map((method) => (
                      <li key={method}>{method}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="right-panel">
          <h2>Details</h2>
          <p>Select a tool to view details</p>
        </div>
      </div>
    </div>
  );
}

export default App;
