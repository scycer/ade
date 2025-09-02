import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { Agent } from '@mastra/core/agent'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const execAsync = promisify(exec)

// Initialize OpenRouter with the API key
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
})

// Create the AI agent for generating commit descriptions
const commitAnalyzer = new Agent({
  name: 'CommitAnalyzer',
  instructions: `You are an expert git commit analyzer. When given a git commit diff, you will:
  1. Generate a concise, descriptive title (max 72 characters) that captures the essence of the changes
  2. Write a detailed description that explains:
     - What changes were made
     - Why these changes might have been made (based on the code context)
     - The impact of these changes
     - Any notable patterns or techniques used
  
  Format your response as JSON with the following structure:
  {
    "title": "Brief, descriptive title",
    "description": "Detailed multi-line description of the changes"
  }
  
  Be professional, technical, and accurate in your analysis.`,
  model: openrouter('openai/gpt-oss-120b'),
})

interface Commit {
  hash: string
  shortHash: string
  author: string
  email: string
  date: string
  message: string
  stats: {
    filesChanged: number
    insertions: number
    deletions: number
  }
}

interface DiffData {
  commit: Commit
  diff: string
}

interface GeneratedDescription {
  title: string
  description: string
}

const getCommits = createServerFn({
  method: 'GET',
}).handler(async ({ page = 1 }: { page?: number }) => {
  const perPage = 20
  const skip = (page - 1) * perPage
  
  try {
    // Get total commit count
    const { stdout: countResult } = await execAsync('git rev-list --count HEAD')
    const totalCount = parseInt(countResult.trim())
    
    // Get paginated commits with stats
    const { stdout: result } = await execAsync(`git log --skip=${skip} --max-count=${perPage} --format=format:"%H|%h|%an|%ae|%ai|%s" --numstat`)
    
    const commits: Commit[] = []
    const lines = result.split('\n')
    let i = 0
    
    while (i < lines.length) {
      const line = lines[i]
      if (!line || !line.includes('|')) {
        i++
        continue
      }
      
      const [hash, shortHash, author, email, date, ...messageParts] = line.split('|')
      const message = messageParts.join('|')
      
      let filesChanged = 0
      let insertions = 0
      let deletions = 0
      
      // Parse numstat data
      i++
      while (i < lines.length && lines[i] && !lines[i].includes('|')) {
        const statLine = lines[i].trim()
        if (statLine) {
          const [added, deleted] = statLine.split('\t')
          if (added !== '-' && deleted !== '-') {
            filesChanged++
            insertions += parseInt(added) || 0
            deletions += parseInt(deleted) || 0
          }
        }
        i++
      }
      
      commits.push({
        hash,
        shortHash,
        author,
        email,
        date: new Date(date).toLocaleString(),
        message,
        stats: {
          filesChanged,
          insertions,
          deletions
        }
      })
    }
    
    return {
      commits,
      page,
      totalPages: Math.ceil(totalCount / perPage),
      totalCount
    }
  } catch (error) {
    console.error('Error fetching commits:', error)
    return {
      commits: [],
      page: 1,
      totalPages: 0,
      totalCount: 0,
      error: 'Failed to fetch git history. Make sure you are in a git repository.'
    }
  }
})

const getCommitDiff = createServerFn({
  method: 'GET',
})
  .validator((hash: string) => hash)
  .handler(async ({ data }) => {
    const hash = data
    try {
      // Validate hash to prevent command injection
      if (!hash || !/^[a-f0-9]{7,40}$/i.test(hash)) {
        throw new Error('Invalid commit hash: ' + hash)
      }
    
    // Get commit info
    const { stdout: commitInfo } = await execAsync(`git show --format=format:"%H|%h|%an|%ae|%ai|%s" --no-patch ${hash}`)
    const [fullHash, shortHash, author, email, date, ...messageParts] = commitInfo.split('|')
    
    // Get the diff
    const { stdout: diff } = await execAsync(`git show ${hash} --format= --unified=3`)
    
    // Get stats
    const { stdout: stats } = await execAsync(`git show --stat --format= ${hash}`)
    const statLines = stats.trim().split('\n')
    const lastLine = statLines[statLines.length - 1]
    
    let filesChanged = 0
    let insertions = 0
    let deletions = 0
    
    const statMatch = lastLine.match(/(\d+) files? changed/)
    if (statMatch) filesChanged = parseInt(statMatch[1])
    
    const insertMatch = lastLine.match(/(\d+) insertions?\(\+\)/)
    if (insertMatch) insertions = parseInt(insertMatch[1])
    
    const deleteMatch = lastLine.match(/(\d+) deletions?\(-\)/)
    if (deleteMatch) deletions = parseInt(deleteMatch[1])
    
    const commit: Commit = {
      hash: fullHash,
      shortHash,
      author,
      email,
      date: new Date(date).toLocaleString(),
      message: messageParts.join('|'),
      stats: {
        filesChanged,
        insertions,
        deletions
      }
    }
    
    return {
      commit,
      diff
    }
  } catch (error) {
    console.error('Error fetching commit diff:', error)
    return {
      error: 'Failed to fetch commit diff'
    }
  }
})

