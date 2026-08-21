'use client'

import DashboardLayout from '@/components/layout/dashboard-layout'
import AuthGuard from '@/components/auth-guard'
import { useAuthStore } from '@/lib/auth-store'

const UserIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

export default function ProfilePage() {
  const { user } = useAuthStore()

  const navItems = [
    { label: 'Back to Dashboard', href: `/dashboard/${user?.role || ''}`, icon: <UserIcon /> }
  ]

  return (
    <AuthGuard allowedRoles={['admin', 'client', 'worker']}>
      <DashboardLayout navItems={navItems} title="My Profile">
        <div className="animate-slide-in">
          <h1 className="text-2xl font-bold text-white mb-6">My Profile</h1>
          
          <div className="card max-w-2xl">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-brand-700 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                <span className={`badge badge-${user?.role} mt-2 inline-block`}>{user?.role}</span>
              </div>
            </div>

            <div className="space-y-6 border-t border-gray-800 pt-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="mt-1 text-white">{user?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email Address</label>
                <p className="mt-1 text-white">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Account Role</label>
                <p className="mt-1 text-white capitalize">{user?.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Account ID</label>
                <p className="mt-1 text-gray-400">#{user?.id}</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
