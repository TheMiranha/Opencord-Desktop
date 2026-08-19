import { create } from 'zustand'

export interface ChannelToDelete {
  id: string
  name: string
  type: string
}

interface ModalState {
  isServerModalOpen: boolean
  serverModalTab: 'create' | 'join'
  isInviteModalOpen: boolean
  isSettingsOpen: boolean
  isServerSettingsOpen: boolean
  isPickerOpen: boolean
  isCreateChannelModalOpen: boolean
  createChannelType: 'SERVER_TEXT' | 'SERVER_VOICE'
  isDeleteChannelModalOpen: boolean
  channelToDelete: ChannelToDelete | null

  setIsServerModalOpen: (open: boolean) => void
  setServerModalTab: (tab: 'create' | 'join') => void
  setIsInviteModalOpen: (open: boolean) => void
  setIsSettingsOpen: (open: boolean) => void
  setIsServerSettingsOpen: (open: boolean) => void
  setIsPickerOpen: (open: boolean) => void
  setIsCreateChannelModalOpen: (open: boolean) => void
  setCreateChannelType: (type: 'SERVER_TEXT' | 'SERVER_VOICE') => void
  openCreateChannelModal: (type?: 'SERVER_TEXT' | 'SERVER_VOICE') => void
  setIsDeleteChannelModalOpen: (open: boolean) => void
  setChannelToDelete: (channel: ChannelToDelete | null) => void
  openDeleteChannelModal: (channel: ChannelToDelete) => void
}

export const useModalStore = create<ModalState>((set) => ({
  isServerModalOpen: false,
  serverModalTab: 'create',
  isInviteModalOpen: false,
  isSettingsOpen: false,
  isServerSettingsOpen: false,
  isPickerOpen: false,
  isCreateChannelModalOpen: false,
  createChannelType: 'SERVER_TEXT',
  isDeleteChannelModalOpen: false,
  channelToDelete: null,

  setIsServerModalOpen: (isServerModalOpen) => set({ isServerModalOpen }),
  setServerModalTab: (serverModalTab) => set({ serverModalTab }),
  setIsInviteModalOpen: (isInviteModalOpen) => set({ isInviteModalOpen }),
  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setIsServerSettingsOpen: (isServerSettingsOpen) => set({ isServerSettingsOpen }),
  setIsPickerOpen: (isPickerOpen) => set({ isPickerOpen }),
  setIsCreateChannelModalOpen: (isCreateChannelModalOpen) => set({ isCreateChannelModalOpen }),
  setCreateChannelType: (createChannelType) => set({ createChannelType }),
  openCreateChannelModal: (type = 'SERVER_TEXT') =>
    set({ isCreateChannelModalOpen: true, createChannelType: type }),
  setIsDeleteChannelModalOpen: (isDeleteChannelModalOpen) => set({ isDeleteChannelModalOpen }),
  setChannelToDelete: (channelToDelete) => set({ channelToDelete }),
  openDeleteChannelModal: (channel) =>
    set({ isDeleteChannelModalOpen: true, channelToDelete: channel })
}))
