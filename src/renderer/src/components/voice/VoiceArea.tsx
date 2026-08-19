import React, { useState, useEffect, useRef } from 'react'
import {
  Volume2,
  Volume1,
  VolumeX,
  MessageSquare,
  AtSign,
  Volume2 as VolumeHeaderIcon,
  Maximize,
  Minimize,
  Maximize2
} from 'lucide-react'
import { VoiceControls } from './VoiceControls'
import { User } from '../../types'
import { UserAvatar } from '../common/UserAvatar'
import { useServerStore } from '../../stores/useServerStore'
import { useChannelStore } from '../../stores/useChannelStore'
import { useVoiceStore } from '../../stores/useVoiceStore'
import { ParticipantVolumePopover } from './ParticipantVolumePopover'
import { Room } from 'livekit-client'

interface VoiceAreaProps {
  currentUser: User | null
  remoteParticipants: string[]
  activeVoiceChannelId: string | null
  viewingChannelId: string | null
  isMuted: boolean
  isDeafened: boolean
  isSharingScreen: boolean
  room?: Room | null
  channelTitle?: string
  isDM?: boolean
  onOpenChat?: () => void
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
  room,
  channelTitle,
  isDM,
  onOpenChat,
  onToggleMute,
  onToggleDeafen,
  onShareScreen,
  onLeaveCall
}) => {
  const voiceAreaRef = useRef<HTMLDivElement>(null)
  const [volumePopoverIdentity, setVolumePopoverIdentity] = useState<string | null>(null)
  const [isCallFullscreen, setIsCallFullscreen] = useState(false)
  const { activeServerId, serverMembersCache } = useServerStore()
  const { dmChannels } = useChannelStore()
  const { userVolumes } = useVoiceStore()

  // Listener para atualização do estado de Fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsCallFullscreen(document.fullscreenElement === voiceAreaRef.current)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Atalho de Teclado 'F' para alternar tela cheia da chamada
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'f' || e.key === 'F') &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        toggleCallFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Efeito para reanexar faixas de vídeo locais e remotas ao montar ou quando a lista de participantes mudar
  useEffect(() => {
    if (!room) return

    // 1. Anexar faixas de vídeo locais (compartilhamento de tela ou câmera)
    if (room.localParticipant) {
      room.localParticipant.videoTrackPublications.forEach((pub: any) => {
        if (pub.track) {
          const container = document.getElementById('tile-local')
          if (container && !document.getElementById(`track-${pub.track.sid}`)) {
            const el = pub.track.attach()
            el.id = `track-${pub.track.sid}`
            el.style.width = '100%'
            el.style.height = '100%'
            el.style.objectFit = 'contain'
            el.style.position = 'absolute'
            el.style.top = '0'
            el.style.left = '0'
            el.style.zIndex = '10'
            el.style.backgroundColor = 'black'
            container.appendChild(el)
          }
        }
      })
    }

    // 2. Anexar faixas de vídeo remotas (compartilhamento de tela de outros participantes)
    room.remoteParticipants.forEach((participant: any) => {
      participant.videoTrackPublications.forEach((pub: any) => {
        if (pub.track) {
          const container = document.getElementById(`tile-${participant.identity}`)
          if (container && !document.getElementById(`track-${pub.track.sid}`)) {
            const el = pub.track.attach()
            el.id = `track-${pub.track.sid}`
            el.style.width = '100%'
            el.style.height = '100%'
            el.style.objectFit = 'contain'
            el.style.position = 'absolute'
            el.style.top = '0'
            el.style.left = '0'
            el.style.zIndex = '10'
            el.style.backgroundColor = 'black'
            container.appendChild(el)
          }
        }
      })
    })
  }, [room, remoteParticipants, isSharingScreen])

  const toggleCallFullscreen = () => {
    if (!document.fullscreenElement) {
      voiceAreaRef.current?.requestFullscreen().catch((err) => console.error('Erro fullscreen call:', err))
    } else {
      document.exitFullscreen().catch((err) => console.error('Erro exit fullscreen:', err))
    }
  }

  const toggleTileFullscreen = (tileId: string) => {
    const el = document.getElementById(tileId)
    if (!el) return

    if (document.fullscreenElement === el) {
      document.exitFullscreen().catch((err) => console.error('Erro exit fullscreen tile:', err))
    } else {
      el.requestFullscreen().catch((err) => console.error('Erro fullscreen tile:', err))
    }
  }

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
    <div
      ref={voiceAreaRef}
      className="flex-1 bg-[#111214] relative flex flex-col h-full overflow-hidden z-0 select-none"
    >
      {/* Cabeçalho da Área de Voz / Chamada */}
      <div className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 shadow-sm flex-shrink-0 z-20 bg-[#313338]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 font-semibold text-white text-[15px]">
          <span className="text-discord-textMuted flex items-center">
            {isDM ? <AtSign size={20} /> : <VolumeHeaderIcon size={20} />}
          </span>
          <span>{channelTitle || 'Chamada de Voz'}</span>
          <span className="text-xs font-normal text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 ml-2">
            Chamada Conectada
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              title="Abrir Chat de Texto"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#35373c] hover:bg-[#404249] text-discord-textNormal hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <MessageSquare size={16} />
              <span>Chat de Texto</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleCallFullscreen}
            title={isCallFullscreen ? 'Sair da Tela Cheia (ESC)' : 'Colocar Chamada em Tela Cheia (F)'}
            className="p-2 rounded bg-[#35373c] hover:bg-[#404249] text-discord-textNormal hover:text-white transition-colors cursor-pointer"
          >
            {isCallFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
          </button>
        </div>
      </div>

      {/* Grid de Vídeo e Participantes */}
      <div className="flex-1 p-6 relative flex flex-col items-center justify-center overflow-hidden bg-black/60">
        <div className="flex flex-wrap justify-center content-center gap-4 w-full h-full max-w-6xl">
          {/* Tile Local */}
          <div
            id="tile-local"
            onDoubleClick={() => toggleTileFullscreen('tile-local')}
            className="relative group bg-[#2b2d31] rounded-xl overflow-hidden flex-1 aspect-video min-w-[300px] max-w-[800px] flex items-center justify-center shadow-2xl border border-[#35373c]/50 cursor-pointer"
            title="Duplo clique para tela cheia da transmissão"
          >
            <UserAvatar
              username={currentUser?.username || 'Você'}
              avatarUrl={currentUser?.avatarUrl}
              size="3xl"
              className="z-0"
            />
            <div className="absolute bottom-3 left-3 bg-black/70 px-2.5 py-1 rounded text-xs text-white z-20 font-medium backdrop-blur-sm">
              Você {isSharingScreen && '• Transmitindo'}
            </div>

            {/* Botão de Tela Cheia no Tile Local */}
            <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleTileFullscreen('tile-local')
                }}
                className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-all shadow-md backdrop-blur-sm cursor-pointer"
                title="Tela Cheia da Transmissão (Duplo clique)"
              >
                <Maximize2 size={16} />
              </button>
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
                onDoubleClick={() => toggleTileFullscreen(`tile-${identity}`)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setVolumePopoverIdentity(isPopoverOpen ? null : identity)
                }}
                className="relative group bg-[#2b2d31] rounded-xl overflow-hidden flex-1 aspect-video min-w-[300px] max-w-[800px] flex items-center justify-center shadow-2xl border border-[#35373c]/50 cursor-pointer"
                title="Duplo clique para tela cheia da transmissão"
              >
                <UserAvatar
                  username={identity}
                  avatarUrl={getParticipantAvatar(identity)}
                  size="3xl"
                  className="z-0"
                />

                {/* Tag com nome no canto inferior esquerdo */}
                <div className="absolute bottom-3 left-3 bg-black/70 px-2.5 py-1 rounded text-xs text-white z-20 font-medium flex items-center gap-1.5 backdrop-blur-sm">
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

                {/* Botões no canto superior direito */}
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                  {/* Botão de Tela Cheia da Transmissão Individual */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTileFullscreen(`tile-${identity}`)
                    }}
                    className="p-2 rounded-full bg-black/50 hover:bg-black/90 text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-md backdrop-blur-sm cursor-pointer"
                    title="Tela Cheia da Transmissão (Duplo clique)"
                  >
                    <Maximize2 size={15} />
                  </button>

                  {/* Botão de Controle de Volume */}
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
            isFullscreen={isCallFullscreen}
            onToggleMute={onToggleMute}
            onToggleDeafen={onToggleDeafen}
            onShareScreen={onShareScreen}
            onToggleFullscreen={toggleCallFullscreen}
            onLeaveCall={onLeaveCall}
          />
        )}
      </div>
    </div>
  )
}
