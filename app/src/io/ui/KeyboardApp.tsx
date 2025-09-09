import React, { useState, useEffect } from 'react';
import './index.css';
import { Terminal } from './components/Terminal/Terminal';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export function KeyboardApp() {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [currentView, setCurrentView] = useState('terminal');

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'p', ctrl: true, handler: () => setIsPaletteOpen(true) },
    { key: 'k', ctrl: true, handler: () => setIsPaletteOpen(true) },
    { key: '/', ctrl: true, handler: () => setIsPaletteOpen(true) },
  ]);

  const handleCommand = (command: string) => {
    console.log('Command received:', command);
    
    // Route commands to different views/actions
    switch (command) {
      case 'task:new':
        console.log('Creating new task...');
        break;
      case 'task:list':
        console.log('Listing tasks...');
        break;
      case 'research':
        console.log('Opening research...');
        break;
      case 'files':
        console.log('Opening file browser...');
        break;
      case 'help':
        console.log('Showing help...');
        break;
      default:
        // Handle raw commands
        if (command.startsWith('task new ')) {
          console.log('New task:', command.substring(9));
        }
    }
  };

  return (
    <div className="keyboard-app">
      <Terminal onCommand={handleCommand} />
      
      <CommandPalette 
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onCommand={handleCommand}
      />
      
      <div className="keyboard-help-bar">
        <span>Ctrl+P: Command Palette</span>
        <span>i: Insert Mode</span>
        <span>Esc: Normal Mode</span>
        <span>:help: Show Commands</span>
      </div>
    </div>
  );
}

export default KeyboardApp;