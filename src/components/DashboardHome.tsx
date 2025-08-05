import type { User } from '../lib/supabase'

interface DashboardHomeProps {
  user: User
}

export function DashboardHome({ user }: DashboardHomeProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'
      case 'conductor':
        return 'bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400'
      case 'analyst':
        return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
      case 'data recorder':
        return 'bg-theme-purple-500/10 text-theme-purple-500'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80'
    }
  }

  const getPermissionsByRole = (role: string) => {
    switch (role) {
      case 'admin':
        return ['Full system access', 'User management', 'All modules', 'System configuration']
      case 'conductor':
        return ['Experiment management', 'Data collection', 'Analytics access', 'Data entry']
      case 'analyst':
        return ['Data analysis', 'Report generation', 'Read-only access', 'Analytics dashboard']
      case 'data recorder':
        return ['Data entry', 'Record management', 'Basic reporting', 'Data validation']
      default:
        return []
    }
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Welcome Section */}
      <div className="col-span-12 mb-6">
        <h1 className="text-title-md font-bold text-gray-800 dark:text-white/90">Dashboard</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Welcome to the Pecan Experiments Dashboard</p>
      </div>

      {/* User Information Card */}
      <div className="col-span-12 xl:col-span-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 mb-5">
            <svg className="text-gray-800 size-6 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-2">
            User Information
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Your account details and role permissions.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</span>
              <span className="text-sm text-gray-800 dark:text-white/90">{user.email}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Roles</span>
              <div className="flex flex-wrap gap-1">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active'
                ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
                : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'
                }`}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</span>
              <span className="text-sm text-gray-800 dark:text-white/90 font-mono">{user.id}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Member since</span>
              <span className="text-sm text-gray-800 dark:text-white/90">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Permissions */}
      <div className="col-span-12 xl:col-span-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 mb-5">
            <svg className="text-gray-800 size-6 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-2">
            Role Permissions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Your access levels and capabilities.
          </p>

          <div className="space-y-4">
            {user.roles.map((role) => (
              <div key={role} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                </div>
                <ul className="space-y-2">
                  {getPermissionsByRole(role).map((permission, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-success-500 mr-2">✓</span>
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {user.roles.includes('admin') && (
        <div className="col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 mb-5">
              <svg className="text-gray-800 size-6 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-2">
              Quick Actions
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Administrative shortcuts and tools.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-3 focus:ring-brand-500/10 transition-colors">
                👥 Manage Users
              </button>
              <button className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/5 transition-colors">
                🧪 View Experiments
              </button>
              <button className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/5 transition-colors">
                📊 Analytics
              </button>
              <button className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/5 transition-colors">
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
