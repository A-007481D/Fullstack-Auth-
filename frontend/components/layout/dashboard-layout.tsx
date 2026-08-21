'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import clsx from 'clsx'

interface NavItem {
  label: string
  href:  string
  icon:  React.ReactNode
}

interface DashboardLayoutProps {
  children:  React.ReactNode
  navItems:  NavItem[]
  title:     string
}

export default function DashboardLayout({ children, navItems, title }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout, isLoading } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944..." />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">TaskApp</p>
              <p className="text-xs text-gray-500">{title}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                )}
              >
                <span className="w-4 h-4 shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                       text-gray-400 hover:bg-gray-800 hover:text-red-400
                       transition-colors duration-150 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isLoading ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
