import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { listFiles, readFileContent, deleteFile, indexFile, uploadFile } from '../../lib/server-functions'

export const Route = createFileRoute('/tools/file-browser')({
  component: FileBrowser,
})

interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
  size: number
  modified: Date | null
  extension: string | null
}

function FileBrowser() {
  const [currentPath, setCurrentPath] = useState('')
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial directory
  useEffect(() => {
    loadDirectory()
  }, [])

  const loadDirectory = async (path?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await listFiles({ data: { path } })
      setCurrentPath(result.currentPath)
      setFiles(result.files)
      setSelectedFile(null)
      setFileContent(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load directory')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileClick = async (file: FileItem) => {
    if (file.isDirectory) {
      loadDirectory(file.path)
    } else {
      setSelectedFile(file)
      setIsLoading(true)
      try {
        const result = await readFileContent({ data: { path: file.path } })
        setFileContent(result.content)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to read file')
        setFileContent(null)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Delete ${file.name}?`)) return
    
    try {
      await deleteFile({ data: { path: file.path } })
      loadDirectory(currentPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
    }
  }

  const handleIndexFile = async (file: FileItem) => {
    if (!file.isFile) return
    
    setIsLoading(true)
    try {
      const content = await readFileContent({ data: { path: file.path } })
      const result = await indexFile({ data: { path: file.path, content: content.content } })
      alert(`File indexed successfully! Summary: ${result.summary}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to index file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target?.result as string
        const base64Content = content.split(',')[1] // Remove data:type;base64, prefix
        
        await uploadFile({ 
          data: { 
            filename: file.name, 
            content: base64Content,
            encoding: 'base64'
          } 
        })
        
        loadDirectory(currentPath)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setIsLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">File Browser</h1>
        <p className="text-gray-600">Browse, upload, and manage files in your project</p>
      </div>

      {/* Current Path and Upload */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Current Path:</span>
          <code className="px-2 py-1 bg-gray-100 rounded">{currentPath || '/'}</code>
        </div>
        <div className="flex gap-2">
          <label className="px-4 py-2 bg-green-500 text-white rounded-lg cursor-pointer hover:bg-green-600">
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isLoading}
            />
            Upload File
          </label>
          <button
            onClick={() => loadDirectory(currentPath)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* File List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 font-semibold">Files & Folders</div>
          <div className="max-h-[600px] overflow-y-auto">
            {isLoading && !files.length ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : (
              <div className="divide-y">
                {files.map((file) => (
                  <div
                    key={file.path}
                    className={`px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between ${
                      selectedFile?.path === file.path ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {file.isDirectory ? '📁' : '📄'}
                      </span>
                      <div>
                        <div className="font-medium">{file.name}</div>
                        <div className="text-xs text-gray-500">
                          {file.isFile && formatFileSize(file.size)}
                          {file.modified && ` • ${new Date(file.modified).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                    {file.isFile && (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleIndexFile(file)
                          }}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          title="Index for AI search"
                        >
                          🤖 Index
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(file)
                          }}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          title="Delete file"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* File Preview */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 font-semibold">
            {selectedFile ? `Preview: ${selectedFile.name}` : 'File Preview'}
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {isLoading && selectedFile ? (
              <div className="text-center text-gray-500">Loading file content...</div>
            ) : fileContent ? (
              <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                {fileContent}
              </pre>
            ) : (
              <div className="text-center text-gray-500">
                Select a file to preview its contents
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}