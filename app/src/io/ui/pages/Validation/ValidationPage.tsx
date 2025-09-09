import React from 'react';
import './ValidationPage.css';

export const ValidationPage: React.FC = () => {
  const validations = [
    { id: 1, type: 'Unit Tests', status: 'passed', passed: 42, failed: 0, time: '3.2s' },
    { id: 2, type: 'Linting', status: 'passed', passed: 18, failed: 0, warnings: 2, time: '1.1s' },
    { id: 3, type: 'Type Check', status: 'running', progress: 60, time: '2.5s' },
    { id: 4, type: 'Build', status: 'pending', time: '-' },
    { id: 5, type: 'E2E Tests', status: 'pending', time: '-' },
  ];

  return (
    <div className="validation-page">
      <div className="page-header">
        <h2>Validation & Testing</h2>
        <p>Automated validation gates ensure code quality and correctness</p>
      </div>

      <div className="validation-overview">
        <div className="overview-card passed">
          <h3>2</h3>
          <span>Passed</span>
        </div>
        <div className="overview-card running">
          <h3>1</h3>
          <span>Running</span>
        </div>
        <div className="overview-card pending">
          <h3>2</h3>
          <span>Pending</span>
        </div>
        <div className="overview-card failed">
          <h3>0</h3>
          <span>Failed</span>
        </div>
      </div>

      <div className="validation-list">
        <h3>Validation Gates</h3>
        {validations.map((validation) => (
          <div key={validation.id} className={`validation-item ${validation.status}`}>
            <div className="validation-header">
              <div className="validation-title">
                <span className={`validation-icon ${validation.status}`}>
                  {validation.status === 'passed' && '✓'}
                  {validation.status === 'running' && '⚡'}
                  {validation.status === 'pending' && '○'}
                  {validation.status === 'failed' && '✗'}
                </span>
                <span>{validation.type}</span>
              </div>
              <span className="validation-time">{validation.time}</span>
            </div>
            
            {validation.status === 'passed' && (
              <div className="validation-results">
                <span className="result-item success">✓ {validation.passed} passed</span>
                {validation.failed > 0 && <span className="result-item error">✗ {validation.failed} failed</span>}
                {validation.warnings && <span className="result-item warning">⚠ {validation.warnings} warnings</span>}
              </div>
            )}
            
            {validation.status === 'running' && (
              <div className="validation-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${validation.progress}%` }}></div>
                </div>
                <span className="progress-text">{validation.progress}% complete</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="validation-details">
        <div className="test-output">
          <h3>Test Output</h3>
          <div className="output-console">
            <div className="output-entry success">
              <strong>PASS</strong> src/components/Button.test.tsx
            </div>
            <div className="output-entry success">
              <strong>PASS</strong> src/components/Header.test.tsx
            </div>
            <div className="output-entry success">
              <strong>PASS</strong> src/utils/theme.test.ts
            </div>
            <div className="output-summary">
              Test Suites: 3 passed, 3 total<br/>
              Tests: 42 passed, 42 total<br/>
              Time: 3.245s
            </div>
          </div>
        </div>

        <div className="validation-config">
          <h3>Validation Configuration</h3>
          <div className="config-list">
            <div className="config-item">
              <span className="config-label">Auto-run on save</span>
              <span className="config-value">Enabled</span>
            </div>
            <div className="config-item">
              <span className="config-label">Block on failure</span>
              <span className="config-value">Tests only</span>
            </div>
            <div className="config-item">
              <span className="config-label">Parallel execution</span>
              <span className="config-value">Yes</span>
            </div>
            <div className="config-item">
              <span className="config-label">Coverage threshold</span>
              <span className="config-value">80%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="validation-actions">
        <button className="action-btn primary">Run All Validations</button>
        <button className="action-btn">Skip Current</button>
        <button className="action-btn">View Report</button>
      </div>
    </div>
  );
};