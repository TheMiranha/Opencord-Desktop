import { create } from 'zustand'
import { User } from '../types'

interface AuthState {
  currentUser: User | null
  apiUrl: string
  livekitUrl: string
  token: string
  setCurrentUser: (user: User | null) => void
  setToken: (token: string) => void
  setTokensAndUrls: (apiUrl: string, livekitUrl: string, token: string) => void
  syncFromStorage: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  apiUrl: localStorage.getItem('API_URL') || '',
  livekitUrl: localStorage.getItem('LIVEKIT_URL') || '',
  token: localStorage.getItem('JWT_TOKEN') || '',
  setCurrentUser: (user) => set({ currentUser: user }),
  setToken: (token) => {
    localStorage.setItem('JWT_TOKEN', token)
    set({ token })
  },
  setTokensAndUrls: (apiUrl, livekitUrl, token) => {
    if (apiUrl) localStorage.setItem('API_URL', apiUrl)
    if (livekitUrl) localStorage.setItem('LIVEKIT_URL', livekitUrl)
    if (token) localStorage.setItem('JWT_TOKEN', token)
    set({ apiUrl, livekitUrl, token })
  },
  syncFromStorage: () => {
    set({
      apiUrl: localStorage.getItem('API_URL') || '',
      livekitUrl: localStorage.getItem('LIVEKIT_URL') || '',
      token: localStorage.getItem('JWT_TOKEN') || ''
    })
  },
  logout: () => {
    localStorage.removeItem('JWT_TOKEN')
    set({ currentUser: null, token: '' })
  }
}))
