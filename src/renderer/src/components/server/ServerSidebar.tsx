import React from 'react'
import { useServerStore } from '../../stores/useServerStore'
import { useChannelStore } from '../../stores/useChannelStore'
import { useModalStore } from '../../stores/useModalStore'

import { Plus, MessageSquare } from 'lucide-react'

export const ServerSidebar: React.FC = () => {
  const { servers, activeServerId, setActiveServerId, lastVisitedChannel, serverChannelsCache } = useServerStore()
  const { setViewingChannelId } = useChannelStore()
  const { setIsServerModalOpen, setServerModalTab } = useModalStore()

  const handleSelectHome = () => {
    setActiveServerId(null)
    setViewingChannelId(null)
  }

  const handleSelectServer = (serverId: string) => {
    setActiveServerId(serverId)
    const cachedChannelId =
      lastVisitedChannel[serverId] ||
      serverChannelsCache[serverId]?.find((c) => c.type === 'SERVER_TEXT')?.id
    if (cachedChannelId) {
      setViewingChannelId(cachedChannelId)
    }
  }

  const handleOpenAddServer = () => {
    setServerModalTab('create')
    setIsServerModalOpen(true)
  }

  return (
    <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2 flex-shrink-0 overflow-y-auto no-scrollbar z-20">
      {/* Botão Home / DMs */}
      <div
        onClick={handleSelectHome}
        className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-all no-drag group ${
          activeServerId === null
            ? 'bg-discord-blurple rounded-[16px] text-white'
            : 'bg-[#313338] text-discord-textNormal hover:bg-discord-blurple hover:text-white rounded-[24px] hover:rounded-[16px]'
        }`}
        title="Mensagens Diretas"
      >
        <MessageSquare size={24} className="transition-transform group-hover:scale-110" />
      </div>

      <div className="w-8 h-[2px] bg-[#313338] my-1 rounded flex-shrink-0"></div>

      {/* Lista de Servidores */}
      {servers.map((srv) => (
        <div
          key={srv.id}
          onClick={() => handleSelectServer(srv.id)}
          className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-all no-drag overflow-hidden flex-shrink-0 shadow-sm ${
            activeServerId === srv.id
              ? 'bg-discord-blurple rounded-[16px] text-white'
              : 'bg-[#313338] text-discord-textNormal hover:bg-discord-blurple hover:text-white rounded-[24px] hover:rounded-[16px]'
          }`}
          title={srv.name}
        >
          {srv.iconUrl ? (
            <img src={srv.iconUrl} alt={srv.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-sm">{srv.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
      ))}

      {/* Botão Adicionar Servidor */}
      <div
        onClick={handleOpenAddServer}
        className="w-12 h-12 bg-[#313338] text-[#23a559] flex items-center justify-center cursor-pointer transition-all rounded-[24px] hover:rounded-[16px] hover:bg-[#23a559] hover:text-white no-drag mt-2 flex-shrink-0 group"
        title="Adicionar um Servidor"
      >
        <Plus size={24} strokeWidth={2.5} className="transition-transform group-hover:rotate-90 duration-200" />
      </div>
    </div>
  )
}
