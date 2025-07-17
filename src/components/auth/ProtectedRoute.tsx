import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { RoleName } from '../../types/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: RoleName
  requiredRoles?: RoleName[]
  fallback?: React.ReactNode
  requireAuth?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredRoles,
  fallback = <div className="text-red-500">Access denied. You don't have permission to view this content.</div>,
  requireAuth = true
}) => {
  const { user, loading } = useAuth()

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Check if authentication is required
  if (requireAuth && !user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Please sign in to access this content.</div>
      </div>
    )
  }

  // Check single required role
  if (requiredRole && user && !user.roles?.includes(requiredRole)) {
    return <>{fallback}</>
  }

  // Check multiple required roles (user must have at least one)
  if (requiredRoles && user && !requiredRoles.some(role => user.roles?.includes(role))) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Convenience components for common role checks
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => (
  <ProtectedRoute requiredRole="admin" fallback={fallback}>
    {children}
  </ProtectedRoute>
)

export const ModeratorOrAdmin: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => (
  <ProtectedRoute requiredRoles={['admin', 'moderator']} fallback={fallback}>
    {children}
  </ProtectedRoute>
)

export const AuthenticatedOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => (
  <ProtectedRoute requireAuth={true} fallback={fallback}>
    {children}
  </ProtectedRoute>
)
