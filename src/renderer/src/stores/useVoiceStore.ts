import { create } from 'zustand'
import { Room, LocalVideoTrack } from 'livekit-client'

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
}

export const useVoiceStore = create<VoiceState>((set) => ({
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
  setScreenSources: (screenSources) => set({ screenSources })
}))
