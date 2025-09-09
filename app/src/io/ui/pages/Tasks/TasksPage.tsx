import React, { useState } from 'react';
import './TasksPage.css';

export const TasksPage: React.FC = () => {
  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Add dark mode to application', status: 'in-progress', created: '2024-01-15' },
    { id: 2, title: 'Fix login authentication bug', status: 'completed', created: '2024-01-14' },
    { id: 3, title: 'Optimize database queries', status: 'pending', created: '2024-01-13' },
  ]);

  return (
    <div className="tasks-page">
      <div className="page-header">
        <h2>Task Management</h2>
        <p>Create and manage development tasks with AI assistance</p>
      </div>

      <div className="task-input-section">
        <input
          type="text"
          placeholder="Describe your task... e.g., 'Add user authentication with OAuth'"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          className="task-input"
        />
        <button className="create-task-btn">Create Task</button>
      </div>

      <div className="tasks-list">
        <h3>Recent Tasks</h3>
        {tasks.map((task) => (
          <div key={task.id} className={`task-card ${task.status}`}>
            <div className="task-header">
              <h4>{task.title}</h4>
              <span className={`status-badge ${task.status}`}>{task.status}</span>
            </div>
            <div className="task-meta">
              <span>Created: {task.created}</span>
              <button className="task-action">View Details</button>
            </div>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn">Import from GitHub</button>
          <button className="action-btn">Load Template</button>
          <button className="action-btn">Voice Input</button>
        </div>
      </div>
    </div>
  );
};