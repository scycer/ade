import React from 'react';
import './PlanningPage.css';

export const PlanningPage: React.FC = () => {
  const subtasks = [
    { id: 1, title: 'Analyze current theme implementation', type: 'sequential', status: 'completed' },
    { id: 2, title: 'Create dark color palette', type: 'sequential', status: 'completed' },
    { id: 3, title: 'Add theme context provider', type: 'sequential', status: 'in-progress' },
    { id: 4, title: 'Update component styles', type: 'concurrent', status: 'pending' },
    { id: 5, title: 'Add theme toggle button', type: 'concurrent', status: 'pending' },
    { id: 6, title: 'Test across browsers', type: 'sequential', status: 'pending' },
  ];

  return (
    <div className="planning-page">
      <div className="page-header">
        <h2>Task Planning</h2>
        <p>Break down tasks into manageable subtasks with dependencies</p>
      </div>

      <div className="current-task">
        <h3>Current Task: Add Dark Mode to Application</h3>
        <div className="task-controls">
          <button className="control-btn">Auto-Generate Plan</button>
          <button className="control-btn">Add Subtask</button>
          <button className="control-btn">Reorder</button>
        </div>
      </div>

      <div className="subtasks-container">
        <div className="subtasks-list">
          <h4>Subtasks</h4>
          {subtasks.map((task, index) => (
            <div key={task.id} className={`subtask-item ${task.status}`}>
              <div className="subtask-number">{index + 1}</div>
              <div className="subtask-content">
                <div className="subtask-title">{task.title}</div>
                <div className="subtask-meta">
                  <span className={`type-badge ${task.type}`}>{task.type}</span>
                  <span className={`status-indicator ${task.status}`}>{task.status}</span>
                </div>
              </div>
              <div className="subtask-links">
                <span className="link-count">3 files</span>
                <span className="link-count">2 docs</span>
              </div>
            </div>
          ))}
        </div>

        <div className="dependency-graph">
          <h4>Dependency Flow</h4>
          <div className="graph-viz">
            <div className="flow-diagram">
              <div className="flow-node completed">1. Analyze</div>
              <div className="flow-arrow">→</div>
              <div className="flow-node completed">2. Palette</div>
              <div className="flow-arrow">→</div>
              <div className="flow-node active">3. Context</div>
              <div className="flow-arrow">→</div>
              <div className="flow-parallel">
                <div className="flow-node pending">4. Styles</div>
                <div className="flow-node pending">5. Toggle</div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-node pending">6. Test</div>
            </div>
          </div>
        </div>
      </div>

      <div className="planning-stats">
        <div className="stat-card">
          <h4>Estimated Time</h4>
          <p className="stat-value">2.5 hours</p>
        </div>
        <div className="stat-card">
          <h4>Files Affected</h4>
          <p className="stat-value">18 files</p>
        </div>
        <div className="stat-card">
          <h4>Complexity</h4>
          <p className="stat-value">Medium</p>
        </div>
      </div>
    </div>
  );
};