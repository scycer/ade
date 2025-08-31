import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { App } from './app';

const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
});

export default createStartHandler({
  router,
  component: App,
  streamHandler: defaultStreamHandler,
});