const generateCommitDescription = createServerFn({
  method: 'POST',
})
  .validator((data: { hash: string; diff: string; message: string }) => data)
  .handler(async ({ data }) => {
    const { hash, diff, message } = data
    
    try {
      // Generate AI description using the commit diff
      const prompt = `Analyze this git commit:

Original commit message: ${message}

Commit hash: ${hash}

Diff:
${diff.substring(0, 8000)} ${diff.length > 8000 ? '... (truncated)' : ''}`
      
      const response = await commitAnalyzer.generate([
        { role: 'user', content: prompt }
      ])
      
      // Parse the JSON response
      try {
        const result = JSON.parse(response.text)
        return {
          success: true,
          title: result.title,
          description: result.description
        }
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          success: true,
          title: message.substring(0, 72),
          description: response.text
        }
      }
    } catch (error) {
      console.error('Error generating commit description:', error)
      return {
        success: false,
        error: 'Failed to generate description. Please check your OPENROUTER_API_KEY.'
      }
    }
  })

export const Route = createFileRoute('/git-history')({
  component: GitHistory,
  loader: async () => await getCommits({ page: 1 }),
})

function GitHistory() {
  const router = useRouter()
  const initialData = Route.useLoaderData()
  const [data, setData] = useState(initialData)
  const [selectedCommit, setSelectedCommit] = useState<DiffData | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatingDescriptions, setGeneratingDescriptions] = useState<Set<string>>(new Set())
  const [generatedDescriptions, setGeneratedDescriptions] = useState<Map<string, GeneratedDescription>>(new Map())
  
  const loadPage = async (page: number) => {
    setLoading(true)
    const newData = await getCommits({ page })
    setData(newData)
    setLoading(false)
  }
  
  const viewDiff = async (hash: string) => {
    setLoading(true)
    try {
      const diffData = await getCommitDiff({ data: hash })
      if (!diffData.error) {
        setSelectedCommit(diffData as DiffData)
      }
    } catch (error) {
      console.error('Error calling getCommitDiff:', error)
    }
    setLoading(false)
  }
  
  const generateDescription = async (commit: Commit, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent triggering the commit click
    
    // Check if already generating or generated
    if (generatingDescriptions.has(commit.hash) || generatedDescriptions.has(commit.hash)) {
      return
    }
    
    // Mark as generating
    setGeneratingDescriptions(prev => new Set([...prev, commit.hash]))
    
    try {
      // First fetch the diff for this commit
      const diffData = await getCommitDiff({ data: commit.hash })
      if (!diffData.error && diffData.diff) {
        // Generate the description
        const result = await generateCommitDescription({
          data: {
            hash: commit.hash,
            diff: diffData.diff,
            message: commit.message
          }
        })
        
        if (result.success) {
          setGeneratedDescriptions(prev => new Map(prev).set(commit.hash, {
            title: result.title,
            description: result.description
          }))
        } else {
          alert(result.error || 'Failed to generate description')
        }
      }
    } catch (error) {
      console.error('Error generating description:', error)
      alert('Failed to generate description')
    } finally {
      // Remove from generating set
      setGeneratingDescriptions(prev => {
        const newSet = new Set(prev)
        newSet.delete(commit.hash)
        return newSet
      })
    }
  }
  
  const containerStyles: React.CSSProperties = {
    fontFamily: 'Fira Code, monospace',
    color: '#ffffff',
    padding: '2rem',
    minHeight: '100vh',
    background: '#1a1a1a',
  }
  
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    padding: '1rem',
    background: '#2a2a2a',
    border: '1px solid #404040',
  }
  
  const titleStyles: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: '600',
  }
  
  const linkStyles: React.CSSProperties = {
    color: '#ffffff',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    background: '#333333',
    border: '1px solid #505050',
    transition: 'all 0.2s',
    cursor: 'pointer',
  }
  
  const commitCardStyles: React.CSSProperties = {
    background: '#2a2a2a',
    border: '1px solid #404040',
    padding: '1rem',
    marginBottom: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }
  
  const hashStyles: React.CSSProperties = {
    color: '#fbbf24',
    fontFamily: 'Fira Code, monospace',
  }
  
  const statsStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#999999',
    marginTop: '0.5rem',
  }
  
  const paginationStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '2rem',
  }
  
  const buttonStyles: React.CSSProperties = {
    padding: '0.5rem 1rem',
    background: '#333333',
    border: '1px solid #505050',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }
  
  const aiButtonStyles: React.CSSProperties = {
    padding: '0.25rem 0.5rem',
    background: '#4a5568',
    border: '1px solid #606060',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '0.75rem',
    marginLeft: '0.5rem',
    borderRadius: '4px',
  }
  
  const generatedBoxStyles: React.CSSProperties = {
    marginTop: '0.5rem',
    padding: '0.75rem',
    background: '#1e1e1e',
    border: '1px solid #4a5568',
    borderRadius: '4px',
  }
  
  const diffContainerStyles: React.CSSProperties = {
    background: '#2a2a2a',
    border: '1px solid #404040',
    padding: '1rem',
    marginTop: '1rem',
    overflowX: 'auto',
  }
  
  const diffLineStyles = (type: 'add' | 'remove' | 'normal'): React.CSSProperties => ({
    fontFamily: 'Fira Code, monospace',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    whiteSpace: 'pre',
    margin: 0,
    background: type === 'add' ? '#22c55e20' : type === 'remove' ? '#ef444420' : 'transparent',
    color: type === 'add' ? '#22c55e' : type === 'remove' ? '#ef4444' : '#cccccc',
  })
  
  if (selectedCommit) {
    return (
      <div style={containerStyles}>
        <div style={headerStyles}>
          <h1 style={titleStyles}>Commit: {selectedCommit.commit.shortHash}</h1>
          <button
            style={linkStyles}
            onClick={() => setSelectedCommit(null)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#444444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#333333'
            }}
          >
            Back to List
          </button>
        </div>
        
        <div style={{ background: '#2a2a2a', border: '1px solid #404040', padding: '1rem', marginBottom: '1rem' }}>
          <div><strong>Author:</strong> {selectedCommit.commit.author} &lt;{selectedCommit.commit.email}&gt;</div>
          <div><strong>Date:</strong> {selectedCommit.commit.date}</div>
          <div><strong>Message:</strong> {selectedCommit.commit.message}</div>
          <div style={statsStyles}>
            {selectedCommit.commit.stats.filesChanged} files changed, {' '}
            <span style={{ color: '#22c55e' }}>+{selectedCommit.commit.stats.insertions}</span>, {' '}
            <span style={{ color: '#ef4444' }}>-{selectedCommit.commit.stats.deletions}</span>
          </div>
        </div>
        
        <div style={diffContainerStyles}>
          {selectedCommit.diff.split('\n').map((line, i) => {
            const type = line.startsWith('+') ? 'add' : line.startsWith('-') ? 'remove' : 'normal'
            return <div key={i} style={diffLineStyles(type)}>{line || ' '}</div>
          })}
        </div>
      </div>
    )
  }
  
  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h1 style={titleStyles}>Git History</h1>
        <Link 
          to="/" 
          style={linkStyles}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#444444'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#333333'
          }}
        >
          Home
        </Link>
      </div>
      
      {data.error ? (
        <div style={{ color: '#ef4444', padding: '1rem', background: '#2a2a2a', border: '1px solid #404040' }}>
          {data.error}
        </div>
      ) : (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
          ) : (
            <>
              {data.commits.map((commit) => (
                <div
                  key={commit.hash}
                  style={commitCardStyles}
                  onClick={() => viewDiff(commit.hash)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#333333'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#2a2a2a'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={hashStyles}>{commit.shortHash}</span> • {' '}
                      <span>{new Date(commit.date).toLocaleString('en-US', { 
                        timeZone: 'UTC',
                        hour: 'numeric',
                        minute: 'numeric',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}</span> • {' '}
                      <span>{commit.author}</span>
                    </div>
                    <button
                      style={aiButtonStyles}
                      onClick={(e) => generateDescription(commit, e)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#5a6578'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#4a5568'
                      }}
                      disabled={generatingDescriptions.has(commit.hash)}
                    >
                      {generatingDescriptions.has(commit.hash) 
                        ? 'Generating...' 
                        : generatedDescriptions.has(commit.hash)
                        ? 'Regenerate AI Description'
                        : 'Generate AI Description'
                      }
                    </button>
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>{commit.message}</div>
                  <div style={statsStyles}>
                    {commit.stats.filesChanged} files changed, {' '}
                    <span style={{ color: '#22c55e' }}>+{commit.stats.insertions}</span>, {' '}
                    <span style={{ color: '#ef4444' }}>-{commit.stats.deletions}</span>
                  </div>
                  {generatedDescriptions.has(commit.hash) && (
                    <div style={generatedBoxStyles}>
                      <div style={{ fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.5rem' }}>
                        AI Generated:
                      </div>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {generatedDescriptions.get(commit.hash)?.title}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#cccccc', whiteSpace: 'pre-wrap' }}>
                        {generatedDescriptions.get(commit.hash)?.description}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {data.totalPages > 1 && (
                <div style={paginationStyles}>
                  <button
                    style={{
                      ...buttonStyles,
                      opacity: data.page === 1 ? 0.5 : 1,
                      cursor: data.page === 1 ? 'not-allowed' : 'pointer',
                    }}
                    disabled={data.page === 1}
                    onClick={() => data.page > 1 && loadPage(data.page - 1)}
                  >
                    Previous
                  </button>
                  
                  <span>
                    Page {data.page} of {data.totalPages}
                  </span>
                  
                  <button
                    style={{
                      ...buttonStyles,
                      opacity: data.page === data.totalPages ? 0.5 : 1,
                      cursor: data.page === data.totalPages ? 'not-allowed' : 'pointer',
                    }}
                    disabled={data.page === data.totalPages}
                    onClick={() => data.page < data.totalPages && loadPage(data.page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}