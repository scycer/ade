import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

let requestId = 1;

async function rpcCall(method: string, params?: any) {
  const response = await fetch('/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: requestId++,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.result;
}

function App() {
  const [responses, setResponses] = useState<Array<{ method: string; result: any }>>([]);
  const [loading, setLoading] = useState(false);
  const [echoInput, setEchoInput] = useState('');

  const callRpc = async (method: string, params?: any) => {
    setLoading(true);
    try {
      const result = await rpcCall(method, params);
      setResponses(prev => [...prev, { method, result }]);
    } catch (error) {
      setResponses(prev => [...prev, {
        method,
        result: { error: error instanceof Error ? error.message : 'Unknown error' }
      }]);
    } finally {
      setLoading(false);
    }
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  };

  const headerStyles: React.CSSProperties = {
    textAlign: 'center',
    fontSize: '2rem',
    fontWeight: '600',
    marginBottom: '1rem',
  };

  const buttonContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  };

  const buttonStyles: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    background: '#333333',
    border: '1px solid #505050',
    color: '#ffffff',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    fontSize: '1rem',
    fontFamily: 'Fira Code, monospace',
    opacity: loading ? 0.5 : 1,
  };

  const inputContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  };

  const inputStyles: React.CSSProperties = {
    padding: '0.75rem',
    background: '#2a2a2a',
    border: '1px solid #404040',
    color: '#ffffff',
    fontSize: '1rem',
    fontFamily: 'Fira Code, monospace',
    flex: 1,
  };

  const responseContainerStyles: React.CSSProperties = {
    background: '#2a2a2a',
    border: '1px solid #404040',
    padding: '1rem',
    marginTop: '2rem',
    maxHeight: '400px',
    overflowY: 'auto',
  };

  const responseItemStyles: React.CSSProperties = {
    marginBottom: '1rem',
    padding: '0.5rem',
    background: '#1a1a1a',
    border: '1px solid #333333',
  };

  const methodStyles: React.CSSProperties = {
    color: '#fbbf24',
    fontWeight: '600',
    marginBottom: '0.25rem',
  };

  const resultStyles: React.CSSProperties = {
    fontFamily: 'Fira Code, monospace',
    fontSize: '0.875rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  return (
    <div style={containerStyles}>
      <h1 style={headerStyles}>🚀 Bun + React + JSON-RPC</h1>

      <div style={buttonContainerStyles}>
        <button
          style={buttonStyles}
          onClick={() => callRpc('hello')}
          disabled={loading}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#444444')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#333333')}
        >
          Call hellos()
        </button>

        <button
          style={buttonStyles}
          onClick={() => callRpc('getTime')}
          disabled={loading}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#444444')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#333333')}
        >
          Call getTime()
        </button>
      </div>

      <div style={inputContainerStyles}>
        <input
          type="text"
          placeholder="Enter message for echo..."
          value={echoInput}
          onChange={(e) => setEchoInput(e.target.value)}
          style={inputStyles}
          onKeyPress={(e) => e.key === 'Enter' && !loading && callRpc('echo', { message: echoInput })}
        />
        <button
          style={buttonStyles}
          onClick={() => callRpc('echo', { message: echoInput })}
          disabled={loading || !echoInput}
          onMouseEnter={(e) => !loading && echoInput && (e.currentTarget.style.background = '#444444')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#333333')}
        >
          Call echo()
        </button>
      </div>

      {responses.length > 0 && (
        <div style={responseContainerStyles}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Responses:</h2>
          {responses.slice().reverse().map((response, index) => (
            <div key={responses.length - index - 1} style={responseItemStyles}>
              <div style={methodStyles}>→ {response.method}()</div>
              <div style={resultStyles}>
                {JSON.stringify(response.result, null, 2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);