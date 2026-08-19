import React, { useState } from 'react'
import { useServerStore } from '../../stores/useServerStore'
import { useChannelStore } from '../../stores/useChannelStore'
import { useVoiceStore } from '../../stores/useVoiceStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { UserAvatar } from '../common/UserAvatar'
import { ParticipantVolumePopover } from '../voice/ParticipantVolumePopover'

import { Hash, Volume2, MicOff, VolumeX, Volume1 } from 'lucide-react'

interface ServerChannelListProps {
  onSelectChannel: (channelId: string) => void
  onJoinVoice: (channelId: string) => void
}

export const ServerChannelList: React.FC<ServerChannelListProps> = ({
  onSelectChannel,
  onJoinVoice
}) => {
  const [volumePopoverIdentity, setVolumePopoverIdentity] = useState<string | null>(null)
  const { activeServerId, serverChannelsCache, serverMembersCache } = useServerStore()
  const { viewingChannelId } = useChannelStore()
  const { activeVoiceChannelId, isMuted, remoteParticipants, userVolumes } = useVoiceStore()
  const { currentUser } = useAuthStore()

  const serverChannels = activeServerId ? serverChannelsCache[activeServerId] || [] : []

  const textChannels = serverChannels.filter((c) => c.type === 'SERVER_TEXT')
  const voiceChannels = serverChannels.filter((c) => c.type === 'SERVER_VOICE')

  const getParticipantAvatar = (identity: string): string | null | undefined => {
    if (activeServerId && serverMembersCache[activeServerId]) {
      const member = serverMembersCache[activeServerId].find(
        (m) => m.username === identity || m.id === identity
      )
      if (member?.avatarUrl) return member.avatarUrl
    }
    return null
  }

  const getVolumeIcon = (vol: number) => {
    if (vol === 0) return <VolumeX size={13} className="text-discord-danger" />
    if (vol < 50) return <Volume1 size={13} className="text-amber-400" />
    return <Volume2 size={13} className="text-discord-textMuted hover:text-white" />
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
      {/* Canais de Texto */}
      <div className="px-1 pt-2 pb-1 text-[12px] font-bold text-discord-textMuted uppercase tracking-wider flex items-center gap-1">
        <Hash size={14} />
        Canais de Texto
      </div>
      {textChannels.map((ch) => (
        <div
          key={ch.id}
          onClick={() => onSelectChannel(ch.id)}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
            viewingChannelId === ch.id
              ? 'bg-[#404249] text-white'
              : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'
          }`}
        >
          <Hash size={18} className="text-discord-textMuted flex-shrink-0" />
          <span className="truncate">{ch.name}</span>
        </div>
      ))}

      {/* Canais de Voz */}
      <div className="px-1 pt-4 pb-1 text-[12px] font-bold text-discord-textMuted uppercase tracking-wider flex items-center gap-1">
        <Volume2 size={14} />
        Canais de Voz
      </div>
      {voiceChannels.map((ch) => {
        const isConnected = activeVoiceChannelId === ch.id
        const isViewing = viewingChannelId === ch.id

        return (
          <div key={ch.id} className="flex flex-col">
            <div
              onClick={() => onJoinVoice(ch.id)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                isViewing
                  ? 'bg-[#404249] text-white'
                  : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'
              }`}
            >
              <Volume2 size={18} className="text-discord-textMuted flex-shrink-0" />
              <span className="truncate">{ch.name}</span>
            </div>

            {/* Participantes conectados */}
            {isConnected && (
              <div className="flex flex-col gap-[2px] mt-1 pl-7 pr-2 mb-2">
                <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#35373c] cursor-pointer group">
                  <UserAvatar
                    username={currentUser?.username || 'Você'}
                    avatarUrl={currentUser?.avatarUrl}
                    size="xs"
                    status="online"
                  />
                  <span className="text-discord-textMuted text-[13px] font-medium truncate group-hover:text-discord-textNormal">
                    {currentUser?.username}
                  </span>
                  {isMuted && (
                    <MicOff size={14} className="ml-auto text-discord-danger flex-shrink-0" />
                  )}
                </div>

                {remoteParticipants.map((identity) => {
                  const userVol = typeof userVolumes[identity] === 'number' ? userVolumes[identity] : 100
                  const isPopoverOpen = volumePopoverIdentity === identity

                  return (
                    <div
                      key={identity}
                      className="relative flex items-center justify-between gap-2 px-2 py-1 rounded hover:bg-[#35373c] cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <UserAvatar
                          username={identity}
                          avatarUrl={getParticipantAvatar(identity)}
                          size="xs"
                          status="online"
                        />
                        <span className="text-discord-textMuted text-[13px] font-medium truncate group-hover:text-discord-textNormal">
                          {identity}
                        </span>
                      </div>

                      {/* Botão de Ajustar Volume */}
                      <div className="relative flex items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setVolumePopoverIdentity(isPopoverOpen ? null : identity)
                          }}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            userVol !== 100 || isPopoverOpen
                              ? 'text-white bg-[#18191c]'
                              : 'text-discord-textMuted opacity-0 group-hover:opacity-100 hover:text-white'
                          }`}
                          title={`Ajustar volume de ${identity} (${userVol}%)`}
                        >
                          {getVolumeIcon(userVol)}
                        </button>

                        {isPopoverOpen && (
                          <ParticipantVolumePopover
                            identity={identity}
                            onClose={() => setVolumePopoverIdentity(null)}
                            className="top-7 right-0"
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
