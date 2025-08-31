import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/tools/api-tester')({
  component: ApiTester,
})

function ApiTester() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1')
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}')
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendRequest = async () => {
    setIsLoading(true)
    setError(null)
    setResponse(null)

    try {
      const options: RequestInit = {
        method,
        headers: JSON.parse(headers),
      }

      if (method !== 'GET' && method !== 'HEAD' && body) {
        options.body = body
      }

      const res = await fetch(url, options)
      const contentType = res.headers.get('content-type')
      
      let data
      if (contentType?.includes('application/json')) {
        data = await res.json()
      } else {
        data = await res.text()
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">API Tester</h1>
        <p className="text-gray-600">Test and debug API endpoints with a powerful interface</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Section */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-3">Request</h2>
            
            {/* Method and URL */}
            <div className="flex gap-2 mb-4">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
                <option>HEAD</option>
                <option>OPTIONS</option>
              </select>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Headers */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Headers (JSON)</label>
              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm h-24 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Body */}
            {method !== 'GET' && method !== 'HEAD' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Request body (JSON, text, etc.)"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm h-32 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={sendRequest}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400"
            >
              {isLoading ? 'Sending...' : 'Send Request'}
            </button>
          </div>

          {/* Quick Examples */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Quick Examples</h3>
            <div className="space-y-1 text-sm">
              <button
                onClick={() => {
                  setMethod('GET')
                  setUrl('https://jsonplaceholder.typicode.com/posts')
                }}
                className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
              >
                GET Posts from JSONPlaceholder
              </button>
              <button
                onClick={() => {
                  setMethod('POST')
                  setUrl('https://jsonplaceholder.typicode.com/posts')
                  setBody('{\n  "title": "Test Post",\n  "body": "This is a test",\n  "userId": 1\n}')
                }}
                className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
              >
                POST Create a Post
              </button>
              <button
                onClick={() => {
                  setMethod('GET')
                  setUrl('https://api.github.com/users/github')
                }}
                className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
              >
                GET GitHub User Info
              </button>
            </div>
          </div>
        </div>

        {/* Response Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-3">Response</h2>
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded mb-4">
              Error: {error}
            </div>
          )}

          {response && (
            <div className="space-y-4">
              {/* Status */}
              <div>
                <span className="font-medium">Status: </span>
                <span className={`px-2 py-1 rounded text-sm ${
                  response.status >= 200 && response.status < 300
                    ? 'bg-green-100 text-green-700'
                    : response.status >= 400
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {response.status} {response.statusText}
                </span>
              </div>

              {/* Response Headers */}
              <div>
                <h3 className="font-medium mb-1">Response Headers</h3>
                <pre className="p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(response.headers, null, 2)}
                </pre>
              </div>

              {/* Response Body */}
              <div>
                <h3 className="font-medium mb-1">Response Body</h3>
                <pre className="p-2 bg-gray-50 rounded text-sm overflow-auto max-h-96">
                  {typeof response.data === 'string'
                    ? response.data
                    : JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!response && !error && !isLoading && (
            <div className="text-center text-gray-500 py-8">
              Send a request to see the response
            </div>
          )}
        </div>
      </div>
    </div>
  )
}