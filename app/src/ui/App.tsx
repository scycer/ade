import { useEffect, useState } from "react";

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
    <div>
      <h1>ADE - AI-first Development Environment</h1>
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
  );
}

export default App;
