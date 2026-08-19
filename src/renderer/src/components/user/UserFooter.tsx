import React from 'react'
import { useAuthStore } from '../../stores/useAuthStore'
import { useVoiceStore } from '../../stores/useVoiceStore'
import { useModalStore } from '../../stores/useModalStore'

import { Mic, MicOff, Headphones, Settings } from 'lucide-react'

interface UserFooterProps {
  onToggleMute: () => void
  onToggleDeafen: () => void
}

export const UserFooter: React.FC<UserFooterProps> = ({
  onToggleMute,
  onToggleDeafen
}) => {
  const { currentUser } = useAuthStore()
  const { isMuted, isDeafened } = useVoiceStore()
  const { setIsSettingsOpen } = useModalStore()

  return (
    <div className="h-[54px] bg-[#232428] mt-auto flex items-center px-2 justify-between flex-shrink-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[#1e1f22] flex items-center justify-center font-bold relative flex-shrink-0 text-white">
          {currentUser?.username?.charAt(0).toUpperCase()}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#232428] rounded-full"></div>
        </div>
        <div className="flex flex-col truncate">
          <span className="text-xs font-bold text-white truncate">{currentUser?.username}</span>
          <span className="text-[10px] text-discord-textMuted truncate">Online</span>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={onToggleMute}
          className={`p-1.5 rounded hover:bg-[#35373c] transition-colors cursor-pointer ${
            isMuted ? 'text-discord-danger' : 'text-discord-textMuted hover:text-discord-textNormal'
          }`}
          title={isMuted ? 'Desmutar' : 'Mutar'}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <button
          onClick={onToggleDeafen}
          className={`p-1.5 rounded hover:bg-[#35373c] transition-colors cursor-pointer ${
            isDeafened ? 'text-discord-danger' : 'text-discord-textMuted hover:text-discord-textNormal'
          }`}
          title={isDeafened ? 'Desativar ensurdecer' : 'Ensurdecer'}
        >
          <Headphones size={18} />
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-1.5 rounded text-discord-textMuted hover:text-discord-textNormal hover:bg-[#35373c] transition-colors cursor-pointer"
          title="Configurações de Usuário"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  )
}
