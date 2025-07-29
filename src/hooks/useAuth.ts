import { useState, useEffect } from 'react'
import { userManagement, type User } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      setLoading(true)
      setError(null)
      const currentUser = await userManagement.getCurrentUser()
      setUser(currentUser)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = () => {
    return user?.roles.includes('admin') ?? false
  }

  const hasRole = (role: string) => {
    return user?.roles.includes(role as any) ?? false
  }

  const hasAnyRole = (roles: string[]) => {
    return roles.some(role => user?.roles.includes(role as any)) ?? false
  }

  return {
    user,
    loading,
    error,
    isAdmin,
    hasRole,
    hasAnyRole,
    refreshUser: loadUser
  }
}
