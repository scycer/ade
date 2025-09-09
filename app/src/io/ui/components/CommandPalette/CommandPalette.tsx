import React, { useState, useEffect, useRef } from 'react';
import './CommandPalette.css';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onCommand }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Command[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { id: 'task-new', label: 'New Task', shortcut: ':task new', action: () => onCommand('task:new') },
    { id: 'task-list', label: 'List Tasks', shortcut: ':task list', action: () => onCommand('task:list') },
    { id: 'research', label: 'Research', shortcut: ':research', action: () => onCommand('research') },
    { id: 'plan', label: 'Show Plan', shortcut: ':plan', action: () => onCommand('plan') },
    { id: 'exec', label: 'Execute', shortcut: ':exec', action: () => onCommand('exec') },
    { id: 'validate', label: 'Run Validation', shortcut: ':val', action: () => onCommand('validate') },
    { id: 'knowledge', label: 'Search Knowledge', shortcut: ':kb', action: () => onCommand('knowledge') },
    { id: 'files', label: 'Browse Files', shortcut: ':files', action: () => onCommand('files') },
    { id: 'git-status', label: 'Git Status', shortcut: ':git status', action: () => onCommand('git:status') },
    { id: 'git-diff', label: 'Git Diff', shortcut: ':git diff', action: () => onCommand('git:diff') },
    { id: 'help', label: 'Show Help', shortcut: ':help', action: () => onCommand('help') },
  ];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (input.length > 0) {
      const filtered = commands.filter(cmd => 
        cmd.label.toLowerCase().includes(input.toLowerCase()) ||
        cmd.shortcut?.toLowerCase().includes(input.toLowerCase())
      );
      setSuggestions(filtered);
      setSelectedIndex(0);
    } else {
      setSuggestions(commands.slice(0, 5));
      setSelectedIndex(0);
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (input.startsWith(':')) {
          // Direct command execution
          onCommand(input.slice(1));
          setInput('');
          onClose();
        } else if (suggestions[selectedIndex]) {
          suggestions[selectedIndex].action();
          setInput('');
          onClose();
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          setInput(suggestions[selectedIndex].shortcut || suggestions[selectedIndex].label);
        }
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          className="command-input"
          placeholder="Type a command or search..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="command-suggestions">
          {suggestions.map((cmd, index) => (
            <div
              key={cmd.id}
              className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => {
                cmd.action();
                setInput('');
                onClose();
              }}
            >
              <span className="command-label">{cmd.label}</span>
              {cmd.shortcut && <span className="command-shortcut">{cmd.shortcut}</span>}
            </div>
          ))}
        </div>
        <div className="command-help">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Tab Complete</span>
          <span>Esc Cancel</span>
        </div>
      </div>
    </div>
  );
};