import React, { useState } from 'react'
import { useServerStore } from '../../stores/useServerStore'
import { useModalStore } from '../../stores/useModalStore'

import { ChevronDown, UserPlus, Settings, PlusCircle } from 'lucide-react'

export const ServerHeader: React.FC = () => {
  const { servers, activeServerId } = useServerStore()
  const { setIsInviteModalOpen, setIsServerSettingsOpen, openCreateChannelModal } = useModalStore()
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false)

  const currentServer = servers.find((s) => s.id === activeServerId)
  if (!currentServer) return null

  return (
    <div className="relative flex-shrink-0">
      <div
        onClick={() => setIsServerMenuOpen((prev) => !prev)}
        className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 shadow-sm font-bold text-[15px] text-white cursor-pointer hover:bg-[#35373c]/60 transition-colors select-none group"
      >
        <span className="truncate">{currentServer.name}</span>
        <ChevronDown
          size={18}
          className={`text-discord-textMuted group-hover:text-white transition-transform duration-200 ${
            isServerMenuOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </div>

      {isServerMenuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsServerMenuOpen(false)}></div>
          <div className="absolute top-13 left-2 right-2 z-40 bg-[#111214] rounded-md p-1.5 shadow-2xl border border-[#232428] flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
            <button
              type="button"
              onClick={() => {
                setIsServerMenuOpen(false)
                setIsInviteModalOpen(true)
              }}
              className="flex items-center justify-between px-2.5 py-2 rounded text-sm font-medium text-discord-blurple hover:bg-discord-blurple hover:text-white transition-colors cursor-pointer group"
            >
              <span>Convidar Pessoas</span>
              <UserPlus size={18} />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsServerMenuOpen(false)
                openCreateChannelModal('SERVER_TEXT')
              }}
              className="flex items-center justify-between px-2.5 py-2 rounded text-sm font-medium text-discord-textNormal hover:bg-[#35373c] hover:text-white transition-colors cursor-pointer group"
            >
              <span>Criar Canal</span>
              <PlusCircle size={18} className="text-discord-textMuted group-hover:text-white" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsServerMenuOpen(false)
                setIsServerSettingsOpen(true)
              }}
              className="flex items-center justify-between px-2.5 py-2 rounded text-sm font-medium text-discord-textNormal hover:bg-[#35373c] hover:text-white transition-colors cursor-pointer group"
            >
              <span>Configurações do Servidor</span>
              <Settings size={18} className="text-discord-textMuted group-hover:text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
