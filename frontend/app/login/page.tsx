'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
import type { AxiosError } from 'axios'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, user, isHydrated } = useAuthStore()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)

  // If already authenticated, redirect away from login
  useEffect(() => {
    if (!isHydrated || !user) return
    switch (user.role) {
      case 'admin':  router.replace('/dashboard/admin');  break
      case 'client': router.replace('/dashboard/client'); break
      case 'worker': router.replace('/dashboard/worker'); break
    }
  }, [user, isHydrated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await login(email, password)
      // Redirect is handled by the useEffect above after user state updates
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>
      if (axiosError.response?.status === 401) {
        setError('Invalid email or password.')
      } else if (axiosError.response?.status === 422) {
        setError('Please enter a valid email and password.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      {/* Background gradient decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-xl mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Task Management</h1>
          <p className="text-gray-400 mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Login card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Error alert */}
            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-900/30 border border-red-700/50 rounded-lg animate-fade-in">
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={isLoading || !email || !password}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Test accounts hint */}
          <div className="mt-6 pt-5 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Test accounts</p>
            <div className="space-y-1.5">
              {[
                { role: 'Admin',  email: 'admin@app.com' },
                { role: 'Client', email: 'client@app.com' },
                { role: 'Worker', email: 'worker@app.com' },
              ].map(({ role, email: testEmail }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setEmail(testEmail); setPassword('password') }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg
                             bg-gray-800/50 hover:bg-gray-800 transition-colors text-xs group"
                >
                  <span className="text-gray-400">{testEmail}</span>
                  <span className={`badge badge-${role.toLowerCase()}`}>{role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
