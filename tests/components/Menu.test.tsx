import { describe, test, expect } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { Menu } from '../../src/components/Menu';

describe('Menu Component', () => {
  test('should render menu with actions', () => {
    const actions = [
      { id: 'test', label: 'Test Action', description: 'Test description' }
    ];
    
    const { lastFrame } = render(
      <Menu actions={actions} selectedIndex={0} />
    );
    
    expect(lastFrame()).toContain('ADE CLI');
    expect(lastFrame()).toContain('Test Action');
    expect(lastFrame()).toContain('Test description');
  });

  test('should highlight selected action', () => {
    const actions = [
      { id: 'test1', label: 'Action 1', description: 'Description 1' },
      { id: 'test2', label: 'Action 2', description: 'Description 2' }
    ];
    
    const { lastFrame } = render(
      <Menu actions={actions} selectedIndex={1} />
    );
    
    // The second action should be selected (with ▶ indicator)
    expect(lastFrame()).toContain('▶');
    expect(lastFrame()).toContain('Action 2');
  });

  test('should display navigation instructions', () => {
    const actions = [
      { id: 'test', label: 'Test', description: 'Test' }
    ];
    
    const { lastFrame } = render(
      <Menu actions={actions} selectedIndex={0} />
    );
    
    expect(lastFrame()).toContain('Use arrow keys to navigate');
    expect(lastFrame()).toContain('Enter to select');
    expect(lastFrame()).toContain('ESC to exit');
  });
});