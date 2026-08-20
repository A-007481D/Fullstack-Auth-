'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import type { Role } from '@/types'

interface AuthGuardProps {
  children:      React.ReactNode
  allowedRoles:  Role[]
}

/**
 * AuthGuard — protects routes from unauthorized access.
 *
 * Usage: wrap any dashboard page:
 *   <AuthGuard allowedRoles={['admin']}>
 *     <AdminContent />
 *   </AuthGuard>
 *
 * This is FRONTEND authorization — only for UX.
 * The real security boundary is the backend Policy enforcement.
 *
 * Behaviour:
 * - Not authenticated → redirect to /login
 * - Authenticated but wrong role → redirect to their own dashboard
 * - Correct role → render children
 */
export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter()
  const { user, isHydrated } = useAuthStore()

  useEffect(() => {
    if (!isHydrated) return

    if (!user) {
      router.replace('/login')
      return
    }

    if (!allowedRoles.includes(user.role)) {
      // Redirect to their own dashboard instead of 403 page
      switch (user.role) {
        case 'admin':  router.replace('/dashboard/admin');  break
        case 'client': router.replace('/dashboard/client'); break
        case 'worker': router.replace('/dashboard/worker'); break
        default:       router.replace('/login')
      }
    }
  }, [user, isHydrated, allowedRoles, router])

  // Loading state while auth hydrates
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not authenticated or wrong role — render nothing (redirect is in progress)
  if (!user || !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
