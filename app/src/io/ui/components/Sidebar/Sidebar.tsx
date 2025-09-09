import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const sections = [
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'research', label: 'Research', icon: '🔍' },
    { id: 'planning', label: 'Planning', icon: '📊' },
    { id: 'execution', label: 'Execution', icon: '⚡' },
    { id: 'validation', label: 'Validation', icon: '✅' },
    { id: 'knowledge', label: 'Knowledge Base', icon: '🧠' },
    { id: 'tools', label: 'Tools', icon: '🔧' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>ADE</h2>
      </div>
      <nav className="sidebar-nav">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => onSectionChange(section.id)}
          >
            <span className="sidebar-icon">{section.icon}</span>
            <span className="sidebar-label">{section.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};