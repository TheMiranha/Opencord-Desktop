import { create } from 'zustand'

interface ModalState {
  isServerModalOpen: boolean
  serverModalTab: 'create' | 'join'
  isInviteModalOpen: boolean
  isSettingsOpen: boolean
  isPickerOpen: boolean
  setIsServerModalOpen: (open: boolean) => void
  setServerModalTab: (tab: 'create' | 'join') => void
  setIsInviteModalOpen: (open: boolean) => void
  setIsSettingsOpen: (open: boolean) => void
  setIsPickerOpen: (open: boolean) => void
}

export const useModalStore = create<ModalState>((set) => ({
  isServerModalOpen: false,
  serverModalTab: 'create',
  isInviteModalOpen: false,
  isSettingsOpen: false,
  isPickerOpen: false,
  setIsServerModalOpen: (isServerModalOpen) => set({ isServerModalOpen }),
  setServerModalTab: (serverModalTab) => set({ serverModalTab }),
  setIsInviteModalOpen: (isInviteModalOpen) => set({ isInviteModalOpen }),
  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setIsPickerOpen: (isPickerOpen) => set({ isPickerOpen })
}))
