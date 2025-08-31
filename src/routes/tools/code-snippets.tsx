import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/tools/code-snippets')({
  component: CodeSnippets,
})

interface Snippet {
  id: number
  title: string
  language: string
  code: string
  description: string
  tags: string[]
  createdAt: Date
  favorite: boolean
}

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'React', 'HTML', 
  'CSS', 'SQL', 'Bash', 'JSON', 'Markdown'
]

const INITIAL_SNIPPETS: Snippet[] = [
  {
    id: 1,
    title: 'React useState Hook',
    language: 'React',
    code: `const [state, setState] = useState(initialValue);

// Example with counter
const [count, setCount] = useState(0);

const increment = () => {
  setCount(prevCount => prevCount + 1);
};`,
    description: 'Basic useState hook pattern with functional update',
    tags: ['react', 'hooks', 'state'],
    createdAt: new Date(),
    favorite: true,
  },
  {
    id: 2,
    title: 'Async/Await Error Handling',
    language: 'JavaScript',
    code: `async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}`,
    description: 'Proper error handling pattern for async/await',
    tags: ['async', 'error-handling', 'fetch'],
    createdAt: new Date(),
    favorite: false,
  },
  {
    id: 3,
    title: 'TypeScript Interface',
    language: 'TypeScript',
    code: `interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  metadata?: {
    lastLogin: Date;
    preferences: Record<string, any>;
  };
}

// Usage
const user: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin'
};`,
    description: 'TypeScript interface with optional properties and literal types',
    tags: ['typescript', 'interface', 'types'],
    createdAt: new Date(),
    favorite: true,
  },
]

function CodeSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>(INITIAL_SNIPPETS)
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  
  // Form state
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('JavaScript')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = 
      snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesLanguage = selectedLanguage === 'All' || snippet.language === selectedLanguage
    
    return matchesSearch && matchesLanguage
  })

  const addSnippet = () => {
    if (!title || !code) return

    const newSnippet: Snippet = {
      id: Date.now(),
      title,
      language,
      code,
      description,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date(),
      favorite: false,
    }

    setSnippets([newSnippet, ...snippets])
    resetForm()
    setShowForm(false)
  }

  const resetForm = () => {
    setTitle('')
    setLanguage('JavaScript')
    setCode('')
    setDescription('')
    setTags('')
  }

  const toggleFavorite = (id: number) => {
    setSnippets(snippets.map(s => 
      s.id === id ? { ...s, favorite: !s.favorite } : s
    ))
  }

  const deleteSnippet = (id: number) => {
    if (!confirm('Delete this snippet?')) return
    setSnippets(snippets.filter(s => s.id !== id))
    if (selectedSnippet?.id === id) {
      setSelectedSnippet(null)
    }
  }

  const copyToClipboard = async (snippet: Snippet) => {
    try {
      await navigator.clipboard.writeText(snippet.code)
      setCopiedId(snippet.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      JavaScript: 'bg-yellow-100 text-yellow-800',
      TypeScript: 'bg-blue-100 text-blue-800',
      Python: 'bg-green-100 text-green-800',
      React: 'bg-cyan-100 text-cyan-800',
      HTML: 'bg-orange-100 text-orange-800',
      CSS: 'bg-purple-100 text-purple-800',
      SQL: 'bg-pink-100 text-pink-800',
      Bash: 'bg-gray-100 text-gray-800',
    }
    return colors[lang] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Code Snippets</h1>
        <p className="text-gray-600">Store and organize reusable code snippets</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search snippets..."
          className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option>All</option>
          {LANGUAGES.map(lang => (
            <option key={lang}>{lang}</option>
          ))}
        </select>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
        >
          {showForm ? 'Cancel' : '+ New Snippet'}
        </button>
      </div>

      {/* Add Snippet Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-3">Add New Snippet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Snippet title..."
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {LANGUAGES.map(lang => (
                <option key={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code..."
            className="w-full px-3 py-2 border rounded-lg font-mono text-sm h-32 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)"
            className="w-full px-3 py-2 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={addSnippet}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Save Snippet
          </button>
        </div>
      )}

      {/* Snippets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Snippet List */}
        <div className="space-y-3">
          <h3 className="font-semibold mb-2">
            Snippets ({filteredSnippets.length})
          </h3>
          {filteredSnippets.map(snippet => (
            <div
              key={snippet.id}
              onClick={() => setSelectedSnippet(snippet)}
              className={`p-4 bg-white rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow ${
                selectedSnippet?.id === snippet.id ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{snippet.title}</h4>
                    {snippet.favorite && <span className="text-yellow-500">⭐</span>}
                  </div>
                  <p className="text-sm text-gray-600">{snippet.description}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${getLanguageColor(snippet.language)}`}>
                  {snippet.language}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {snippet.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 text-xs bg-gray-100 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(snippet)
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {copiedId === snippet.id ? '✓ Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(snippet.id)
                    }}
                    className="text-sm text-gray-600 hover:text-yellow-500"
                  >
                    {snippet.favorite ? '★' : '☆'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSnippet(snippet.id)
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Code Preview */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-3">Code Preview</h3>
          {selectedSnippet ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{selectedSnippet.title}</h4>
                <button
                  onClick={() => copyToClipboard(selectedSnippet)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  {copiedId === selectedSnippet.id ? '✓ Copied' : 'Copy Code'}
                </button>
              </div>
              <pre className="p-4 bg-gray-50 rounded overflow-auto">
                <code className="text-sm">{selectedSnippet.code}</code>
              </pre>
              {selectedSnippet.description && (
                <p className="mt-3 text-sm text-gray-600">{selectedSnippet.description}</p>
              )}
              <div className="mt-3 flex gap-1">
                {selectedSnippet.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs bg-gray-100 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Select a snippet to preview the code
            </div>
          )}
        </div>
      </div>
    </div>
  )
}