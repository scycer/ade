import React, { useState } from 'react';
import './ExecutionPage.css';

export const ExecutionPage: React.FC = () => {
  const [isExecuting, setIsExecuting] = useState(true);
  
  const executionSteps = [
    { id: 1, name: 'Analyzing theme implementation', status: 'completed', duration: '2.3s' },
    { id: 2, name: 'Creating dark color palette', status: 'completed', duration: '0.8s' },
    { id: 3, name: 'Adding theme context provider', status: 'running', duration: '5.2s', progress: 65 },
    { id: 4, name: 'Updating component styles', status: 'pending', duration: '-' },
    { id: 5, name: 'Adding theme toggle button', status: 'pending', duration: '-' },
  ];

  return (
    <div className="execution-page">
      <div className="page-header">
        <h2>Task Execution</h2>
        <p>Real-time execution and monitoring of development tasks</p>
      </div>

      <div className="execution-controls">
        <button className={`exec-btn ${isExecuting ? 'pause' : 'play'}`}>
          {isExecuting ? '⏸ Pause' : '▶ Resume'}
        </button>
        <button className="exec-btn stop">⏹ Stop</button>
        <button className="exec-btn">↺ Restart</button>
        <div className="execution-status">
          <span className="status-dot active"></span>
          <span>Executing: Step 3 of 5</span>
        </div>
      </div>

      <div className="execution-view">
        <div className="execution-timeline">
          <h3>Execution Timeline</h3>
          {executionSteps.map((step) => (
            <div key={step.id} className={`timeline-item ${step.status}`}>
              <div className="timeline-marker">
                {step.status === 'completed' && '✓'}
                {step.status === 'running' && '⚡'}
                {step.status === 'pending' && '○'}
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="step-name">{step.name}</span>
                  <span className="step-duration">{step.duration}</span>
                </div>
                {step.status === 'running' && (
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${step.progress}%` }}></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="execution-output">
          <h3>Live Output</h3>
          <div className="output-terminal">
            <div className="output-line success">✓ Theme configuration analyzed</div>
            <div className="output-line success">✓ Found 12 components to update</div>
            <div className="output-line success">✓ Dark palette generated: 16 colors</div>
            <div className="output-line">→ Creating ThemeContext.tsx...</div>
            <div className="output-line">→ Updating App.tsx with ThemeProvider...</div>
            <div className="output-line info">ℹ 65% complete (8 of 12 files processed)</div>
            <div className="cursor-blink">_</div>
          </div>
        </div>
      </div>

      <div className="file-changes">
        <h3>File Changes Preview</h3>
        <div className="changes-list">
          <div className="change-item modified">
            <span className="change-icon">M</span>
            <span className="change-path">src/App.tsx</span>
            <span className="change-stats">+12 -3</span>
          </div>
          <div className="change-item added">
            <span className="change-icon">A</span>
            <span className="change-path">src/contexts/ThemeContext.tsx</span>
            <span className="change-stats">+45 -0</span>
          </div>
          <div className="change-item modified">
            <span className="change-icon">M</span>
            <span className="change-path">src/styles/theme.css</span>
            <span className="change-stats">+78 -22</span>
          </div>
        </div>
      </div>

      <div className="execution-metrics">
        <div className="metric">
          <span className="metric-label">Files Changed</span>
          <span className="metric-value">8 / 12</span>
        </div>
        <div className="metric">
          <span className="metric-label">Lines Modified</span>
          <span className="metric-value">156</span>
        </div>
        <div className="metric">
          <span className="metric-label">Elapsed Time</span>
          <span className="metric-value">8.3s</span>
        </div>
        <div className="metric">
          <span className="metric-label">Est. Remaining</span>
          <span className="metric-value">4.5s</span>
        </div>
      </div>
    </div>
  );
};