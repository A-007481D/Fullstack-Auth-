'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'

/**
 * Root page — redirects to the appropriate dashboard based on role,
 * or to /login if not authenticated.
 *
 * Why not use middleware for this?
 * - Next.js middleware runs on the Edge (no localStorage access).
 * - We're using localStorage for token storage, so auth checks must happen client-side.
 * - For a production app with HTTP-only cookies, middleware would be the right place.
 */
export default function HomePage() {
  const router = useRouter()
  const { user, isHydrated } = useAuthStore()

  useEffect(() => {
    if (!isHydrated) return // wait for localStorage to be read

    if (!user) {
      router.replace('/login')
      return
    }

    // Redirect to role-specific dashboard
    switch (user.role) {
      case 'admin':  router.replace('/dashboard/admin');  break
      case 'client': router.replace('/dashboard/client'); break
      case 'worker': router.replace('/dashboard/worker'); break
      default:       router.replace('/login')
    }
  }, [user, isHydrated, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}
