/**
 * Axios API Client
 *
 * Central HTTP client for all backend API calls.
 *
 * Design decisions:
 * - Single instance exported — all API calls share the same config and interceptors.
 * - Base URL from environment variable — works in both Docker and local dev.
 * - Request interceptor automatically attaches the Bearer token from localStorage.
 * - Response interceptor handles 401 (token expired/invalid) globally — redirects to login.
 *
 * Why Axios over fetch?
 * - Interceptors: clean place to attach auth headers and handle errors globally.
 * - Request/response transformation is built-in.
 * - Better TypeScript generics support for typed responses.
 */

import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// ── Request Interceptor ──────────────────────────────────────────
// Runs before every request — attaches the stored token to headers.
apiClient.interceptors.request.use(
  (config) => {
    // localStorage is only available in the browser (not during SSR)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor ─────────────────────────────────────────
// Runs after every response — handles global error scenarios.
apiClient.interceptors.response.use(
  (response) => response, // pass through successful responses unchanged
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired — clear local state and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        // Use window.location to force a full page reload (clears React state too)
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
