import { useEffect, useCallback } from 'react';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: () => void;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutHandler[]) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    shortcuts.forEach(shortcut => {
      const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const matchesCtrl = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const matchesAlt = shortcut.alt ? e.altKey : !e.altKey;
      const matchesShift = shortcut.shift ? e.shiftKey : !e.shiftKey;

      if (matchesKey && matchesCtrl && matchesAlt && matchesShift) {
        e.preventDefault();
        shortcut.handler();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export const useVimMode = () => {
  const handleVimKeys = useCallback((e: KeyboardEvent, mode: 'normal' | 'insert' | 'visual') => {
    if (mode === 'normal') {
      switch (e.key) {
        case 'h':
          // Move left
          break;
        case 'j':
          // Move down
          break;
        case 'k':
          // Move up
          break;
        case 'l':
          // Move right
          break;
        case 'g':
          if (e.shiftKey) {
            // Go to end
          } else {
            // Go to start
          }
          break;
        case 'i':
          // Enter insert mode
          return 'insert';
        case 'v':
          // Enter visual mode
          return 'visual';
        case '/':
          // Search
          break;
        case ':':
          // Command mode
          break;
      }
    } else if (mode === 'insert') {
      if (e.key === 'Escape') {
        return 'normal';
      }
    } else if (mode === 'visual') {
      if (e.key === 'Escape') {
        return 'normal';
      }
    }
    return mode;
  }, []);

  return { handleVimKeys };
};