// One shared axios instance for every backend call.
//
// The login token is kept ONLY in memory (this variable), never in localStorage, so other
// scripts can't read it from storage. The cost: refreshing the page logs you out.

import axios from 'axios'

export const api = axios.create({
  // Set VITE_API_URL in .env.local (locally) or in Vercel. Falls back to the local backend.
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000',
})

let token: string | null = null
let onSessionExpired: (() => void) | null = null

export function setAuthToken(newToken: string | null) {
  token = newToken
}

// AuthProvider registers what to do when the backend says "you're not logged in" (401).
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler
}

// Before every request: add "Authorization: Bearer <token>".
api.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// After every response: a 401 means the login expired. (Not for the login call itself,
// where 401 just means a wrong password.)
api.interceptors.response.use(undefined, (error) => {
  const isLoginCall = error.config?.url === '/auth/login'
  if (error.response?.status === 401 && token && !isLoginCall) {
    onSessionExpired?.()
  }
  return Promise.reject(error)
})
