import React from 'react'
import { useServerStore } from '../../stores/useServerStore'
import { useChannelStore } from '../../stores/useChannelStore'
import { useVoiceStore } from '../../stores/useVoiceStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { UserAvatar } from '../common/UserAvatar'

import { Hash, Volume2, MicOff } from 'lucide-react'

interface ServerChannelListProps {
  onSelectChannel: (channelId: string) => void
  onJoinVoice: (channelId: string) => void
}

export const ServerChannelList: React.FC<ServerChannelListProps> = ({
  onSelectChannel,
  onJoinVoice
}) => {
  const { activeServerId, serverChannelsCache, serverMembersCache } = useServerStore()
  const { viewingChannelId } = useChannelStore()
  const { activeVoiceChannelId, isMuted, remoteParticipants } = useVoiceStore()
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

                {remoteParticipants.map((identity) => (
                  <div
                    key={identity}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#35373c] cursor-pointer group"
                  >
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
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
