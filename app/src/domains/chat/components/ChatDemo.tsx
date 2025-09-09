import React, { useState } from 'react';

export function ChatDemo() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setResponse(data.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-demo">
      <h2>Mastra + OpenRouter Demo</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            disabled={loading}
            className="chat-input"
          />
          <button type="submit" disabled={loading || !message.trim()}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {response && (
        <div className="response-container">
          <h3>Response:</h3>
          <div className="response-text">{response}</div>
        </div>
      )}

      <div className="info-box">
        <p>
          <strong>Note:</strong> Add your OpenRouter API key to the .env file to enable this demo.
        </p>
        <p>
          Using model: openai/gpt-4o-mini
        </p>
      </div>

      <style jsx>{`
        .chat-demo {
          max-width: 600px;
          margin: 2rem auto;
          padding: 2rem;
          border: 1px solid #333;
          border-radius: 8px;
        }

        h2 {
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .chat-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #666;
          border-radius: 4px;
          background: #1a1a1a;
          color: white;
        }

        button {
          padding: 0.5rem 1rem;
          background: #4a5568;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        button:hover:not(:disabled) {
          background: #5a6578;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          background: #ff6b6b22;
          color: #ff6b6b;
          padding: 0.75rem;
          border-radius: 4px;
          margin: 1rem 0;
        }

        .response-container {
          background: #1a1a1a;
          padding: 1rem;
          border-radius: 4px;
          margin: 1rem 0;
        }

        .response-text {
          white-space: pre-wrap;
          color: #e0e0e0;
        }

        .info-box {
          margin-top: 1rem;
          padding: 1rem;
          background: #2a2a2a;
          border-radius: 4px;
          font-size: 0.9rem;
          color: #999;
        }
      `}</style>
    </div>
  );
}