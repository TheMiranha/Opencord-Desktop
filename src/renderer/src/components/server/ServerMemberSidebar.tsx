import React from 'react'
import { Crown, Shield } from 'lucide-react'
import { useServerStore } from '../../stores/useServerStore'
import { ServerMember, ServerRole } from '../../types'
import { UserAvatar } from '../common/UserAvatar'

export const ServerMemberSidebar: React.FC = () => {
  const { activeServerId, serverMembersCache } = useServerStore()

  if (!activeServerId) return null

  const rawMembers = activeServerId ? serverMembersCache[activeServerId] : []
  const members: ServerMember[] = Array.isArray(rawMembers) ? rawMembers : []

  // Agrupamento de membros por seu cargo de maior prioridade (menor posição ou maior relevância)
  interface RoleGroup {
    id: string
    name: string
    color?: string
    position: number
    members: ServerMember[]
  }

  // Identificar o cargo principal de cada membro
  const memberPrimaryRoleMap = new Map<string, ServerRole | null>()
  members.forEach((member) => {
    if (!member) return
    if (member.roles && Array.isArray(member.roles) && member.roles.length > 0) {
      // Ordena por posição ascendente
      const sortedRoles = [...member.roles].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      )
      memberPrimaryRoleMap.set(member.id || member.userId, sortedRoles[0])
    } else {
      memberPrimaryRoleMap.set(member.id || member.userId, null)
    }
  })

  // Montar lista de grupos
  const groupsMap = new Map<string, RoleGroup>()
  const unassignedMembers: ServerMember[] = []
  const adminLegacyMembers: ServerMember[] = []

  members.forEach((member) => {
    if (!member) return
    const primaryRole = memberPrimaryRoleMap.get(member.id || member.userId)
    if (primaryRole) {
      if (!groupsMap.has(primaryRole.id)) {
        groupsMap.set(primaryRole.id, {
          id: primaryRole.id,
          name: primaryRole.name,
          color: primaryRole.color,
          position: primaryRole.position ?? 0,
          members: []
        })
      }
      groupsMap.get(primaryRole.id)!.members.push(member)
    } else if (member.role === 'ADMIN') {
      adminLegacyMembers.push(member)
    } else {
      unassignedMembers.push(member)
    }
  })

  // Ordenar grupos de cargos por posição
  const sortedCustomGroups = Array.from(groupsMap.values()).sort(
    (a, b) => a.position - b.position
  )

  return (
    <div className="w-[240px] bg-[#2b2d31] flex flex-col flex-shrink-0 z-10 select-none border-l border-[#1f2023] overflow-y-auto">
      <div className="p-4 pb-8 flex flex-col gap-4">
        {/* Seção Administradores Legados (se houver sem cargo customizado) */}
        {adminLegacyMembers.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="text-[12px] font-bold text-discord-textMuted uppercase tracking-wider px-2 flex items-center gap-1.5">
              <Crown size={14} className="text-[#f0b232]" />
              <span>ADMINISTRADOR — {adminLegacyMembers.length}</span>
            </div>
            {adminLegacyMembers.map((member) => (
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

        {/* Grupos Customizados de Cargos */}
        {sortedCustomGroups.map((group) => (
          <div key={group.id} className="flex flex-col gap-1">
            <div className="text-[12px] font-bold uppercase tracking-wider px-2 flex items-center gap-1.5"
                 style={{ color: group.color || '#99aab5' }}>
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: group.color || '#99aab5' }}
              />
              <span className="truncate">
                {group.name} — {group.members.length}
              </span>
            </div>
            {group.members.map((member) => {
              const primaryRole = memberPrimaryRoleMap.get(member.id || member.userId)
              return (
                <div
                  key={member.id || member.userId}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[#35373c] transition-colors cursor-pointer group"
                >
                  <UserAvatar
                    username={member.username}
                    avatarUrl={member.avatarUrl}
                    size="sm"
                    status="online"
                  />
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span
                      className="text-sm font-medium truncate group-hover:underline"
                      style={{ color: primaryRole?.color || '#ffffff' }}
                    >
                      {member.username}
                    </span>
                    {primaryRole && (
                      <span
                        className="px-1.5 py-0.2 rounded text-[10px] font-bold flex-shrink-0"
                        style={{
                          backgroundColor: `${primaryRole.color || '#99aab5'}25`,
                          color: primaryRole.color || '#99aab5',
                          border: `1px solid ${primaryRole.color || '#99aab5'}50`
                        }}
                      >
                        {primaryRole.name}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* Seção Membros Comuns (sem cargos) */}
        {unassignedMembers.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="text-[12px] font-bold text-discord-textMuted uppercase tracking-wider px-2 flex items-center gap-1.5">
              <Shield size={14} className="text-discord-textMuted" />
              <span>MEMBROS — {unassignedMembers.length}</span>
            </div>
            {unassignedMembers.map((member) => (
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
            ))}
          </div>
        )}

        {members.length === 0 && (
          <div className="px-2 py-4 text-xs text-discord-textMuted text-center">
            Nenhum membro encontrado
          </div>
        )}
      </div>
    </div>
  )
}
