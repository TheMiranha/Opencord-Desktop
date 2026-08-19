import React from 'react'
import { useVoiceStore } from '../../stores/useVoiceStore'
import { useServerStore } from '../../stores/useServerStore'
import { useChannelStore } from '../../stores/useChannelStore'

import { Radio, PhoneOff, Monitor } from 'lucide-react'

interface VoiceStatusBarProps {
  onDisconnect: () => void
  onShareScreen: () => void
}

export const VoiceStatusBar: React.FC<VoiceStatusBarProps> = ({
  onDisconnect,
  onShareScreen
}) => {
  const { activeVoiceChannelId, isSharingScreen } = useVoiceStore()
  const { servers, serverChannelsCache, activeServerId } = useServerStore()
  const { setViewingChannelId } = useChannelStore()

  if (!activeVoiceChannelId) return null

  // Acha o canal de voz ativo
  const allServerChannels = activeServerId ? serverChannelsCache[activeServerId] || [] : []
  const voiceChannel = allServerChannels.find((c) => c.id === activeVoiceChannelId)
  const activeServer = servers.find((s) => s.id === activeServerId)

  return (
    <div className="bg-[#1e1f22] p-2 flex flex-col gap-2 border-b border-[#2b2d31]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <Radio size={20} className="text-[#23a559] flex-shrink-0 animate-pulse" />
          <div
            className="flex flex-col truncate cursor-pointer"
            onClick={() => setViewingChannelId(activeVoiceChannelId)}
          >
            <span className="text-[#23a559] text-[13px] font-semibold leading-tight hover:underline">
              Voz conectada
            </span>
            <span className="text-discord-textMuted text-[11px] truncate leading-tight hover:text-white transition-colors">
              {activeServer?.name ? `${activeServer.name} / ${voiceChannel?.name || 'Voz'}` : voiceChannel?.name || 'Voz'}
            </span>
          </div>
        </div>
        <button
          onClick={onDisconnect}
          title="Desconectar"
          className="text-discord-textMuted hover:text-[#da373c] p-1.5 rounded hover:bg-[#2b2d31] transition-colors flex-shrink-0 cursor-pointer"
        >
          <PhoneOff size={18} />
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onShareScreen}
          className="flex-1 flex justify-center items-center gap-2 py-1.5 bg-[#2b2d31] rounded text-white text-xs font-medium hover:bg-[#35373c] transition-colors cursor-pointer"
        >
          <Monitor size={14} />
          {isSharingScreen ? 'Parar Tela' : 'Compartilhar Tela'}
        </button>
      </div>
    </div>
  )
}
