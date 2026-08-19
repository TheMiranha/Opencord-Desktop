import React from 'react'
import { useAuthStore } from '../../stores/useAuthStore'
import { useVoiceStore } from '../../stores/useVoiceStore'
import { useModalStore } from '../../stores/useModalStore'

import { Mic, MicOff, Headphones, Settings } from 'lucide-react'
import { UserAvatar } from '../common/UserAvatar'

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
    <div className="w-full h-[54px] bg-[#111214] rounded-xl border border-[#1e1f22]/90 shadow-2xl px-2 py-1.5 flex items-center justify-between select-none backdrop-blur-md">
      {/* Área do Usuário Clicável */}
      <button
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className="flex items-center gap-2.5 min-w-0 flex-1 px-1.5 py-1 rounded-lg hover:bg-[#2b2d31]/80 transition-colors text-left cursor-pointer group"
        title="Abrir Configurações de Usuário"
      >
        <div className="relative flex-shrink-0">
          <UserAvatar
            username={currentUser?.username}
            avatarUrl={currentUser?.avatarUrl}
            size="sm"
            status="online"
          />
        </div>
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          <span className="text-[13.5px] font-bold text-[#f2f3f5] truncate leading-tight group-hover:text-white">
            {currentUser?.username || 'Usuário'}
          </span>
          <span className="text-[11px] text-[#949ba4] truncate leading-tight group-hover:text-[#dbdee1]">
            Online
          </span>
        </div>
      </button>

      {/* Botões de Ação Rápida */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {/* Botão Microfone */}
        <button
          type="button"
          onClick={onToggleMute}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer relative flex items-center justify-center ${
            isMuted
              ? 'text-[#f23f43] bg-[#f23f43]/15 hover:bg-[#f23f43]/25'
              : 'text-[#b5bac1] hover:text-[#dbdee1] hover:bg-[#2b2d31]'
          }`}
          title={isMuted ? 'Desmutar (Microfone mutado)' : 'Mutar'}
        >
          {isMuted ? <MicOff size={19} strokeWidth={2.2} /> : <Mic size={19} strokeWidth={2.2} />}
        </button>

        {/* Botão Fone / Ensurdecer */}
        <button
          type="button"
          onClick={onToggleDeafen}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer relative flex items-center justify-center ${
            isDeafened
              ? 'text-[#f23f43] bg-[#f23f43]/15 hover:bg-[#f23f43]/25'
              : 'text-[#b5bac1] hover:text-[#dbdee1] hover:bg-[#2b2d31]'
          }`}
          title={isDeafened ? 'Desativar ensurdecer' : 'Ensurdecer (Mutar geral)'}
        >
          <Headphones size={19} strokeWidth={2.2} />
          {isDeafened && (
            <span className="absolute w-[18px] h-[2px] bg-[#f23f43] rotate-45 pointer-events-none rounded-full" />
          )}
        </button>

        {/* Botão Configurações */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="p-1.5 rounded-lg text-[#b5bac1] hover:text-[#dbdee1] hover:bg-[#2b2d31] transition-colors cursor-pointer flex items-center justify-center group"
          title="Configurações de Usuário"
        >
          <Settings size={19} strokeWidth={2.2} className="group-hover:rotate-45 transition-transform duration-300" />
        </button>
      </div>
    </div>
  )
}
