import { create } from 'zustand'
import { Server, Channel, ServerMember } from '../types'

interface ServerState {
  servers: Server[]
  activeServerId: string | null
  serverChannelsCache: Record<string, Channel[]>
  serverMembersCache: Record<string, ServerMember[]>
  lastVisitedChannel: Record<string, string>
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
}

export const useServerStore = create<ServerState>((set) => ({
  servers: [],
  activeServerId: null,
  serverChannelsCache: {},
  serverMembersCache: {},
  lastVisitedChannel: {},
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
    }))
}))
