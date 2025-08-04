import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { TopNavbar } from './TopNavbar'
import { DashboardHome } from './DashboardHome'
import { UserManagement } from './UserManagement'
import { Experiments } from './Experiments'
import { DataEntry } from './DataEntry'
import { VisionSystem } from './VisionSystem'
import { VideoStreamingPage } from '../features/video-streaming'
import { userManagement, type User } from '../lib/supabase'

interface DashboardLayoutProps {
  onLogout: () => void
}

export function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState('dashboard')

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const currentUser = await userManagement.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      } else {
        setError('No authenticated user found')
      }
    } catch (err) {
      setError('Failed to fetch user profile')
      console.error('Profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    // Navigate to signout route which will handle the actual logout
    window.history.pushState({}, '', '/signout')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const renderCurrentView = () => {
    if (!user) return null

    switch (currentView) {
      case 'dashboard':
        return <DashboardHome user={user} />
      case 'user-management':
        if (user.roles.includes('admin')) {
          return <UserManagement />
        } else {
          return (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-700">
                  Access denied. You need admin privileges to access user management.
                </div>
              </div>
            </div>
          )
        }
      case 'experiments':
        return <Experiments />
      case 'analytics':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-sm text-green-700">
                Analytics module coming soon...
              </div>
            </div>
          </div>
        )
      case 'data-entry':
        return <DataEntry />
      case 'vision-system':
        return <VisionSystem />
      case 'video-library':
        return <VideoStreamingPage />
      default:
        return <DashboardHome user={user} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-600">No user data available</div>
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      <div className="flex-1 flex flex-col">
        <TopNavbar user={user} onLogout={handleLogout} currentView={currentView} />
        <main className="flex-1 overflow-auto">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  )
}
