import React, { useState } from 'react';
import './ResearchPage.css';

export const ResearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="research-page">
      <div className="page-header">
        <h2>Research & Context</h2>
        <p>Explore codebase, documentation, and external resources</p>
      </div>

      <div className="research-controls">
        <input
          type="text"
          placeholder="Search across codebase, docs, and web..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="research-input"
        />
        <button className="search-btn">Search All</button>
      </div>

      <div className="research-sources">
        <div className="source-card">
          <h3>📁 Codebase</h3>
          <div className="source-stats">
            <div className="stat">
              <span className="stat-value">247</span>
              <span className="stat-label">Files</span>
            </div>
            <div className="stat">
              <span className="stat-value">12,458</span>
              <span className="stat-label">Lines of Code</span>
            </div>
          </div>
          <button className="source-action">Analyze Structure</button>
        </div>

        <div className="source-card">
          <h3>📚 Documentation</h3>
          <div className="source-stats">
            <div className="stat">
              <span className="stat-value">8</span>
              <span className="stat-label">README Files</span>
            </div>
            <div className="stat">
              <span className="stat-value">156</span>
              <span className="stat-label">Comments</span>
            </div>
          </div>
          <button className="source-action">Browse Docs</button>
        </div>

        <div className="source-card">
          <h3>🌐 Web Resources</h3>
          <div className="source-stats">
            <div className="stat">
              <span className="stat-value">Stack Overflow</span>
              <span className="stat-label">Primary Source</span>
            </div>
            <div className="stat">
              <span className="stat-value">Ready</span>
              <span className="stat-label">Status</span>
            </div>
          </div>
          <button className="source-action">Search Web</button>
        </div>

        <div className="source-card">
          <h3>🤖 AI Agents</h3>
          <div className="source-stats">
            <div className="stat">
              <span className="stat-value">3</span>
              <span className="stat-label">Available</span>
            </div>
            <div className="stat">
              <span className="stat-value">Claude</span>
              <span className="stat-label">Primary</span>
            </div>
          </div>
          <button className="source-action">Consult Agent</button>
        </div>
      </div>

      <div className="knowledge-graph">
        <h3>Knowledge Graph</h3>
        <div className="graph-placeholder">
          <p>Interactive knowledge graph visualization will appear here</p>
          <div className="mock-nodes">
            <div className="node">App.tsx</div>
            <div className="node">index.tsx</div>
            <div className="node">API Routes</div>
            <div className="node">Database</div>
          </div>
        </div>
      </div>
    </div>
  );
};