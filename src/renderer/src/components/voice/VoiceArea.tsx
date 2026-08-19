import React from 'react'
import { VoiceControls } from './VoiceControls'
import { User } from '../../types'

interface VoiceAreaProps {
  currentUser: User | null
  remoteParticipants: string[]
  activeVoiceChannelId: string | null
  viewingChannelId: string | null
  isMuted: boolean
  isDeafened: boolean
  isSharingScreen: boolean
  onToggleMute: () => void
  onToggleDeafen: () => void
  onShareScreen: () => void
  onLeaveCall: () => void
}

export const VoiceArea: React.FC<VoiceAreaProps> = ({
  currentUser,
  remoteParticipants,
  activeVoiceChannelId,
  viewingChannelId,
  isMuted,
  isDeafened,
  isSharingScreen,
  onToggleMute,
  onToggleDeafen,
  onShareScreen,
  onLeaveCall
}) => {
  return (
    <div className="flex-1 bg-black p-6 relative flex flex-col items-center justify-center overflow-hidden z-0">
      <div className="flex flex-wrap justify-center content-center gap-4 w-full h-full max-w-6xl">
        <div
          id="tile-local"
          className="relative bg-[#2b2d31] rounded-lg overflow-hidden flex-1 aspect-video min-w-[300px] max-w-[800px] flex items-center justify-center shadow-lg"
        >
          <div className="w-20 h-20 rounded-full bg-discord-blurple flex items-center justify-center text-white text-3xl font-bold shadow-lg z-0">
            {currentUser?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-xs text-white z-20 font-medium">
            Você
          </div>
        </div>

        {remoteParticipants.map((identity) => (
          <div
            key={identity}
            id={`tile-${identity}`}
            className="relative bg-[#2b2d31] rounded-lg overflow-hidden flex-1 aspect-video min-w-[300px] max-w-[800px] flex items-center justify-center shadow-lg"
          >
            <div className="w-20 h-20 rounded-full bg-[#1a6335] flex items-center justify-center text-white text-3xl font-bold shadow-lg z-0">
              {identity.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-xs text-white z-20 font-medium">
              {identity}
            </div>
          </div>
        ))}
      </div>

      {activeVoiceChannelId === viewingChannelId && (
        <VoiceControls
          isMuted={isMuted}
          isDeafened={isDeafened}
          isSharingScreen={isSharingScreen}
          onToggleMute={onToggleMute}
          onToggleDeafen={onToggleDeafen}
          onShareScreen={onShareScreen}
          onLeaveCall={onLeaveCall}
        />
      )}
    </div>
  )
}
