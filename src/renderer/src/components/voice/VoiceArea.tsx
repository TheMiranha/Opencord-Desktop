import React, { useState } from 'react'
import { Volume2, Volume1, VolumeX } from 'lucide-react'
import { VoiceControls } from './VoiceControls'
import { User } from '../../types'
import { UserAvatar } from '../common/UserAvatar'
import { useServerStore } from '../../stores/useServerStore'
import { useChannelStore } from '../../stores/useChannelStore'
import { useVoiceStore } from '../../stores/useVoiceStore'
import { ParticipantVolumePopover } from './ParticipantVolumePopover'

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
  const [volumePopoverIdentity, setVolumePopoverIdentity] = useState<string | null>(null)
  const { activeServerId, serverMembersCache } = useServerStore()
  const { dmChannels } = useChannelStore()
  const { userVolumes } = useVoiceStore()

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

  const getVolumeIcon = (vol: number) => {
    if (vol === 0) return <VolumeX size={14} className="text-discord-danger" />
    if (vol < 50) return <Volume1 size={14} className="text-amber-400" />
    return <Volume2 size={14} className="text-discord-textMuted group-hover:text-white" />
  }

  return (
    <div className="flex-1 bg-black p-6 relative flex flex-col items-center justify-center overflow-hidden z-0">
      <div className="flex flex-wrap justify-center content-center gap-4 w-full h-full max-w-6xl">
        {/* Tile Local */}
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
          <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded text-xs text-white z-20 font-medium">
            Você
          </div>
        </div>

        {/* Tiles Remotos */}
        {remoteParticipants.map((identity) => {
          const userVolume = typeof userVolumes[identity] === 'number' ? userVolumes[identity] : 100
          const isPopoverOpen = volumePopoverIdentity === identity

          return (
            <div
              key={identity}
              id={`tile-${identity}`}
              onContextMenu={(e) => {
                e.preventDefault()
                setVolumePopoverIdentity(isPopoverOpen ? null : identity)
              }}
              className="relative group bg-[#2b2d31] rounded-lg overflow-hidden flex-1 aspect-video min-w-[300px] max-w-[800px] flex items-center justify-center shadow-lg cursor-pointer"
            >
              <UserAvatar
                username={identity}
                avatarUrl={getParticipantAvatar(identity)}
                size="3xl"
                className="z-0"
              />

              {/* Tag com nome no canto inferior esquerdo */}
              <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded text-xs text-white z-20 font-medium flex items-center gap-1.5">
                <span>{identity}</span>
                {userVolume !== 100 && (
                  <span
                    className={`text-[10px] px-1 rounded font-mono ${
                      userVolume === 0 ? 'bg-red-500/30 text-red-300' : 'bg-discord-blurple/30 text-discord-blurple'
                    }`}
                  >
                    {userVolume === 0 ? 'MUTADO' : `${userVolume}%`}
                  </span>
                )}
              </div>

              {/* Botão de Controle de Volume no canto superior direito */}
              <div className="absolute top-3 right-3 z-30">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setVolumePopoverIdentity(isPopoverOpen ? null : identity)
                  }}
                  className={`p-2 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                    userVolume !== 100 || isPopoverOpen
                      ? 'bg-[#18191c]/90 text-white shadow-md'
                      : 'bg-black/40 text-discord-textMuted hover:text-white hover:bg-black/70 opacity-0 group-hover:opacity-100'
                  }`}
                  title="Ajustar volume deste usuário"
                >
                  {getVolumeIcon(userVolume)}
                  {userVolume !== 100 && (
                    <span className="text-[10px] font-bold font-mono pr-0.5">
                      {userVolume}%
                    </span>
                  )}
                </button>

                {/* Popover de Ajuste de Volume */}
                {isPopoverOpen && (
                  <ParticipantVolumePopover
                    identity={identity}
                    onClose={() => setVolumePopoverIdentity(null)}
                    className="top-10 right-0"
                  />
                )}
              </div>
            </div>
          )
        })}
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
