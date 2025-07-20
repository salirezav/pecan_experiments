import { useState } from 'react'
import type { User } from '../lib/supabase'

interface SidebarProps {
  user: User
  currentView: string
  onViewChange: (view: string) => void
  onLogout: () => void
}

interface MenuItem {
  id: string
  name: string
  icon: string
  requiredRoles?: string[]
}

export function Sidebar({ user, currentView, onViewChange, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: '🏠',
    },
    {
      id: 'user-management',
      name: 'User Management',
      icon: '👥',
      requiredRoles: ['admin']
    },
    {
      id: 'experiments',
      name: 'Experiments',
      icon: '🧪',
      requiredRoles: ['admin', 'conductor']
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: '📊',
      requiredRoles: ['admin', 'conductor', 'analyst']
    },
    {
      id: 'data-entry',
      name: 'Data Entry',
      icon: '📝',
      requiredRoles: ['admin', 'conductor', 'data recorder']
    }
  ]

  const hasAccess = (item: MenuItem): boolean => {
    if (!item.requiredRoles) return true
    return item.requiredRoles.some(role => user.roles.includes(role as any))
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'conductor':
        return 'bg-blue-100 text-blue-800'
      case 'analyst':
        return 'bg-green-100 text-green-800'
      case 'data recorder':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} min-h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold">RBAC System</h1>
              <p className="text-sm text-gray-400">Admin Dashboard</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-700">
        {!isCollapsed ? (
          <div>
            <div className="text-sm font-medium truncate">{user.email}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Status: <span className={user.status === 'active' ? 'text-green-400' : 'text-red-400'}>
                {user.status}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
              {user.email.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            if (!hasAccess(item)) return null

            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <span className="text-lg">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="ml-3 text-sm font-medium">{item.name}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <span className="text-lg">🚪</span>
          {!isCollapsed && (
            <span className="ml-3 text-sm font-medium">Sign Out</span>
          )}
        </button>
      </div>
    </div>
  )
}
