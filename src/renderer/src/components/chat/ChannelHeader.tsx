import React from 'react'

import { Hash, AtSign, Volume2, Phone } from 'lucide-react'

interface ChannelHeaderProps {
  channelName: string
  isServerChannel: boolean
  isVoiceChannel: boolean
  inCall: boolean
  onStartCall: () => void
}

export const ChannelHeader: React.FC<ChannelHeaderProps> = ({
  channelName,
  isServerChannel,
  isVoiceChannel,
  inCall,
  onStartCall
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
        {!inCall && !isServerChannel && (
          <button
            onClick={onStartCall}
            title="Iniciar Chamada"
            className="text-discord-textMuted hover:text-discord-textNormal p-1.5 rounded hover:bg-[#3f4147] transition-colors cursor-pointer"
          >
            <Phone size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
