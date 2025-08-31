import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/tools/todo-manager')({
  component: TodoManager,
})

interface Todo {
  id: number
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
}

function TodoManager() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: 'Implement file upload with drag & drop', completed: false, priority: 'high', createdAt: new Date() },
    { id: 2, text: 'Add syntax highlighting to file preview', completed: false, priority: 'medium', createdAt: new Date() },
    { id: 3, text: 'Create API testing interface', completed: false, priority: 'low', createdAt: new Date() },
  ])
  const [newTodo, setNewTodo] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')

  const addTodo = () => {
    if (!newTodo.trim()) return
    
    const todo: Todo = {
      id: Date.now(),
      text: newTodo,
      completed: false,
      priority,
      createdAt: new Date(),
    }
    
    setTodos([todo, ...todos])
    setNewTodo('')
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Todo Manager</h1>
        <p className="text-gray-600">Manage tasks and track your development progress</p>
      </div>

      {/* Add Todo Form */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button
            onClick={addTodo}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg shadow text-center">
          <div className="text-2xl font-bold">{todos.length}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">
            {todos.filter(t => t.completed).length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">
            {todos.filter(t => !t.completed).length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-red-600">
            {todos.filter(t => t.priority === 'high' && !t.completed).length}
          </div>
          <div className="text-sm text-gray-600">High Priority</div>
        </div>
      </div>

      {/* Todo List */}
      <div className="space-y-2">
        {todos.map(todo => (
          <div
            key={todo.id}
            className={`p-4 bg-white rounded-lg shadow flex items-center justify-between ${
              todo.completed ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="w-5 h-5 text-purple-600"
              />
              <div>
                <div className={`font-medium ${todo.completed ? 'line-through' : ''}`}>
                  {todo.text}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(todo.priority)}`}>
                    {todo.priority}
                  </span>
                  <span className="text-xs text-gray-500">
                    {todo.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}