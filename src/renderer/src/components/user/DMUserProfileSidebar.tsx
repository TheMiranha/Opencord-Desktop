import React, { useEffect, useState } from 'react'
import { User, UserProfile } from '../../types'
import { useAuthStore } from '../../stores/useAuthStore'
import { UserAvatar } from '../common/UserAvatar'
import { Users, ShieldCheck, Sparkles } from 'lucide-react'

interface DMUserProfileSidebarProps {
  user: User
}

export const DMUserProfileSidebar: React.FC<DMUserProfileSidebarProps> = ({ user }) => {
  const { apiUrl, token } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (!user?.id) return

    let isMounted = true

    fetch(`${apiUrl}/user/${user.id}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao buscar perfil')
        return res.json()
      })
      .then((json) => {
        if (isMounted) {
          const data: UserProfile = json.data || json
          setProfile(data)
        }
      })
      .catch((err) => {
        console.error('Falha ao carregar perfil do usuário:', err)
      })

    return () => {
      isMounted = false
    }
  }, [user.id, apiUrl, token])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data indisponível'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const mutualFriendsCount = profile?.mutualFriendsCount ?? 0
  const mutualServers = profile?.mutualServers || []
  const mutualServersCount = profile?.mutualServersCount ?? mutualServers.length
  const bioText = profile?.bio || user.bio

  return (
    <div className="w-[300px] bg-[#111214] border-l border-[#1e1f22] flex flex-col h-full overflow-y-auto custom-scrollbar select-none flex-shrink-0 animate-in fade-in duration-200">
      {/* Banner de Topo com Gradiente */}
      <div className="h-28 bg-gradient-to-br from-[#5865F2]/50 via-[#313338] to-[#111214] w-full relative flex-shrink-0" />

      {/* Avatar e Corpo do Perfil */}
      <div className="px-4 pb-4 flex flex-col gap-3 relative">
        {/* Avatar grande com sobreposição */}
        <div className="-mt-10 mb-1 flex items-end justify-between">
          <div className="relative border-[5px] border-[#111214] rounded-full bg-[#111214] shadow-xl">
            <UserAvatar
              username={user.username}
              avatarUrl={profile?.avatarUrl || user.avatarUrl}
              size="lg"
              status="online"
            />
          </div>
        </div>

        {/* Card Principal de Perfil */}
        <div className="bg-[#232428] rounded-xl p-3.5 border border-[#2e3035] flex flex-col gap-3 shadow-lg">
          {/* Nome e Badges */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-lg leading-tight truncate">
                {user.username}
              </span>
              <div className="flex items-center gap-1">
                <span title="Membro Verificado">
                  <ShieldCheck size={16} className="text-discord-blurple" />
                </span>
                <span title="Opencord Early User">
                  <Sparkles size={16} className="text-amber-400" />
                </span>
              </div>
            </div>
            <span className="text-xs text-discord-textMuted font-medium mt-0.5">
              {user.username.toLowerCase()}
            </span>
          </div>

          {/* Resumo de Conexões Mútuas */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-discord-textMuted pt-0.5 border-t border-[#35373c]/50">
            <Users size={13} className="text-discord-textMuted flex-shrink-0" />
            <span className="truncate">
              {mutualFriendsCount} amigo{mutualFriendsCount !== 1 ? 's' : ''} mútuo{mutualFriendsCount !== 1 ? 's' : ''} •{' '}
              {mutualServersCount} servidor{mutualServersCount !== 1 ? 'es' : ''} mútuo{mutualServersCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="h-[1px] bg-[#35373c]/60 w-full" />

          {/* Sobre Mim / Biografia */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-discord-textMuted uppercase tracking-wider">
              Sobre Mim
            </span>
            {bioText && bioText.trim() ? (
              <div className="bg-[#111214]/60 p-2.5 rounded-lg border border-[#1e1f22] text-xs text-discord-textNormal leading-relaxed whitespace-pre-wrap font-sans break-words max-h-40 overflow-y-auto">
                {bioText}
              </div>
            ) : (
              <p className="text-xs text-discord-textMuted italic bg-[#111214]/30 p-2 rounded border border-[#1e1f22]/50">
                Nenhuma biografia informada.
              </p>
            )}
          </div>

          <div className="h-[1px] bg-[#35373c]/60 w-full" />

          {/* Membro Desde */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-discord-textMuted uppercase tracking-wider">
              Membro Desde
            </span>
            <span className="text-xs font-semibold text-white">
              {formatDate(profile?.createdAt || user.createdAt)}
            </span>
          </div>

          {/* Servidores em Comum */}
          {mutualServers.length > 0 && (
            <>
              <div className="h-[1px] bg-[#35373c]/60 w-full" />
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-discord-textMuted uppercase tracking-wider">
                  Servidores em Comum ({mutualServers.length})
                </span>
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                  {mutualServers.map((server) => (
                    <div
                      key={server.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#2e3035] transition-colors group cursor-default"
                    >
                      {server.iconUrl ? (
                        <img
                          src={server.iconUrl}
                          alt={server.name}
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-discord-blurple flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                          {server.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs text-discord-textNormal group-hover:text-white font-medium truncate">
                        {server.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
