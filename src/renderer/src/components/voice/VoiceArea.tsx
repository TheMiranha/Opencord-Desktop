import React from 'react'
import { VoiceControls } from './VoiceControls'
import { User } from '../../types'
import { UserAvatar } from '../common/UserAvatar'
import { useServerStore } from '../../stores/useServerStore'
import { useChannelStore } from '../../stores/useChannelStore'

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
  const { activeServerId, serverMembersCache } = useServerStore()
  const { dmChannels } = useChannelStore()

  const getParticipantAvatar = (identity: string): string | null | undefined => {
    if (activeServerId && serverMembersCache[activeServerId]) {
      const member = serverMembersCache[activeServerId].find(
        (m) => m.username === identity || m.id === identity
      )
      if (member?.avatarUrl) return member.avatarUrl
    }
    for (const ch of dmChannels) {
      const member = ch.members?.find((m) => m.username === identity || m.id === identity)
      if (member?.avatarUrl) return member.avatarUrl
    }
    return null
  }

  return (
    <div className="flex-1 bg-black p-6 relative flex flex-col items-center justify-center overflow-hidden z-0">
      <div className="flex flex-wrap justify-center content-center gap-4 w-full h-full max-w-6xl">
        <div
          id="tile-local"
          className="relative bg-[#2b2d31] rounded-lg overflow-hidden flex-1 aspect-video min-w-[300px] max-w-[800px] flex items-center justify-center shadow-lg"
        >
          <UserAvatar
            username={currentUser?.username || 'Você'}
            avatarUrl={currentUser?.avatarUrl}
            size="3xl"
            className="z-0"
          />
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
            <UserAvatar
              username={identity}
              avatarUrl={getParticipantAvatar(identity)}
              size="3xl"
              className="z-0"
            />
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
