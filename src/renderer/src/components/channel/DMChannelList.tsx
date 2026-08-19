import React from 'react'
import { useChannelStore } from '../../stores/useChannelStore'
import { useAuthStore } from '../../stores/useAuthStore'

import { Users } from 'lucide-react'
import { UserAvatar } from '../common/UserAvatar'

interface DMChannelListProps {
  onSelectChannel: (channelId: string) => void
}

export const DMChannelList: React.FC<DMChannelListProps> = ({ onSelectChannel }) => {
  const { dmChannels, searchTerm, setSearchTerm, viewingChannelId } = useChannelStore()
  const { currentUser } = useAuthStore()

  const filteredChannels = dmChannels.filter((ch) => {
    const friend = ch.members?.find((m) => m.id !== currentUser?.id)
    return friend?.username.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <>
      <div className="h-12 border-b border-[#1e1f22] flex items-center px-4 shadow-sm font-semibold text-[15px]">
        Mensagens Diretas
      </div>

      <div className="p-2 pb-0">
        <div className="bg-[#1e1f22] rounded px-2 py-1 flex items-center">
          <input
            type="text"
            placeholder="Encontrar uma conversa"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent w-full text-xs text-white outline-none placeholder-discord-textMuted py-1"
          />
        </div>
      </div>

      <div className="p-2 pt-2">
        <button
          onClick={() => onSelectChannel('')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${
            viewingChannelId === null
              ? 'bg-[#404249] text-white'
              : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'
          }`}
        >
          <Users size={20} />
          Amigos
        </button>
      </div>

      <div className="px-3 pt-2 pb-1 text-[12px] font-bold text-discord-textMuted uppercase tracking-wider">
        Conversas Diretas
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-28 flex flex-col gap-0.5">
        {filteredChannels.map((ch) => {
          const chFriend = ch.members?.find((m) => m.id !== currentUser?.id)
          const name = chFriend ? chFriend.username : 'Desconhecido'
          const isSelected = viewingChannelId === ch.id

          return (
            <div
              key={ch.id}
              onClick={() => onSelectChannel(ch.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-[#404249] text-white'
                  : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'
              }`}
            >
              <UserAvatar
                username={name}
                avatarUrl={chFriend?.avatarUrl}
                size="sm"
                status="online"
              />
              <span className="truncate font-medium text-sm">{name}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}
