import { create } from 'zustand'
import { Channel } from '../types'

interface ChannelState {
  dmChannels: Channel[]
  searchTerm: string
  viewingChannelId: string | null
  setDmChannels: (channels: Channel[]) => void
  setSearchTerm: (term: string) => void
  setViewingChannelId: (id: string | null) => void
}

export const useChannelStore = create<ChannelState>((set) => ({
  dmChannels: [],
  searchTerm: '',
  viewingChannelId: null,
  setDmChannels: (dmChannels) => set({ dmChannels }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setViewingChannelId: (viewingChannelId) => set({ viewingChannelId })
}))
