import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AuthContextType, AuthUser, UserProfile } from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile and roles
  const fetchUserData = async (authUser: User): Promise<AuthUser> => {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', profileError)
      }

      // Fetch user roles using the database function
      const { data: rolesData, error: rolesError } = await supabase
        .rpc('get_user_roles', { user_uuid: authUser.id })

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError)
      }

      const roles = rolesData?.map(r => r.role_name) || []

      return {
        ...authUser,
        profile: profile as UserProfile,
        roles
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      return {
        ...authUser,
        profile: undefined,
        roles: []
      }
    }
  }

  // Refresh user data
  const refreshUserData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const userData = await fetchUserData(authUser)
      setUser(userData)
    }
  }

  // Sign in
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  // Sign up
  const signUp = async (
    email: string,
    password: string,
    userData?: { first_name?: string; last_name?: string }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })

    // If signup successful and user data provided, create profile
    if (!error && data.user && userData) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          first_name: userData.first_name,
          last_name: userData.last_name
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
      }

      // Assign default 'user' role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role_id: 6 // 'user' role ID from our database
        })

      if (roleError) {
        console.error('Error assigning default role:', roleError)
      }
    }

    return { error }
  }

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // Check if user has specific role
  const hasRole = (roleName: string): boolean => {
    return user?.roles?.includes(roleName) || false
  }

  // Check if user is admin
  const isAdmin = (): boolean => {
    return hasRole('admin')
  }

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userData = await fetchUserData(session.user)
          setUser(userData)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    isAdmin,
    refreshUserData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
