import React, { useState } from 'react';
import "./index.css";
import { Sidebar } from './components/Sidebar/Sidebar';
import { TasksPage } from './pages/Tasks/TasksPage';
import { ResearchPage } from './pages/Research/ResearchPage';
import { PlanningPage } from './pages/Planning/PlanningPage';
import { ExecutionPage } from './pages/Execution/ExecutionPage';
import { ValidationPage } from './pages/Validation/ValidationPage';
import { KnowledgePage } from './pages/Knowledge/KnowledgePage';
import { ToolsPage } from './pages/Tools/ToolsPage';
import { KeyboardApp } from './KeyboardApp';

export function App() {
  const [activeSection, setActiveSection] = useState('tasks');
  const [uiMode, setUiMode] = useState<'keyboard' | 'mouse'>('keyboard');

  // Toggle between keyboard and mouse UI with Alt+M
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        setUiMode(prev => prev === 'keyboard' ? 'mouse' : 'keyboard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (uiMode === 'keyboard') {
    return <KeyboardApp />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'tasks':
        return <TasksPage />;
      case 'research':
        return <ResearchPage />;
      case 'planning':
        return <PlanningPage />;
      case 'execution':
        return <ExecutionPage />;
      case 'validation':
        return <ValidationPage />;
      case 'knowledge':
        return <KnowledgePage />;
      case 'tools':
        return <ToolsPage />;
      default:
        return <TasksPage />;
    }
  };

  return (
    <div className="app">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      <main className="app-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
