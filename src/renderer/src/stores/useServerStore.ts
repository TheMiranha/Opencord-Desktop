import { create } from 'zustand'
import { Server, Channel, ServerMember, VoiceParticipant } from '../types'

interface ServerState {
  servers: Server[]
  activeServerId: string | null
  serverChannelsCache: Record<string, Channel[]>
  serverMembersCache: Record<string, ServerMember[]>
  lastVisitedChannel: Record<string, string>
  serverVoiceStates: Record<string, Record<string, VoiceParticipant[]>>

  setServers: (servers: Server[]) => void
  setActiveServerId: (id: string | null) => void
  setServerChannelsCache: (
    cache: Record<string, Channel[]> | ((prev: Record<string, Channel[]>) => Record<string, Channel[]>)
  ) => void
  setServerMembersCache: (
    cache: Record<string, ServerMember[]> | ((prev: Record<string, ServerMember[]>) => Record<string, ServerMember[]>)
  ) => void
  setLastVisitedChannel: (
    visited: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => void
  setServerVoiceStates: (
    serverId: string,
    states: Record<string, VoiceParticipant[]> | ((prev: Record<string, VoiceParticipant[]>) => Record<string, VoiceParticipant[]>)
  ) => void
  handleVoiceJoin: (serverId: string, channelId: string, participant: VoiceParticipant) => void
  handleVoiceLeave: (serverId: string, channelId: string, userId: string) => void
  handleVoiceStateUpdate: (serverId: string, channelId: string, userId: string, isMuted: boolean, isDeafened: boolean) => void
}

export const useServerStore = create<ServerState>((set) => ({
  servers: [],
  activeServerId: null,
  serverChannelsCache: {},
  serverMembersCache: {},
  lastVisitedChannel: {},
  serverVoiceStates: {},

  setServers: (servers) => set({ servers }),
  setActiveServerId: (activeServerId) => set({ activeServerId }),
  setServerChannelsCache: (cache) =>
    set((state) => ({
      serverChannelsCache: typeof cache === 'function' ? cache(state.serverChannelsCache) : cache
    })),
  setServerMembersCache: (cache) =>
    set((state) => ({
      serverMembersCache: typeof cache === 'function' ? cache(state.serverMembersCache) : cache
    })),
  setLastVisitedChannel: (visited) =>
    set((state) => ({
      lastVisitedChannel: typeof visited === 'function' ? visited(state.lastVisitedChannel) : visited
    })),

  setServerVoiceStates: (serverId, states) =>
    set((state) => {
      const currentServerStates = state.serverVoiceStates[serverId] || {}
      const updated = typeof states === 'function' ? states(currentServerStates) : states
      return {
        serverVoiceStates: {
          ...state.serverVoiceStates,
          [serverId]: updated
        }
      }
    }),

  handleVoiceJoin: (serverId, channelId, participant) =>
    set((state) => {
      const serverMap = { ...(state.serverVoiceStates[serverId] || {}) }

      // 1. Remove o usuário de qualquer outro canal deste servidor (para evitar duplicações)
      Object.keys(serverMap).forEach((chId) => {
        serverMap[chId] = (serverMap[chId] || []).filter((p) => p.userId !== participant.userId)
      })

      // 2. Adiciona o usuário no canal atual
      const currentList = serverMap[channelId] || []
      serverMap[channelId] = [...currentList, participant]

      return {
        serverVoiceStates: {
          ...state.serverVoiceStates,
          [serverId]: serverMap
        }
      }
    }),

  handleVoiceLeave: (serverId, channelId, userId) =>
    set((state) => {
      const serverMap = { ...(state.serverVoiceStates[serverId] || {}) }
      if (serverMap[channelId]) {
        serverMap[channelId] = serverMap[channelId].filter((p) => p.userId !== userId)
      }
      return {
        serverVoiceStates: {
          ...state.serverVoiceStates,
          [serverId]: serverMap
        }
      }
    }),

  handleVoiceStateUpdate: (serverId, channelId, userId, isMuted, isDeafened) =>
    set((state) => {
      const serverMap = { ...(state.serverVoiceStates[serverId] || {}) }
      if (serverMap[channelId]) {
        serverMap[channelId] = serverMap[channelId].map((p) =>
          p.userId === userId ? { ...p, isMuted, isDeafened } : p
        )
      }
      return {
        serverVoiceStates: {
          ...state.serverVoiceStates,
          [serverId]: serverMap
        }
      }
    })
}))
