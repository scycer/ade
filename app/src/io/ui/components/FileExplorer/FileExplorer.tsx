import React, { useState, useEffect } from 'react';
import './FileExplorer.css';

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  modified: string;
  isDirectory: boolean;
  extension?: string;
}

export const FileExplorer: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    const filtered = files.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFiles(filtered);
  }, [searchTerm, files]);

  const loadFiles = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/files`);
      const data = await response.json();
      
      if (data.files) {
        // Filter out directories and just show files
        const filesOnly = data.files.filter((f: FileInfo) => !f.isDirectory);
        setFiles(filesOnly);
        setFilteredFiles(filesOnly);
      }
    } catch (err) {
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (file: FileInfo) => {
    setSelectedFile(file);
    setLoading(true);
    
    try {
      const response = await fetch(`/api/file?path=${encodeURIComponent(file.path)}`);
      const data = await response.json();
      
      if (!data.error) {
        setFileContent(data.content || '');
      }
    } catch (err) {
      console.error('Error reading file:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-explorer-simple">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="files-container">
        {loading && filteredFiles.length === 0 ? (
          <div className="loading">Loading files...</div>
        ) : (
          <div className="file-list-simple">
            {filteredFiles.length === 0 ? (
              <div className="empty-state">No files found</div>
            ) : (
              filteredFiles.map((file) => (
                <div
                  key={file.path}
                  className={`file-item-simple ${selectedFile?.path === file.path ? 'selected' : ''}`}
                  onClick={() => handleFileClick(file)}
                >
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
              ))
            )}
          </div>
        )}
        
        {selectedFile && (
          <div className="file-content-preview">
            <div className="preview-header">
              <span>{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="close-btn">×</button>
            </div>
            <pre className="preview-content">
              {loading ? 'Loading...' : fileContent}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};