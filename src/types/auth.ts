import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  first_name: string | null
  last_name: string | null
  created_at: string
  updated_at: string
}

export interface Role {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: number
  user_id: string | null
  role_id: number | null
  created_at: string
  updated_at: string
}

export interface AuthUser extends User {
  profile?: UserProfile
  roles?: string[]
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, userData?: { first_name?: string; last_name?: string }) => Promise<{ error: any }>
  signOut: () => Promise<void>
  hasRole: (roleName: string) => boolean
  isAdmin: () => boolean
  refreshUserData: () => Promise<void>
}

export type RoleName = 'admin' | 'user' | 'moderator' | 'coordinator' | 'conductor' | 'analyst'
