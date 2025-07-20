import { createClient } from '@supabase/supabase-js'

// Local development configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface User {
  id: string
  email: string
  role: 'admin' | 'conductor' | 'analyst'
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: 'admin' | 'conductor' | 'analyst'
  description: string
  created_at: string
}
