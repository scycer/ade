import { describe, test, expect } from 'bun:test';
import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../../src/App';

describe('App Integration', () => {
  test('should render menu on startup', () => {
    const { lastFrame } = render(<App />);
    
    expect(lastFrame()).toContain('ADE CLI');
    expect(lastFrame()).toContain('Message Claude Code');
  });

  test('should display correct initial state', () => {
    const { lastFrame } = render(<App />);
    
    // Check for menu elements
    expect(lastFrame()).toContain('Available Actions');
    expect(lastFrame()).toContain('Send requests to Claude');
  });
});