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

export function App() {
  const [activeSection, setActiveSection] = useState('tasks');

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
