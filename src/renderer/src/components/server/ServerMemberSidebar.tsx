import React from 'react'
import { Crown, Shield } from 'lucide-react'
import { useServerStore } from '../../stores/useServerStore'
import { ServerMember } from '../../types'
import { UserAvatar } from '../common/UserAvatar'

export const ServerMemberSidebar: React.FC = () => {
  const { activeServerId, serverMembersCache } = useServerStore()

  if (!activeServerId) return null

  const members: ServerMember[] = serverMembersCache[activeServerId] || []

  const admins = members.filter((m) => m.role === 'ADMIN')
  const regularMembers = members.filter((m) => m.role !== 'ADMIN')

  return (
    <div className="w-[240px] bg-[#2b2d31] flex flex-col flex-shrink-0 z-10 select-none border-l border-[#1f2023] overflow-y-auto">
      <div className="p-4 flex flex-col gap-4">
        {/* Seção Administradores */}
        {admins.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="text-[12px] font-bold text-discord-textMuted uppercase tracking-wider px-2 flex items-center gap-1.5">
              <Crown size={14} className="text-[#f0b232]" />
              <span>ADMINISTRADOR — {admins.length}</span>
            </div>
            {admins.map((member) => (
              <div
                key={member.id || member.userId}
                className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#35373c] transition-colors cursor-pointer group"
              >
                <UserAvatar
                  username={member.username}
                  avatarUrl={member.avatarUrl}
                  size="sm"
                  status="online"
                />
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-sm font-medium text-white truncate group-hover:text-white">
                    {member.username}
                  </span>
                  <span title="Administrador" className="flex items-center flex-shrink-0">
                    <Crown size={13} className="text-[#f0b232]" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Seção Membros Comuns */}
        <div className="flex flex-col gap-1">
          <div className="text-[12px] font-bold text-discord-textMuted uppercase tracking-wider px-2 flex items-center gap-1.5">
            <Shield size={14} className="text-discord-textMuted" />
            <span>MEMBROS — {regularMembers.length}</span>
          </div>
          {regularMembers.length === 0 && admins.length === 0 ? (
            <div className="px-2 py-4 text-xs text-discord-textMuted text-center">
              Nenhum membro encontrado
            </div>
          ) : (
            regularMembers.map((member) => (
              <div
                key={member.id || member.userId}
                className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#35373c] transition-colors cursor-pointer group"
              >
                <UserAvatar
                  username={member.username}
                  avatarUrl={member.avatarUrl}
                  size="sm"
                  status="online"
                />
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-sm font-medium text-discord-textNormal truncate group-hover:text-white">
                    {member.username}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
