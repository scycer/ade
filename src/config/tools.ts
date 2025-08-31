export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  enabled: boolean;
}

export const tools: Tool[] = [
  {
    id: 'file-agent',
    name: 'AI File Agent',
    description: 'Search and analyze files with AI-powered semantic search',
    icon: '🤖',
    route: '/tools/file-agent',
    color: 'bg-blue-500',
    enabled: true,
  },
  {
    id: 'file-browser',
    name: 'File Browser',
    description: 'Browse, upload, and manage files in your project',
    icon: '📁',
    route: '/tools/file-browser',
    color: 'bg-green-500',
    enabled: true,
  },
  {
    id: 'todo-manager',
    name: 'Todo Manager',
    description: 'Manage tasks and track your development progress',
    icon: '✅',
    route: '/tools/todo-manager',
    color: 'bg-purple-500',
    enabled: true,
  },
  {
    id: 'api-tester',
    name: 'API Tester',
    description: 'Test and debug API endpoints with a powerful interface',
    icon: '🔌',
    route: '/tools/api-tester',
    color: 'bg-orange-500',
    enabled: true,
  },
  {
    id: 'code-snippets',
    name: 'Code Snippets',
    description: 'Store and organize reusable code snippets',
    icon: '📝',
    route: '/tools/code-snippets',
    color: 'bg-indigo-500',
    enabled: true,
  },
  {
    id: 'git-helper',
    name: 'Git Helper',
    description: 'Visual git operations and repository management',
    icon: '🌿',
    route: '/tools/git-helper',
    color: 'bg-teal-500',
    enabled: true,
  },
  {
    id: 'terminal',
    name: 'Web Terminal',
    description: 'Execute commands directly from your browser',
    icon: '💻',
    route: '/tools/terminal',
    color: 'bg-gray-700',
    enabled: false, // Coming soon
  },
  {
    id: 'db-explorer',
    name: 'Database Explorer',
    description: 'Browse and query your SQLite databases',
    icon: '🗄️',
    route: '/tools/db-explorer',
    color: 'bg-pink-500',
    enabled: false, // Coming soon
  },
];