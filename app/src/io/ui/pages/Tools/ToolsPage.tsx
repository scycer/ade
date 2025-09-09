import React from 'react';
import './ToolsPage.css';
import { FileExplorer } from '../../../../domains/files/components/FileExplorer/FileExplorer';
import { ChatDemo } from '../../../../domains/chat/components/ChatDemo';

export const ToolsPage: React.FC = () => {
  return (
    <div className="tools-page">
      <div className="page-header">
        <h2>Development Tools</h2>
        <p>File explorer, AI chat, and other development utilities</p>
      </div>

      <div className="tools-grid">
        <div className="tool-section">
          <h3>File Explorer</h3>
          <FileExplorer />
        </div>
        
        <div className="tool-section">
          <h3>AI Assistant</h3>
          <ChatDemo />
        </div>
      </div>

      <div className="additional-tools">
        <h3>Quick Tools</h3>
        <div className="tool-cards">
          <div className="tool-card">
            <span className="tool-icon">🔍</span>
            <h4>Code Search</h4>
            <p>Search across all files</p>
          </div>
          <div className="tool-card">
            <span className="tool-icon">📝</span>
            <h4>Notes</h4>
            <p>Quick notes and snippets</p>
          </div>
          <div className="tool-card">
            <span className="tool-icon">🎨</span>
            <h4>Theme Editor</h4>
            <p>Customize appearance</p>
          </div>
          <div className="tool-card">
            <span className="tool-icon">⚙️</span>
            <h4>Settings</h4>
            <p>Configure ADE</p>
          </div>
        </div>
      </div>
    </div>
  );
};