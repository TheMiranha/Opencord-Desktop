import { create } from 'zustand'
import { User } from '../types'

interface ServerConfig {
  livekitUrl: string
  version?: string
}

interface AuthState {
  currentUser: User | null
  apiUrl: string
  livekitUrl: string
  token: string
  setCurrentUser: (user: User | null) => void
  setToken: (token: string) => void
  setTokensAndUrls: (apiUrl: string, livekitUrl: string, token: string) => void
  setApiUrl: (url: string) => void
  setLivekitUrl: (url: string) => void
  fetchServerConfig: (targetApiUrl?: string) => Promise<ServerConfig | null>
  syncFromStorage: () => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  apiUrl: localStorage.getItem('API_URL') || '',
  livekitUrl: localStorage.getItem('LIVEKIT_URL') || '',
  token: localStorage.getItem('JWT_TOKEN') || '',
  setCurrentUser: (user) => set({ currentUser: user }),
  setToken: (token) => {
    localStorage.setItem('JWT_TOKEN', token)
    set({ token })
  },
  setApiUrl: (apiUrl: string) => {
    localStorage.setItem('API_URL', apiUrl)
    set({ apiUrl })
  },
  setLivekitUrl: (livekitUrl: string) => {
    localStorage.setItem('LIVEKIT_URL', livekitUrl)
    set({ livekitUrl })
  },
  setTokensAndUrls: (apiUrl, livekitUrl, token) => {
    if (apiUrl) localStorage.setItem('API_URL', apiUrl)
    if (livekitUrl) localStorage.setItem('LIVEKIT_URL', livekitUrl)
    if (token) localStorage.setItem('JWT_TOKEN', token)
    set({ apiUrl, livekitUrl, token })
  },
  fetchServerConfig: async (targetApiUrl?: string) => {
    const rawUrl = targetApiUrl || get().apiUrl || localStorage.getItem('API_URL') || ''
    const cleanUrl = rawUrl.replace(/\/+$/, '')
    if (!cleanUrl) return null

    try {
      const res = await fetch(`${cleanUrl}/config`)
      if (res.ok) {
        const json = await res.json()
        const config: ServerConfig = json?.data || json
        if (config && config.livekitUrl) {
          localStorage.setItem('LIVEKIT_URL', config.livekitUrl)
          set({ livekitUrl: config.livekitUrl })
          return config
        }
      }
    } catch (err) {
      console.error('Erro ao buscar configuração do servidor:', err)
    }
    return null
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
