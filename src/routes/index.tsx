import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { tools } from '../config/tools'
import { ToolCard } from '../components/ToolCard'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">ADE - AI Development Environment</h1>
        <p className="text-gray-600 text-lg">Your personal AI-powered development toolkit</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tools..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {/* Stats Section */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{tools.filter(t => t.enabled).length}</div>
            <div className="text-sm text-gray-600">Active Tools</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{tools.filter(t => !t.enabled).length}</div>
            <div className="text-sm text-gray-600">Coming Soon</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">AI</div>
            <div className="text-sm text-gray-600">Powered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">Local</div>
            <div className="text-sm text-gray-600">First</div>
          </div>
        </div>
      </div>
    </div>
  )
}
