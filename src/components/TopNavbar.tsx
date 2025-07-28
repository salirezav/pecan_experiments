import { useState } from 'react'
import type { User } from '../lib/supabase'

interface TopNavbarProps {
  user: User
  onLogout: () => void
  currentView?: string
}

export function TopNavbar({ user, onLogout, currentView = 'dashboard' }: TopNavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const getPageTitle = (view: string) => {
    switch (view) {
      case 'dashboard':
        return 'Dashboard'
      case 'user-management':
        return 'User Management'
      case 'experiments':
        return 'Experiments'
      case 'analytics':
        return 'Analytics'
      case 'data-entry':
        return 'Data Entry'
      case 'vision-system':
        return 'Vision System'
      default:
        return 'Dashboard'
    }
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
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side - could add breadcrumbs or page title here */}
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-gray-900">{getPageTitle(currentView)}</h1>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center space-x-4">
          {/* User info and avatar */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* User avatar */}
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.email.charAt(0).toUpperCase()}
              </div>

              {/* User info */}
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                  {user.email}
                </div>
                <div className="text-xs text-gray-500">
                  {user.roles.length > 0 ? user.roles[0].charAt(0).toUpperCase() + user.roles[0].slice(1) : 'User'}
                </div>
              </div>

              {/* Dropdown arrow */}
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {user.email}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Status: <span className={user.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                          {user.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* User roles */}
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-2">Roles:</div>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}
                        >
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      onLogout()
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  )
}
