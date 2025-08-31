import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Home */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🌐</span>
            <span className="font-bold text-xl">Node Graph</span>
          </Link>

          {/* Right Section */}
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-400">CRUD Node Graph with AI</span>
          </div>
        </div>
      </div>
    </header>
  )
}