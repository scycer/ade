import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { executeAgentQuery, getAgentHistory, indexFile } from '../../lib/server-functions'

export const Route = createFileRoute('/tools/file-agent')({
  component: FileAgent,
  loader: async () => await getAgentHistory(),
})

function FileAgent() {
  const history = Route.useLoaderData()
  const [query, setQuery] = useState('')
  const [currentPlan, setCurrentPlan] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleExecute = async () => {
    if (!query || isLoading) return
    
    setIsLoading(true)
    try {
      const result = await executeAgentQuery({ data: { query } })
      setCurrentPlan(result)
    } catch (error) {
      console.error('Error executing query:', error)
      // Display error in UI for testing
      setCurrentPlan({
        plan: {
          understanding: 'Error occurred',
          steps: [],
          expectedOutcome: 'Failed to execute'
        },
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI File Agent</h1>
        <p className="text-gray-600">Search and analyze files with AI-powered semantic search</p>
      </div>

      {/* Query Input */}
      <div className="mb-8">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask the agent: Find all React components with hooks, Show git changes in TypeScript files, etc."
          className="w-full p-4 border rounded-lg h-24"
        />
        <button
          onClick={handleExecute}
          disabled={!query || isLoading}
          className="mt-2 px-6 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-400"
        >
          {isLoading ? 'Agent Thinking...' : 'Execute'}
        </button>
      </div>

      {/* Current Plan Display */}
      {currentPlan && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Execution Plan</h2>
          {currentPlan.error && (
            <div className="p-3 bg-red-100 text-red-700 rounded mb-4">
              <strong>Error:</strong> {currentPlan.error}
            </div>
          )}
          <div className="space-y-2">
            <p><strong>Understanding:</strong> {currentPlan.plan.understanding}</p>
            <div>
              <strong>Steps:</strong>
              {currentPlan.plan.steps.map((step: any, i: number) => (
                <div key={i} className="ml-4 mt-2 p-2 bg-white rounded">
                  <div className="font-medium">{step.tool}</div>
                  <div className="text-sm text-gray-600">{step.reasoning}</div>
                  <pre className="text-xs mt-1 p-1 bg-gray-100 rounded overflow-x-auto">
                    {JSON.stringify(step.parameters, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="mt-4">
            <strong>Results:</strong>
            <pre className="mt-2 p-2 bg-white rounded text-sm overflow-x-auto">
              {JSON.stringify(currentPlan.results, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Recent Queries</h2>
        <div className="space-y-2">
          {history?.map((run: any) => (
            <div key={run.id} className="p-3 border rounded-lg">
              <div className="font-medium">{run.query}</div>
              <div className="text-sm text-gray-500">
                {new Date(run.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}