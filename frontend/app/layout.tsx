'use client'

/**
 * Root Layout — wraps every page in the app.
 *
 * Responsibilities:
 * 1. Global HTML structure (html, head, body)
 * 2. Auth store hydration (initAuth runs once on mount)
 * 3. Global styles
 *
 * Why 'use client' here?
 * - initAuth reads from localStorage (browser-only API).
 * - useEffect only runs client-side.
 * - The layout itself doesn't fetch data — it's a thin shell.
 */

import { useEffect } from 'react'
import type { Metadata } from 'next'
import { useAuthStore } from '@/lib/auth-store'
import './globals.css'

// Note: Metadata export only works in Server Components.
// Since we need 'use client', we handle meta tags via next/head pattern or
// move metadata to a separate server component wrapper.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((state) => state.initAuth)

  useEffect(() => {
    // Rehydrate auth state from localStorage on page load.
    // This runs once — if token exists, user is logged back in automatically.
    initAuth()
  }, [initAuth])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Task Management</title>
        <meta name="description" content="User and Task Management Application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
