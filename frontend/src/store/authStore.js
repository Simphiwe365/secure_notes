/**
 * store/authStore.js
 * Zustand store — persists auth state to localStorage
 */
import { create } from 'zustand'
import { authAPI } from '../api/services'
import toast from 'react-hot-toast'

function persist(state) {
  localStorage.setItem('access_token',  state.accessToken  || '')
  localStorage.setItem('refresh_token', state.refreshToken || '')
  localStorage.setItem('user',          JSON.stringify(state.user || null))
}

function loadPersisted() {
  try {
    return {
      accessToken:  localStorage.getItem('access_token')  || null,
      refreshToken: localStorage.getItem('refresh_token') || null,
      user:         JSON.parse(localStorage.getItem('user')) || null,
    }
  } catch {
    return { accessToken: null, refreshToken: null, user: null }
  }
}

const useAuthStore = create((set, get) => ({
  ...loadPersisted(),
  loading: false,

  // ── Login ───────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await authAPI.login({ email, password })
      const state = {
        accessToken:  data.access,
        refreshToken: data.refresh,
        user:         data.user,
        loading:      false,
      }
      persist(state)
      set(state)
      return { ok: true }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed.'
      set({ loading: false })
      return { ok: false, error: msg }
    }
  },

  // ── Register ────────────────────────────────────────────────────────────
  register: async (payload) => {
    set({ loading: true })
    try {
      await authAPI.register(payload)
      set({ loading: false })
      return { ok: true }
    } catch (err) {
      set({ loading: false })
      const errors = err.response?.data
      return { ok: false, errors }
    }
  },

  // ── Logout ──────────────────────────────────────────────────────────────
  logout: async () => {
    const { refreshToken } = get()
    try {
      if (refreshToken) await authAPI.logout(refreshToken)
    } catch {}
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    set({ accessToken: null, refreshToken: null, user: null })
    toast.success('Signed out.')
  },

  // ── Refresh profile ──────────────────────────────────────────────────────
  refreshProfile: async () => {
    try {
      const { data } = await authAPI.getProfile()
      set((s) => {
        const next = { ...s, user: data }
        persist(next)
        return next
      })
    } catch {}
  },

  isAuthenticated: () => !!get().accessToken && !!get().user,
  isAdmin:  () => get().user?.role === 'admin',
  isEditor: () => ['editor', 'admin'].includes(get().user?.role),
}))

export default useAuthStore
