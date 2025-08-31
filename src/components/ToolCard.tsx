import { Link } from '@tanstack/react-router';
import type { Tool } from '../config/tools';

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      to={tool.route}
      className={`block p-6 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-all hover:shadow-lg ${
        !tool.enabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${tool.color} text-white mb-4`}>
        <span className="text-2xl">{tool.icon}</span>
      </div>
      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
        {tool.name}
        {!tool.enabled && (
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
        )}
      </h3>
      <p className="text-gray-600">{tool.description}</p>
    </Link>
  );
}