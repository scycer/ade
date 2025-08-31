import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/tools/git-helper')({
  component: GitHelper,
})

interface GitStatus {
  branch: string
  modified: string[]
  untracked: string[]
  staged: string[]
}

function GitHelper() {
  const [activeTab, setActiveTab] = useState<'status' | 'commits' | 'branches' | 'commands'>('status')
  const [gitStatus, setGitStatus] = useState<GitStatus>({
    branch: 'main',
    modified: ['src/routes/index.tsx', 'src/lib/server-functions.ts'],
    untracked: ['uploads/', '.env.local'],
    staged: ['src/components/Header.tsx'],
  })
  
  const [commitMessage, setCommitMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  const commonCommands = [
    { 
      name: 'Status', 
      command: 'git status', 
      description: 'Show the working tree status',
      icon: '📊'
    },
    { 
      name: 'Pull', 
      command: 'git pull', 
      description: 'Fetch from and integrate with another repository',
      icon: '⬇️'
    },
    { 
      name: 'Push', 
      command: 'git push', 
      description: 'Update remote refs along with associated objects',
      icon: '⬆️'
    },
    { 
      name: 'Stash', 
      command: 'git stash', 
      description: 'Stash the changes in a dirty working directory',
      icon: '📦'
    },
    { 
      name: 'Log', 
      command: 'git log --oneline -10', 
      description: 'Show commit logs',
      icon: '📜'
    },
    { 
      name: 'Diff', 
      command: 'git diff', 
      description: 'Show changes between commits, commit and working tree',
      icon: '🔍'
    },
    { 
      name: 'Branch List', 
      command: 'git branch -a', 
      description: 'List all branches',
      icon: '🌿'
    },
    { 
      name: 'Reset Soft', 
      command: 'git reset --soft HEAD~1', 
      description: 'Undo last commit, keep changes',
      icon: '↩️'
    },
  ]

  const recentCommits = [
    { 
      hash: 'a1b2c3d', 
      message: 'feat: Add file browser tool', 
      author: 'You', 
      time: '2 hours ago' 
    },
    { 
      hash: 'e4f5g6h', 
      message: 'fix: Update navigation header styling', 
      author: 'You', 
      time: '3 hours ago' 
    },
    { 
      hash: 'i7j8k9l', 
      message: 'refactor: Reorganize tool components', 
      author: 'You', 
      time: '5 hours ago' 
    },
    { 
      hash: 'm0n1o2p', 
      message: 'docs: Update README with new tools', 
      author: 'You', 
      time: 'Yesterday' 
    },
  ]

  const branches = [
    { name: 'main', current: true, lastCommit: '2 hours ago' },
    { name: 'feature/file-upload', current: false, lastCommit: '1 day ago' },
    { name: 'fix/api-errors', current: false, lastCommit: '3 days ago' },
    { name: 'dev', current: false, lastCommit: '1 week ago' },
  ]

  const toggleFileSelection = (file: string) => {
    setSelectedFiles(prev =>
      prev.includes(file)
        ? prev.filter(f => f !== file)
        : [...prev, file]
    )
  }

  const executeCommand = (command: string) => {
    // In a real implementation, this would call a server function
    alert(`Would execute: ${command}`)
  }

  const handleCommit = () => {
    if (!commitMessage) {
      alert('Please enter a commit message')
      return
    }
    
    if (selectedFiles.length === 0) {
      alert('Please select files to commit')
      return
    }
    
    // In a real implementation, this would stage files and commit
    alert(`Would commit ${selectedFiles.length} files with message: "${commitMessage}"`)
    setCommitMessage('')
    setSelectedFiles([])
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Git Helper</h1>
        <p className="text-gray-600">Visual git operations and repository management</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {(['status', 'commits', 'branches', 'commands'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-teal-500 text-teal-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Status Tab */}
      {activeTab === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Status */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Repository Status</h3>
                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded text-sm">
                  Branch: {gitStatus.branch}
                </span>
              </div>

              {/* Staged Files */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-green-700 mb-2">
                  Staged ({gitStatus.staged.length})
                </h4>
                {gitStatus.staged.map(file => (
                  <div key={file} className="flex items-center gap-2 py-1">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm">{file}</span>
                  </div>
                ))}
              </div>

              {/* Modified Files */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-yellow-700 mb-2">
                  Modified ({gitStatus.modified.length})
                </h4>
                {gitStatus.modified.map(file => (
                  <div key={file} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file)}
                      onChange={() => toggleFileSelection(file)}
                      className="text-teal-600"
                    />
                    <span className="text-yellow-600">M</span>
                    <span className="text-sm">{file}</span>
                  </div>
                ))}
              </div>

              {/* Untracked Files */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Untracked ({gitStatus.untracked.length})
                </h4>
                {gitStatus.untracked.map(file => (
                  <div key={file} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file)}
                      onChange={() => toggleFileSelection(file)}
                      className="text-teal-600"
                    />
                    <span className="text-gray-600">?</span>
                    <span className="text-sm">{file}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Commit Section */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Commit Changes</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Selected Files ({selectedFiles.length})
              </label>
              {selectedFiles.length > 0 ? (
                <div className="p-2 bg-gray-50 rounded text-sm max-h-32 overflow-auto">
                  {selectedFiles.map(file => (
                    <div key={file}>{file}</div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Select files from the status panel</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Commit Message
              </label>
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Enter commit message..."
                className="w-full px-3 py-2 border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCommit}
                className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
              >
                Commit Changes
              </button>
              <button
                onClick={() => executeCommand('git push')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Push
              </button>
            </div>

            {/* Quick Commit Templates */}
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Quick Templates:</p>
              <div className="flex flex-wrap gap-2">
                {['feat:', 'fix:', 'docs:', 'style:', 'refactor:', 'test:'].map(prefix => (
                  <button
                    key={prefix}
                    onClick={() => setCommitMessage(prefix + ' ')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    {prefix}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commits Tab */}
      {activeTab === 'commits' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Recent Commits</h3>
            <div className="space-y-3">
              {recentCommits.map(commit => (
                <div key={commit.hash} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded">{commit.hash}</code>
                      <span className="font-medium">{commit.message}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      by {commit.author} • {commit.time}
                    </div>
                  </div>
                  <button
                    onClick={() => executeCommand(`git show ${commit.hash}`)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Branches Tab */}
      {activeTab === 'branches' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Branches</h3>
              <button
                onClick={() => executeCommand('git branch')}
                className="px-3 py-1 bg-teal-100 text-teal-700 rounded text-sm hover:bg-teal-200"
              >
                + New Branch
              </button>
            </div>
            <div className="space-y-2">
              {branches.map(branch => (
                <div
                  key={branch.name}
                  className={`flex items-center justify-between p-3 rounded ${
                    branch.current ? 'bg-teal-50 border border-teal-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {branch.current && <span className="text-teal-600">→</span>}
                    <div>
                      <div className="font-medium">{branch.name}</div>
                      <div className="text-sm text-gray-600">Last commit: {branch.lastCommit}</div>
                    </div>
                  </div>
                  {!branch.current && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => executeCommand(`git checkout ${branch.name}`)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Checkout
                      </button>
                      <button
                        onClick={() => executeCommand(`git branch -d ${branch.name}`)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Commands Tab */}
      {activeTab === 'commands' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {commonCommands.map(cmd => (
            <div
              key={cmd.command}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => executeCommand(cmd.command)}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{cmd.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{cmd.name}</h4>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block mb-2">
                    {cmd.command}
                  </code>
                  <p className="text-sm text-gray-600">{cmd.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}