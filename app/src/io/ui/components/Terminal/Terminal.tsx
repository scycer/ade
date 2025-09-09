import React, { useState, useEffect, useRef } from 'react';
import './Terminal.css';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success' | 'info';
  content: string;
  timestamp?: Date;
}

interface Task {
  id: number;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  duration?: string;
}

interface TerminalProps {
  onCommand: (command: string) => void;
}

export const Terminal: React.FC<TerminalProps> = ({ onCommand }) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'info', content: 'ADE Terminal v1.0.0 - Type :help for commands' },
    { type: 'info', content: '────────────────────────────────────────────────' },
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'normal' | 'insert'>('normal');
  const [selectedLine, setSelectedLine] = useState(0);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock task data
  const [currentTask, setCurrentTask] = useState<Task[]>([
    { id: 1, title: 'Analyze theme implementation', status: 'completed', duration: '2.3s' },
    { id: 2, title: 'Create dark color palette', status: 'completed', duration: '0.8s' },
    { id: 3, title: 'Add theme context provider', status: 'running', progress: 65 },
    { id: 4, title: 'Update component styles', status: 'pending' },
    { id: 5, title: 'Add theme toggle button', status: 'pending' },
  ]);

  useEffect(() => {
    // Scroll to bottom when new lines are added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    // Focus input when mode changes to insert
    if (mode === 'insert' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const addLine = (type: TerminalLine['type'], content: string) => {
    setLines(prev => [...prev, { type, content, timestamp: new Date() }]);
  };

  const processCommand = (cmd: string) => {
    addLine('input', `> ${cmd}`);
    
    // Add to history
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    // Parse command
    const parts = cmd.trim().split(' ');
    const command = parts[0];
    const args = parts.slice(1).join(' ');

    switch (command) {
      case ':help':
      case ':h':
        addLine('info', 'Available Commands:');
        addLine('output', '  :task new <description>  - Create new task');
        addLine('output', '  :task list              - List all tasks');
        addLine('output', '  :research <query>       - Search codebase and docs');
        addLine('output', '  :plan                   - Show task breakdown');
        addLine('output', '  :exec [step]            - Execute task or step');
        addLine('output', '  :val                    - Run validations');
        addLine('output', '  :kb <query>             - Search knowledge base');
        addLine('output', '  :files                  - Browse files');
        addLine('output', '  :git status             - Show git status');
        addLine('output', '  :clear                  - Clear terminal');
        addLine('output', '');
        addLine('info', 'Keyboard Shortcuts:');
        addLine('output', '  i        - Enter insert mode');
        addLine('output', '  Esc      - Return to normal mode');
        addLine('output', '  j/k      - Navigate up/down (normal mode)');
        addLine('output', '  /        - Search');
        addLine('output', '  Ctrl+P   - Command palette');
        break;

      case ':task':
        if (args.startsWith('new ')) {
          const taskName = args.substring(4);
          addLine('success', `✓ Created task: "${taskName}"`);
          addLine('output', 'Breaking down task into subtasks...');
          setTimeout(() => {
            addLine('output', '  1. Analyze current implementation');
            addLine('output', '  2. Design solution architecture');
            addLine('output', '  3. Implement core functionality');
            addLine('output', '  4. Add tests');
            addLine('output', '  5. Update documentation');
          }, 500);
        } else if (args === 'list') {
          addLine('info', 'Current Tasks:');
          currentTask.forEach(task => {
            const status = task.status === 'completed' ? '✓' : 
                          task.status === 'running' ? '⚡' : 
                          task.status === 'failed' ? '✗' : '○';
            const progress = task.progress ? ` (${task.progress}%)` : '';
            const duration = task.duration ? ` - ${task.duration}` : '';
            addLine('output', `  [${task.id}] ${status} ${task.title}${progress}${duration}`);
          });
        }
        break;

      case ':exec':
        const stepNum = args ? parseInt(args) : 3;
        addLine('info', `Executing step ${stepNum}...`);
        addLine('output', '├─ Creating ThemeContext.tsx...');
        addLine('output', '├─ Updating App.tsx with ThemeProvider...');
        addLine('success', '└─ 8 of 12 files processed');
        break;

      case ':val':
        addLine('info', 'Running validations...');
        setTimeout(() => {
          addLine('success', '✓ Unit Tests: 42 passed, 0 failed (3.2s)');
          addLine('success', '✓ Linting: 18 files, 0 errors, 2 warnings (1.1s)');
          addLine('output', '⚡ Type Check: Running... 60% complete');
        }, 300);
        break;

      case ':research':
        addLine('info', `Researching: ${args}`);
        addLine('output', 'Searching codebase...');
        setTimeout(() => {
          addLine('output', '  Found 12 relevant files');
          addLine('output', '  Found 3 documentation pages');
          addLine('output', '  Found 5 Stack Overflow answers');
        }, 400);
        break;

      case ':clear':
        setLines([
          { type: 'info', content: 'ADE Terminal v1.0.0 - Type :help for commands' },
          { type: 'info', content: '────────────────────────────────────────────────' },
        ]);
        break;

      case ':git':
        if (args === 'status') {
          addLine('output', 'On branch main');
          addLine('output', 'Changes to be committed:');
          addLine('success', '  modified:   src/App.tsx');
          addLine('success', '  new file:   src/contexts/ThemeContext.tsx');
        } else if (args === 'diff') {
          addLine('output', 'diff --git a/src/App.tsx b/src/App.tsx');
          addLine('success', '+import { ThemeProvider } from "./contexts/ThemeContext";');
          addLine('error', '-function App() {');
          addLine('success', '+function App() {');
        }
        break;

      default:
        if (cmd.trim()) {
          addLine('error', `Unknown command: ${command}. Type :help for available commands.`);
        }
    }

    onCommand(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mode === 'normal') {
      switch (e.key) {
        case 'i':
          e.preventDefault();
          setMode('insert');
          break;
        case 'j':
          e.preventDefault();
          setSelectedLine(prev => Math.min(prev + 1, lines.length - 1));
          break;
        case 'k':
          e.preventDefault();
          setSelectedLine(prev => Math.max(prev - 1, 0));
          break;
        case '/':
          e.preventDefault();
          setMode('insert');
          setInput('/');
          break;
        case ':':
          e.preventDefault();
          setMode('insert');
          setInput(':');
          break;
      }
    } else if (mode === 'insert') {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setMode('normal');
          setInput('');
          break;
        case 'Enter':
          e.preventDefault();
          if (input.trim()) {
            processCommand(input);
            setInput('');
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (historyIndex < commandHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setInput(commandHistory[commandHistory.length - 1 - newIndex]);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setInput(commandHistory[commandHistory.length - 1 - newIndex]);
          } else if (historyIndex === 0) {
            setHistoryIndex(-1);
            setInput('');
          }
          break;
      }
    }
  };

  const renderTaskProgress = () => {
    const runningTask = currentTask.find(t => t.status === 'running');
    if (!runningTask || !runningTask.progress) return null;

    const progressBar = '█'.repeat(Math.floor(runningTask.progress / 5)) + 
                       '░'.repeat(20 - Math.floor(runningTask.progress / 5));
    
    return (
      <div className="task-progress">
        <span>Current: {runningTask.title}</span>
        <span>[{progressBar}] {runningTask.progress}%</span>
      </div>
    );
  };

  return (
    <div className="terminal-container" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="terminal-header">
        <span className="terminal-title">ADE Terminal</span>
        <span className="terminal-mode">{mode.toUpperCase()}</span>
      </div>
      
      {renderTaskProgress()}
      
      <div className="terminal-content" ref={terminalRef}>
        {lines.map((line, index) => (
          <div 
            key={index} 
            className={`terminal-line ${line.type} ${index === selectedLine && mode === 'normal' ? 'selected' : ''}`}
          >
            {line.content}
          </div>
        ))}
        
        {mode === 'insert' && (
          <div className="terminal-input-line">
            <span className="prompt">{'>'}</span>
            <input
              ref={inputRef}
              type="text"
              className="terminal-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
        )}
      </div>
      
      <div className="terminal-status">
        <span>{mode === 'normal' ? 'Press i to insert, : for command' : 'Press Esc to exit insert mode'}</span>
        <span className="terminal-stats">
          {currentTask.filter(t => t.status === 'completed').length}/{currentTask.length} tasks complete
        </span>
      </div>
    </div>
  );
};