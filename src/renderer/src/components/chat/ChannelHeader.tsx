import React from 'react'
import { Hash, AtSign, Volume2, Phone, Video, PhoneOff } from 'lucide-react'

interface ChannelHeaderProps {
  channelName: string
  isServerChannel: boolean
  isVoiceChannel: boolean
  inCall: boolean
  onStartCall: () => void
  onToggleViewCall?: () => void
  onDisconnectCall?: () => void
}

export const ChannelHeader: React.FC<ChannelHeaderProps> = ({
  channelName,
  isServerChannel,
  isVoiceChannel,
  inCall,
  onStartCall,
  onToggleViewCall,
  onDisconnectCall
}) => {
  return (
    <div className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 shadow-sm flex-shrink-0 z-10 bg-[#313338]">
      <div className="flex items-center gap-2 font-semibold text-white text-[15px]">
        <span className="text-discord-textMuted flex items-center">
          {isVoiceChannel ? (
            <Volume2 size={20} />
          ) : isServerChannel ? (
            <Hash size={20} />
          ) : (
            <AtSign size={20} />
          )}
        </span>
        <span>{channelName}</span>
      </div>

      <div className="flex gap-2 items-center">
        {!isServerChannel && (
          inCall ? (
            <div className="flex items-center gap-1.5 bg-[#2b2d31] p-1 rounded-lg border border-[#35373c]">
              <button
                type="button"
                onClick={onToggleViewCall}
                title="Ver Chamada de Voz / Vídeo"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#23a559] hover:bg-[#1f924e] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Video size={15} />
                <span>Ver Chamada</span>
              </button>

              <button
                type="button"
                onClick={onDisconnectCall}
                title="Desconectar da Chamada"
                className="p-1 rounded text-[#da373c] hover:bg-[#da373c]/20 hover:text-[#f23f43] transition-colors cursor-pointer"
              >
                <PhoneOff size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onStartCall}
              title="Iniciar Chamada"
              className="text-discord-textMuted hover:text-discord-textNormal p-1.5 rounded hover:bg-[#3f4147] transition-colors cursor-pointer"
            >
              <Phone size={20} />
            </button>
          )
        )}
      </div>
    </div>
  )
}
