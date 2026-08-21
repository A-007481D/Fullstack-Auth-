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

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?'

  // Pick avatar gradient color per role
  const avatarColor = {
    admin:  'from-violet-600 to-indigo-600',
    client: 'from-indigo-600 to-blue-600',
    worker: 'from-orange-500 to-amber-500',
  }[user?.role ?? 'client'] ?? 'from-indigo-600 to-blue-600'

  return (
    <div className="flex min-h-screen bg-[#080b14]">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0a0d16]">

        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">TaskFlow</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-none">{title}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 shadow-sm'
                    : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
                )}
              >
                <span className={clsx('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-indigo-400' : 'text-gray-600')}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: user + sign out */}
        <div className="p-3 border-t border-white/[0.06] space-y-1">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all group"
          >
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md`}>
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate leading-none">{user?.name}</p>
              <p className="text-[11px] text-gray-500 truncate mt-0.5">{user?.email}</p>
            </div>
            <span className={`badge badge-${user?.role} text-[10px]`}>{user?.role}</span>
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm
                       text-gray-600 hover:bg-red-500/10 hover:text-red-400
                       transition-all duration-150 disabled:opacity-40 group"
          >
            <svg className="w-4 h-4 shrink-0 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isLoading ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
