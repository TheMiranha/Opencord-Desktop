import React, { useState } from 'react'
import { useServerStore } from '../../stores/useServerStore'
import { useChannelStore } from '../../stores/useChannelStore'
import { useVoiceStore } from '../../stores/useVoiceStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { useModalStore } from '../../stores/useModalStore'
import { UserAvatar } from '../common/UserAvatar'
import { ParticipantVolumePopover } from '../voice/ParticipantVolumePopover'

import { Hash, Volume2, MicOff, Headphones, VolumeX, Volume1, Plus, Trash2 } from 'lucide-react'

interface ServerChannelListProps {
  onSelectChannel: (channelId: string) => void
  onJoinVoice: (channelId: string) => void
}

export const ServerChannelList: React.FC<ServerChannelListProps> = ({
  onSelectChannel,
  onJoinVoice
}) => {
  const [volumePopoverIdentity, setVolumePopoverIdentity] = useState<string | null>(null)
  const { activeServerId, serverChannelsCache, serverMembersCache, serverVoiceStates } = useServerStore()
  const { viewingChannelId } = useChannelStore()
  const { activeVoiceChannelId, userVolumes } = useVoiceStore()
  const { currentUser } = useAuthStore()
  const { openCreateChannelModal, openDeleteChannelModal } = useModalStore()

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
    <div className="flex-1 overflow-y-auto px-2 py-3 pb-28 flex flex-col gap-0.5 select-none">
      {/* Canais de Texto */}
      <div className="px-1 pt-2 pb-1 flex items-center justify-between text-discord-textMuted group/header">
        <div className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-1">
          <Hash size={14} />
          Canais de Texto
        </div>
        <button
          type="button"
          onClick={() => openCreateChannelModal('SERVER_TEXT')}
          className="text-discord-textMuted hover:text-white p-0.5 rounded transition-colors cursor-pointer"
          title="Criar Canal de Texto"
        >
          <Plus size={16} />
        </button>
      </div>
      {textChannels.map((ch) => (
        <div
          key={ch.id}
          onClick={() => onSelectChannel(ch.id)}
          className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group ${
            viewingChannelId === ch.id
              ? 'bg-[#404249] text-white'
              : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Hash size={18} className="text-discord-textMuted flex-shrink-0" />
            <span className="truncate">{ch.name}</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openDeleteChannelModal({ id: ch.id, name: ch.name, type: ch.type })
            }}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition-all text-discord-textMuted cursor-pointer"
            title={`Excluir canal #${ch.name}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {/* Canais de Voz */}
      <div className="px-1 pt-4 pb-1 flex items-center justify-between text-discord-textMuted group/header">
        <div className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-1">
          <Volume2 size={14} />
          Canais de Voz
        </div>
        <button
          type="button"
          onClick={() => openCreateChannelModal('SERVER_VOICE')}
          className="text-discord-textMuted hover:text-white p-0.5 rounded transition-colors cursor-pointer"
          title="Criar Canal de Voz"
        >
          <Plus size={16} />
        </button>
      </div>
      {voiceChannels.map((ch) => {
        const isConnected = activeVoiceChannelId === ch.id
        const isViewing = viewingChannelId === ch.id
        const participants = activeServerId ? serverVoiceStates[activeServerId]?.[ch.id] || [] : []

        return (
          <div key={ch.id} className="flex flex-col">
            <div
              onClick={() => onJoinVoice(ch.id)}
              className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group ${
                isViewing
                  ? 'bg-[#404249] text-white'
                  : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Volume2
                  size={18}
                  className={`flex-shrink-0 ${isConnected ? 'text-[#23a559]' : 'text-discord-textMuted'}`}
                />
                <span className="truncate">{ch.name}</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  openDeleteChannelModal({ id: ch.id, name: ch.name, type: ch.type })
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded transition-all text-discord-textMuted cursor-pointer"
                title={`Excluir canal ${ch.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Participantes conectados no canal de voz (visíveis antes e depois de entrar na call) */}
            {participants.length > 0 && (
              <div className="flex flex-col gap-[2px] mt-1 pl-7 pr-2 mb-2">
                {participants.map((p) => {
                  const isMe = currentUser?.id === p.userId || currentUser?.username === p.username
                  const userVol = typeof userVolumes[p.username] === 'number' ? userVolumes[p.username] : 100
                  const isPopoverOpen = volumePopoverIdentity === p.username

                  return (
                    <div
                      key={p.userId}
                      className="relative flex items-center justify-between gap-2 px-2 py-1 rounded hover:bg-[#35373c] cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <UserAvatar
                          username={p.username}
                          avatarUrl={p.avatarUrl || getParticipantAvatar(p.username)}
                          size="xs"
                          status="online"
                        />
                        <span className="text-discord-textMuted text-[13px] font-medium truncate group-hover:text-discord-textNormal">
                          {p.username} {isMe && <span className="text-[11px] opacity-70">(Você)</span>}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {p.isMuted && (
                          <span title="Microfone Mutado" className="flex items-center">
                            <MicOff size={14} className="text-discord-danger flex-shrink-0" />
                          </span>
                        )}
                        {p.isDeafened && (
                          <span title="Áudio Desativado" className="flex items-center">
                            <Headphones size={14} className="text-discord-danger flex-shrink-0" />
                          </span>
                        )}

                        {/* Botão de Ajustar Volume se estiver no mesmo canal */}
                        {isConnected && !isMe && (
                          <div className="relative flex items-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setVolumePopoverIdentity(isPopoverOpen ? null : p.username)
                              }}
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                userVol !== 100 || isPopoverOpen
                                  ? 'text-white bg-[#18191c]'
                                  : 'text-discord-textMuted opacity-0 group-hover:opacity-100 hover:text-white'
                              }`}
                              title={`Ajustar volume de ${p.username} (${userVol}%)`}
                            >
                              {getVolumeIcon(userVol)}
                            </button>

                            {isPopoverOpen && (
                              <ParticipantVolumePopover
                                identity={p.username}
                                onClose={() => setVolumePopoverIdentity(null)}
                                className="top-7 right-0"
                              />
                            )}
                          </div>
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
