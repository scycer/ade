import React, { useState } from 'react';
import './KnowledgePage.css';

export const KnowledgePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const knowledgeItems = [
    { id: 1, type: 'pattern', title: 'React Hook Implementation', uses: 23, lastUsed: '2 days ago' },
    { id: 2, type: 'solution', title: 'OAuth2 Setup', uses: 5, lastUsed: '1 week ago' },
    { id: 3, type: 'docs', title: 'API Documentation Template', uses: 15, lastUsed: '3 days ago' },
    { id: 4, type: 'snippet', title: 'Error Boundary Component', uses: 8, lastUsed: '5 days ago' },
  ];

  return (
    <div className="knowledge-page">
      <div className="page-header">
        <h2>Knowledge Base</h2>
        <p>Learned patterns, solutions, and documentation from previous tasks</p>
      </div>

      <div className="knowledge-search">
        <input
          type="text"
          placeholder="Search knowledge base..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button className="filter-btn">Filters</button>
      </div>

      <div className="knowledge-stats">
        <div className="stat-box">
          <h3>156</h3>
          <span>Total Items</span>
        </div>
        <div className="stat-box">
          <h3>42</h3>
          <span>Patterns</span>
        </div>
        <div className="stat-box">
          <h3>89</h3>
          <span>Solutions</span>
        </div>
        <div className="stat-box">
          <h3>25</h3>
          <span>Documents</span>
        </div>
      </div>

      <div className="knowledge-grid">
        <div className="knowledge-categories">
          <h3>Categories</h3>
          <div className="category-list">
            <div className="category-item active">
              <span className="category-icon">🎨</span>
              <span className="category-name">UI Patterns</span>
              <span className="category-count">42</span>
            </div>
            <div className="category-item">
              <span className="category-icon">🔧</span>
              <span className="category-name">Backend Solutions</span>
              <span className="category-count">38</span>
            </div>
            <div className="category-item">
              <span className="category-icon">🔐</span>
              <span className="category-name">Authentication</span>
              <span className="category-count">12</span>
            </div>
            <div className="category-item">
              <span className="category-icon">📊</span>
              <span className="category-name">Data Processing</span>
              <span className="category-count">28</span>
            </div>
            <div className="category-item">
              <span className="category-icon">⚡</span>
              <span className="category-name">Performance</span>
              <span className="category-count">18</span>
            </div>
            <div className="category-item">
              <span className="category-icon">🧪</span>
              <span className="category-name">Testing</span>
              <span className="category-count">18</span>
            </div>
          </div>
        </div>

        <div className="knowledge-items">
          <h3>Recent Items</h3>
          {knowledgeItems.map((item) => (
            <div key={item.id} className="knowledge-card">
              <div className="card-header">
                <span className={`item-type ${item.type}`}>
                  {item.type === 'pattern' && '🎯'}
                  {item.type === 'solution' && '💡'}
                  {item.type === 'docs' && '📄'}
                  {item.type === 'snippet' && '✂️'}
                  {item.type}
                </span>
                <button className="card-action">View</button>
              </div>
              <h4>{item.title}</h4>
              <div className="card-meta">
                <span>Used {item.uses} times</span>
                <span>•</span>
                <span>{item.lastUsed}</span>
              </div>
              <div className="card-tags">
                <span className="tag">React</span>
                <span className="tag">TypeScript</span>
                <span className="tag">Hooks</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="knowledge-insights">
        <h3>Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Most Used Pattern</h4>
            <p>Custom React Hooks</p>
            <span className="insight-value">67 uses this month</span>
          </div>
          <div className="insight-card">
            <h4>Common Issues</h4>
            <p>State Management</p>
            <span className="insight-value">12 solutions saved</span>
          </div>
          <div className="insight-card">
            <h4>Learning Velocity</h4>
            <p>+23% this week</p>
            <span className="insight-value">32 new items</span>
          </div>
        </div>
      </div>
    </div>
  );
};