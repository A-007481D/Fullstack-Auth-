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
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>
      if (axiosError.response?.status === 401 || axiosError.response?.status === 422) {
        setError('Invalid email or password.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    }
  }

  const quickLogin = (e: string) => { setEmail(e); setPassword('password') }

  return (
    <div className="min-h-screen flex bg-[#080b14]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between
                      border-r border-white/[0.05] bg-[#0a0d16] px-10 py-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span className="text-base font-semibold text-white">TaskFlow</span>
          </div>

          <h2 className="text-3xl font-bold text-white leading-tight">
            Manage tasks<br />
            <span className="text-indigo-400">with clarity.</span>
          </h2>
          <p className="mt-4 text-sm text-gray-500 leading-relaxed">
            Role-based access control for your team. Admins, clients and workers — everyone sees exactly what they need.
          </p>
        </div>

        {/* Role cards */}
        <div className="space-y-3">
          {[
            { role: 'Admin',  color: 'from-violet-600/20 to-indigo-600/20', border: 'border-violet-500/20', dot: 'bg-violet-400', desc: 'Full system access' },
            { role: 'Client', color: 'from-indigo-600/20 to-blue-600/20',   border: 'border-indigo-500/20', dot: 'bg-indigo-400', desc: 'Create & track requests' },
            { role: 'Worker', color: 'from-orange-600/20 to-amber-600/20',  border: 'border-orange-500/20', dot: 'bg-orange-400', desc: 'View & update tasks' },
          ].map(({ role, color, border, dot, desc }) => (
            <div key={role} className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${color} border ${border}`}>
              <div className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
              <div>
                <p className="text-sm font-semibold text-white">{role}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span className="text-base font-semibold text-white">TaskFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              id="login-submit"
              disabled={isLoading || !email || !password}
              className="btn-primary w-full mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Test accounts */}
          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <p className="text-[11px] text-gray-600 uppercase tracking-widest font-semibold mb-3">Quick access</p>
            <div className="space-y-1.5">
              {[
                { role: 'admin',  email: 'admin@app.com',  label: 'Admin' },
                { role: 'client', email: 'client@app.com', label: 'Client' },
                { role: 'worker', email: 'worker@app.com', label: 'Worker' },
              ].map(({ role, email: e, label }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => quickLogin(e)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl
                             bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1]
                             transition-all duration-150 group"
                >
                  <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">{e}</span>
                  <span className={`badge badge-${role}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
