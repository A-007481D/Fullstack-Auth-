/**
 * Auth Store — Zustand global state for authentication
 *
 * Why Zustand over React Context?
 * - No Provider boilerplate — import useAuthStore anywhere.
 * - Selective subscriptions — components only re-render when their slice of state changes.
 * - Built-in devtools support for debugging.
 * - Simpler than Redux for this use case.
 *
 * Persistence strategy:
 * - Token stored in localStorage (persists across page refreshes).
 * - User object stored in localStorage (avoids a round-trip to /me on page load).
 * - On app mount, we rehydrate from localStorage via initAuth().
 * - Any 401 response from the API clears this state (via Axios interceptor in lib/api.ts).
 */

import { create } from 'zustand'
import type { User, LoginResponse } from '@/types'
import apiClient from '@/lib/api'

interface AuthState {
  user:         User | null
  token:        string | null
  isLoading:    boolean
  isHydrated:   boolean

  // Actions
  login:        (email: string, password: string) => Promise<void>
  logout:       () => Promise<void>
  initAuth:     () => void       // call on app mount to rehydrate from localStorage
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:       null,
  token:      null,
  isLoading:  false,
  isHydrated: false,

  // ── initAuth ───────────────────────────────────────────────────
  // Called once in the root layout on mount.
  // Reads token + user from localStorage to rehydrate state.
  initAuth: () => {
    if (typeof window === 'undefined') return // SSR guard

    const token = localStorage.getItem('auth_token')
    const userRaw = localStorage.getItem('auth_user')

    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw) as User
        set({ user, token, isHydrated: true })
      } catch {
        // Corrupted localStorage data — clear it
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        set({ isHydrated: true })
      }
    } else {
      set({ isHydrated: true })
    }
  },

  // ── login ──────────────────────────────────────────────────────
  login: async (email: string, password: string) => {
    set({ isLoading: true })

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', { email, password })
      const { user, token } = response.data

      // Persist to localStorage
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))

      set({ user, token, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error // re-throw so the login form can display the error
    }
  },

  // ── logout ─────────────────────────────────────────────────────
  logout: async () => {
    set({ isLoading: true })

    try {
      // Tell the backend to revoke the token
      await apiClient.post('/auth/logout')
    } catch {
      // Even if the API call fails, we still clear local state
      // (e.g., if the token was already expired)
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      set({ user: null, token: null, isLoading: false })
    }
  },
}))
