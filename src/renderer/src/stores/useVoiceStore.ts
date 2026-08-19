import { create } from 'zustand'
import { Room, LocalVideoTrack } from 'livekit-client'

const USER_VOLUMES_KEY = 'OPENCORD_USER_VOLUMES'

const loadInitialVolumes = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(USER_VOLUMES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

interface VoiceState {
  livekitRoom: Room | null
  inCall: boolean
  activeVoiceChannelId: string | null
  isMuted: boolean
  isDeafened: boolean
  isSharingScreen: boolean
  remoteParticipants: string[]
  audioInputs: MediaDeviceInfo[]
  audioOutputs: MediaDeviceInfo[]
  selectedInput: string
  selectedOutput: string
  screenTrack: LocalVideoTrack | null
  screenSources: any[]
  userVolumes: Record<string, number>
  setLivekitRoom: (room: Room | null) => void
  setInCall: (inCall: boolean) => void
  setActiveVoiceChannelId: (id: string | null) => void
  setIsMuted: (isMuted: boolean) => void
  setIsDeafened: (isDeafened: boolean) => void
  setIsSharingScreen: (isSharing: boolean) => void
  setRemoteParticipants: (
    participants: string[] | ((prev: string[]) => string[])
  ) => void
  setAudioInputs: (inputs: MediaDeviceInfo[]) => void
  setAudioOutputs: (outputs: MediaDeviceInfo[]) => void
  setSelectedInput: (input: string) => void
  setSelectedOutput: (output: string) => void
  setScreenTrack: (track: LocalVideoTrack | null) => void
  setScreenSources: (sources: any[]) => void
  setUserVolume: (identity: string, volume: number) => void
  getUserVolume: (identity: string) => number
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  livekitRoom: null,
  inCall: false,
  activeVoiceChannelId: null,
  isMuted: false,
  isDeafened: false,
  isSharingScreen: false,
  remoteParticipants: [],
  audioInputs: [],
  audioOutputs: [],
  selectedInput: '',
  selectedOutput: '',
  screenTrack: null,
  screenSources: [],
  userVolumes: loadInitialVolumes(),
  setLivekitRoom: (livekitRoom) => set({ livekitRoom }),
  setInCall: (inCall) => set({ inCall }),
  setActiveVoiceChannelId: (activeVoiceChannelId) => set({ activeVoiceChannelId }),
  setIsMuted: (isMuted) => set({ isMuted }),
  setIsDeafened: (isDeafened) => set({ isDeafened }),
  setIsSharingScreen: (isSharingScreen) => set({ isSharingScreen }),
  setRemoteParticipants: (participants) =>
    set((state) => ({
      remoteParticipants:
        typeof participants === 'function'
          ? participants(state.remoteParticipants)
          : participants
    })),
  setAudioInputs: (audioInputs) => set({ audioInputs }),
  setAudioOutputs: (audioOutputs) => set({ audioOutputs }),
  setSelectedInput: (selectedInput) => set({ selectedInput }),
  setSelectedOutput: (selectedOutput) => set({ selectedOutput }),
  setScreenTrack: (screenTrack) => set({ screenTrack }),
  setScreenSources: (screenSources) => set({ screenSources }),
  setUserVolume: (identity: string, volume: number) => {
    const clamped = Math.max(0, Math.min(200, volume))
    const updated = { ...get().userVolumes, [identity]: clamped }
    try {
      localStorage.setItem(USER_VOLUMES_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error('Erro ao salvar volume do usuário:', e)
    }
    set({ userVolumes: updated })

    // Aplica o volume em todos os elementos de áudio desse participante
    const audioElements = document.querySelectorAll(`audio[data-participant="${identity}"]`)
    audioElements.forEach((el) => {
      if (el instanceof HTMLAudioElement) {
        // HTMLAudioElement suporta 0.0 a 1.0 (clamped em 100%)
        el.volume = Math.max(0, Math.min(1, clamped / 100))
        el.muted = get().isDeafened || clamped === 0
      }
    })
  },
  getUserVolume: (identity: string) => {
    const vol = get().userVolumes[identity]
    return typeof vol === 'number' ? vol : 100
  }
}))
