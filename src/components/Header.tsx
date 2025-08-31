import { Link } from '@tanstack/react-router'
import { tools } from '../config/tools'

export default function Header() {
  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Home */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🚀</span>
            <span className="font-bold text-xl">ADE</span>
          </Link>

          {/* Main Navigation */}
          <nav className="hidden md:flex space-x-4">
            {tools.filter(t => t.enabled).slice(0, 5).map(tool => (
              <Link
                key={tool.id}
                to={tool.route}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                activeProps={{ className: 'bg-gray-700' }}
              >
                <span className="mr-1">{tool.icon}</span>
                {tool.name}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              All Tools
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
