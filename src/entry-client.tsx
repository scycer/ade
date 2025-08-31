import React from 'react';
import ReactDOM from 'react-dom/client';
import { hydrateRoot } from 'react-dom/client';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { App } from './app';

const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;

if (rootElement.innerHTML) {
  hydrateRoot(rootElement, <App router={router} />);
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App router={router} />);
}