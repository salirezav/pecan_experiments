import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Login } from './components/Login'
import { Dashboard } from './components/Dashboard'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname)

  useEffect(() => {
    // Check initial auth state
    checkAuthState()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session)
      setIsAuthenticated(!!session)
      setLoading(false)

      // Handle signout route
      if (event === 'SIGNED_OUT') {
        setCurrentRoute('/')
        window.history.pushState({}, '', '/')
      }
    })

    // Handle browser navigation
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    // Handle signout route
    if (currentRoute === '/signout') {
      handleLogout()
    }
  }, [currentRoute])

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    } catch (error) {
      console.error('Error checking auth state:', error)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setCurrentRoute('/')
    window.history.pushState({}, '', '/')
  }

  const handleLogout = async () => {
    try {
      // Clear Supabase session
      await supabase.auth.signOut()

      // Clear any local storage items
      localStorage.removeItem('supabase.auth.token')

      // Reset state
      setIsAuthenticated(false)
      setCurrentRoute('/')
      window.history.pushState({}, '', '/')
    } catch (error) {
      console.error('Logout error:', error)
      // Still reset state even if there's an error
      setIsAuthenticated(false)
      setCurrentRoute('/')
      window.history.pushState({}, '', '/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Handle signout route
  if (currentRoute === '/signout') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Signing out...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  )
}

export default App
