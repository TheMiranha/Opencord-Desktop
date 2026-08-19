import React, { useState, useEffect } from 'react'
import {
  X,
  Shield,
  Users,
  Ban,
  Link,
  Plus,
  Trash2,
  GripVertical,
  Check,
  UserMinus,
  UserX,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { useServerStore } from '../../stores/useServerStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { useModalStore } from '../../stores/useModalStore'
import { ServerRole, ServerBan, ServerMember, ServerInvite, SERVER_PERMISSIONS } from '../../types'
import { UserAvatar } from '../common/UserAvatar'

const COLOR_PRESETS = [
  '#99aab5', // Default Gray
  '#5865f2', // Blurple
  '#57f287', // Green
  '#fee75c', // Yellow
  '#eb459e', // Fuchsia
  '#ed4245', // Red
  '#3498db', // Blue
  '#9b59b6', // Purple
  '#e67e22', // Orange
  '#1abc9c', // Teal
  '#e91e63', // Pink
  '#2ecc71'  // Emerald
]

const PERMISSION_DEFINITIONS = [
  {
    flag: SERVER_PERMISSIONS.ADMINISTRATOR,
    name: 'Administrador',
    description: 'Concede todas as permissões irrestritas ao usuário.'
  },
  {
    flag: SERVER_PERMISSIONS.MANAGE_SERVER,
    name: 'Gerenciar Servidor',
    description: 'Permite alterar o nome e configurações do servidor.'
  },
  {
    flag: SERVER_PERMISSIONS.MANAGE_ROLES,
    name: 'Gerenciar Cargos',
    description: 'Permite criar, editar e excluir cargos abaixo deste na hierarquia.'
  },
  {
    flag: SERVER_PERMISSIONS.KICK_MEMBERS,
    name: 'Expulsar Membros (Kick)',
    description: 'Permite expulsar membros do servidor e dos canais.'
  },
  {
    flag: SERVER_PERMISSIONS.BAN_MEMBERS,
    name: 'Banir Membros (Ban)',
    description: 'Permite banir e desbanir membros do servidor.'
  },
  {
    flag: SERVER_PERMISSIONS.CREATE_INVITE,
    name: 'Criar Convites',
    description: 'Permite gerar novos links de convite para este servidor.'
  },
  {
    flag: SERVER_PERMISSIONS.MANAGE_INVITES,
    name: 'Gerenciar Convites',
    description: 'Permite listar e revogar links de convite existentes.'
  }
]

export const ServerSettingsModal: React.FC = () => {
  const { isServerSettingsOpen, setIsServerSettingsOpen } = useModalStore()
  const { servers, activeServerId, serverMembersCache, setServerMembersCache } = useServerStore()
  const { token, apiUrl } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'roles' | 'members' | 'bans' | 'invites'>('roles')
  const [roles, setRoles] = useState<ServerRole[]>([])
  const [selectedRole, setSelectedRole] = useState<ServerRole | null>(null)
  const [roleName, setRoleName] = useState('')
  const [roleColor, setRoleColor] = useState('#99aab5')
  const [rolePermissions, setRolePermissions] = useState<number>(0)
  const [isSavingRole, setIsSavingRole] = useState(false)
  const [draggedRoleIndex, setDraggedRoleIndex] = useState<number | null>(null)

  // Members tab
  const [memberSearch, setMemberSearch] = useState('')
  const [roleDropdownMemberId, setRoleDropdownMemberId] = useState<string | null>(null)

  // Kick & Ban modals
  const [actionTargetMember, setActionTargetMember] = useState<ServerMember | null>(null)
  const [actionType, setActionType] = useState<'kick' | 'ban' | null>(null)
  const [banReason, setBanReason] = useState('')
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)

  // Bans tab
  const [bans, setBans] = useState<ServerBan[]>([])
  const [isLoadingBans, setIsLoadingLoadingBans] = useState(false)

  // Invites tab
  const [invites, setInvites] = useState<ServerInvite[]>([])
  const [isLoadingInvites, setIsLoadingInvites] = useState(false)

  const activeServer = servers.find((s) => s.id === activeServerId)
  const rawMembers = activeServerId ? serverMembersCache[activeServerId] : []
  const members: ServerMember[] = Array.isArray(rawMembers) ? rawMembers : []

  const normalizeRole = (item: any): ServerRole => {
    const r = item?.data || item || {}
    return {
      id: r.id || r._id || '',
      serverId: r.serverId || activeServerId || '',
      name: r.name || 'Novo Cargo',
      color: r.color || '#99aab5',
      position: typeof r.position === 'number' ? r.position : 0,
      permissions: typeof r.permissions === 'number' ? r.permissions : 0
    }
  }

  // Escutar tecla ESC para fechar modal ou dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (actionTargetMember) {
          setActionTargetMember(null)
          setActionType(null)
        } else if (roleDropdownMemberId) {
          setRoleDropdownMemberId(null)
        } else if (isServerSettingsOpen) {
          setIsServerSettingsOpen(false)
        }
      }
    }

    if (isServerSettingsOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isServerSettingsOpen, actionTargetMember, roleDropdownMemberId])

  // Carregar dados ao abrir o modal
  useEffect(() => {
    if (isServerSettingsOpen && activeServerId && token) {
      loadRoles()
      loadMembers()
      loadBans()
      loadInvites()
    }
  }, [isServerSettingsOpen, activeServerId, token])

  const loadRoles = async () => {
    try {
      const res = await fetch(`${apiUrl}/server/${activeServerId}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const rawList = Array.isArray(data) ? data : data.data || []
        const rolesList: ServerRole[] = rawList
          .map(normalizeRole)
          .filter((r: ServerRole) => Boolean(r.id))
        setRoles(rolesList)
        if (rolesList.length > 0) {
          selectRole(rolesList[0])
        }
      }
    } catch (err) {
      console.error('Erro ao carregar cargos:', err)
    }
  }

  const loadMembers = async () => {
    try {
      const res = await fetch(`${apiUrl}/server/${activeServerId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const membersList: ServerMember[] = Array.isArray(data) ? data : data.data || []
        if (activeServerId) {
          setServerMembersCache((prev) => ({ ...prev, [activeServerId]: membersList }))
        }
      }
    } catch (err) {
      console.error('Erro ao carregar membros:', err)
    }
  }

  const loadBans = async () => {
    setIsLoadingLoadingBans(true)
    try {
      const res = await fetch(`${apiUrl}/server/${activeServerId}/bans`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const bansList: ServerBan[] = Array.isArray(data) ? data : data.data || []
        setBans(bansList)
      }
    } catch (err) {
      console.error('Erro ao carregar banimentos:', err)
    } finally {
      setIsLoadingLoadingBans(false)
    }
  }

  const loadInvites = async () => {
    setIsLoadingInvites(true)
    try {
      const res = await fetch(`${apiUrl}/server/${activeServerId}/invites`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const invitesList: ServerInvite[] = Array.isArray(data) ? data : data.data || []
        setInvites(invitesList)
      }
    } catch (err) {
      console.error('Erro ao carregar convites:', err)
    } finally {
      setIsLoadingInvites(false)
    }
  }

  const selectRole = (role: ServerRole) => {
    if (!role) return
    setSelectedRole(role)
    setRoleName(role.name || '')
    setRoleColor(role.color || '#99aab5')
    setRolePermissions(role.permissions || 0)
  }

  const handleCreateRole = async () => {
    if (!activeServerId) return
    try {
      const res = await fetch(`${apiUrl}/server/${activeServerId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Novo Cargo',
          color: '#99aab5',
          permissions: 0
        })
      })
      if (res.ok) {
        const data = await res.json()
        const newRole = normalizeRole(data)
        if (newRole.id) {
          setRoles((prev) => [...prev, newRole])
          selectRole(newRole)
        } else {
          loadRoles()
        }
      } else {
        const errText = await res.text()
        console.error('Erro ao criar cargo:', res.status, errText)
      }
    } catch (err) {
      console.error('Erro ao criar cargo:', err)
    }
  }

  const handleSaveRole = async () => {
    if (!selectedRole || !selectedRole.id || !activeServerId) return
    setIsSavingRole(true)
    try {
      const res = await fetch(`${apiUrl}/server/${activeServerId}/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: (roleName || '').trim() || 'Novo Cargo',
          color: roleColor || '#99aab5',
          permissions: rolePermissions || 0
        })
      })
      if (res.ok) {
        const data = await res.json()
        const updated = normalizeRole(data)
        setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        setSelectedRole(updated)
        loadMembers()
      } else {
        const errText = await res.text()
        console.error('Erro ao salvar cargo:', res.status, errText)
      }
    } catch (err) {
      console.error('Erro ao atualizar cargo:', err)
    } finally {
      setIsSavingRole(false)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!activeServerId) return
    try {
      const res = await fetch(`${apiUrl}/server/${activeServerId}/roles/${roleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const remaining = roles.filter((r) => r.id !== roleId)
        setRoles(remaining)
        if (selectedRole?.id === roleId) {
          if (remaining.length > 0) {
            selectRole(remaining[0])
          } else {
            setSelectedRole(null)
          }
        }
        loadMembers()
      }
    } catch (err) {
      console.error('Erro ao deletar cargo:', err)
    }
  }

  // Drag and Drop (DnD) para reordenar cargos
  const handleDragStart = (index: number) => {
    setDraggedRoleIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedRoleIndex === null || draggedRoleIndex === index) return

    const newRoles = [...roles]
    const draggedItem = newRoles[draggedRoleIndex]
    newRoles.splice(draggedRoleIndex, 1)
    newRoles.splice(index, 0, draggedItem)

    // Atualiza posições localmente
    const reordered = newRoles.map((role, idx) => ({
      ...role,
      position: idx
    }))

    setRoles(reordered)
    setDraggedRoleIndex(index)
  }

  const handleDragEnd = async () => {
    setDraggedRoleIndex(null)
    if (!activeServerId) return

    try {
      const payload = {
        roles: roles.map((r, idx) => ({ id: r.id, position: idx }))
      }
      await fetch(`${apiUrl}/server/${activeServerId}/roles/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      loadMembers()
    } catch (err) {
      console.error('Erro ao salvar nova ordem de cargos:', err)
    }
  }

  const togglePermission = (flag: number) => {
    if ((rolePermissions & flag) === flag) {
      setRolePermissions(rolePermissions & ~flag)
    } else {
      setRolePermissions(rolePermissions | flag)
    }
  }

  const handleToggleMemberRole = async (member: ServerMember, role: ServerRole) => {
    if (!activeServerId) return
    const hasRole = member.roles?.some((r) => r.id === role.id)
    const method = hasRole ? 'DELETE' : 'POST'

    try {
      const res = await fetch(
        `${apiUrl}/server/${activeServerId}/members/${member.id}/roles/${role.id}`,
        {
          method,
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      if (res.ok) {
        loadMembers()
      }
    } catch (err) {
      console.error('Erro ao alterar cargo do membro:', err)
    }
  }

  const handleConfirmKickOrBan = async () => {
    if (!actionTargetMember || !activeServerId || !actionType) return
    setIsSubmittingAction(true)

    try {
      if (actionType === 'kick') {
        const res = await fetch(
          `${apiUrl}/server/${activeServerId}/members/${actionTargetMember.id}/kick`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        if (res.ok) {
          loadMembers()
          setActionTargetMember(null)
          setActionType(null)
        }
      } else if (actionType === 'ban') {
        const res = await fetch(
          `${apiUrl}/server/${activeServerId}/members/${actionTargetMember.id}/ban`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ reason: (banReason || '').trim() || 'Banido por moderador' })
          }
        )
        if (res.ok) {
          loadMembers()
          loadBans()
          setActionTargetMember(null)
          setActionType(null)
          setBanReason('')
        }
      }
    } catch (err) {
      console.error(`Erro ao executar ${actionType}:`, err)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  const handleUnban = async (userId: string) => {
    if (!activeServerId) return
    try {
      const res = await fetch(`${apiUrl}/server/${activeServerId}/bans/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setBans((prev) => prev.filter((b) => b.userId !== userId))
      }
    } catch (err) {
      console.error('Erro ao desbanir usuário:', err)
    }
  }

  const handleDeleteInvite = async (code: string) => {
    if (!activeServerId) return
    try {
      const res = await fetch(`${apiUrl}/server/${activeServerId}/invites/${code}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setInvites((prev) => prev.filter((inv) => inv.code !== code))
      }
    } catch (err) {
      console.error('Erro ao excluir convite:', err)
    }
  }

  if (!isServerSettingsOpen) return null

  const filteredMembers = members.filter((m) =>
    (m?.username || '').toLowerCase().includes((memberSearch || '').toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex bg-[#313338] select-none text-discord-textNormal animate-fadeIn">
      {/* Sidebar de Abas */}
      <div className="w-60 bg-[#2b2d31] flex flex-col items-end py-14 pr-6 flex-shrink-0 border-r border-[#202225]/40">
        <div className="w-48 flex flex-col gap-1">
          <div className="px-2 pb-2 text-xs font-bold text-discord-textMuted uppercase tracking-wider truncate">
            {activeServer?.name || 'Servidor'}
          </div>

          <button
            onClick={() => setActiveTab('roles')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded font-medium text-sm transition-colors text-left cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-[#404249] text-white font-semibold'
                : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'
            }`}
          >
            <Shield size={18} />
            Cargos
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded font-medium text-sm transition-colors text-left cursor-pointer ${
              activeTab === 'members'
                ? 'bg-[#404249] text-white font-semibold'
                : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'
            }`}
          >
            <Users size={18} />
            Membros ({members.length})
          </button>

          <button
            onClick={() => setActiveTab('bans')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded font-medium text-sm transition-colors text-left cursor-pointer ${
              activeTab === 'bans'
                ? 'bg-[#404249] text-white font-semibold'
                : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'
            }`}
          >
            <Ban size={18} />
            Banimentos ({bans.length})
          </button>

          <button
            onClick={() => setActiveTab('invites')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded font-medium text-sm transition-colors text-left cursor-pointer ${
              activeTab === 'invites'
                ? 'bg-[#404249] text-white font-semibold'
                : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'
            }`}
          >
            <Link size={18} />
            Convites ({invites.length})
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Botão Fechar ESC */}
        <div className="absolute top-14 right-16 flex flex-col items-center gap-1 z-20">
          <button
            onClick={() => setIsServerSettingsOpen(false)}
            className="w-9 h-9 border-2 border-discord-textMuted/60 hover:border-white rounded-full flex items-center justify-center text-discord-textMuted hover:text-white transition-colors cursor-pointer"
            title="Fechar (ESC)"
          >
            <X size={18} />
          </button>
          <span className="text-[11px] font-bold text-discord-textMuted uppercase tracking-wider">
            ESC
          </span>
        </div>

        {/* ABA CARGOS */}
        {activeTab === 'roles' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Lista de Cargos com DnD */}
            <div className="w-64 bg-[#2e3035] flex flex-col border-r border-[#202225]/40">
              <div className="p-4 border-b border-[#202225]/30 flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-discord-textMuted tracking-wider">
                  Cargos — {roles.length}
                </span>
                <button
                  onClick={handleCreateRole}
                  className="p-1.5 rounded hover:bg-[#35373c] text-discord-textMuted hover:text-white transition-colors cursor-pointer"
                  title="Criar Cargo"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                <p className="text-[11px] text-discord-textMuted px-2 py-1 italic">
                  Arraste para definir a ordem na listagem de membros.
                </p>
                {roles.map((role, idx) => {
                  const isSelected = selectedRole?.id === role.id
                  const displayName = isSelected ? roleName || role.name || 'Novo Cargo' : role.name || 'Novo Cargo'
                  const displayColor = isSelected ? roleColor || role.color || '#99aab5' : role.color || '#99aab5'

                  return (
                    <div
                      key={role.id || `role-${idx}`}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      onClick={() => selectRole(role)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer group transition-colors ${
                        isSelected
                          ? 'bg-[#404249] text-white'
                          : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'
                      }`}
                    >
                      <GripVertical
                        size={14}
                        className="text-discord-textMuted/40 group-hover:text-discord-textMuted cursor-grab"
                      />
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: displayColor }}
                      />
                      <span className="text-sm font-medium truncate flex-1">{displayName}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Painel de Edição do Cargo */}
            {selectedRole ? (
              <div className="flex-1 overflow-y-auto p-10 max-w-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Editar Cargo — {selectedRole.name}</h2>
                    <p className="text-xs text-discord-textMuted mt-1">
                      Configure a cor, a tag e as permissões atribuídas a este cargo.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteRole(selectedRole.id)}
                    className="p-2 rounded hover:bg-discord-danger/20 text-discord-danger transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                    title="Excluir Cargo"
                  >
                    <Trash2 size={15} />
                    Excluir
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Nome do Cargo */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-discord-textMuted tracking-wider mb-2">
                      Nome do Cargo
                    </label>
                    <input
                      type="text"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      className="w-full bg-[#1e1f22] text-white text-sm px-3 py-2 rounded border border-[#202225] focus:outline-none focus:border-discord-blurple transition-colors"
                      maxLength={100}
                    />
                  </div>

                  {/* Cor e Tag do Cargo */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-discord-textMuted tracking-wider mb-2">
                      Cor do Cargo & Visualização da Tag
                    </label>
                    <div className="flex items-center gap-4 mb-4">
                      {/* Seletor Custom Hex */}
                      <input
                        type="color"
                        value={roleColor}
                        onChange={(e) => setRoleColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={roleColor}
                        onChange={(e) => setRoleColor(e.target.value)}
                        className="w-28 bg-[#1e1f22] text-white text-xs font-mono px-2.5 py-1.5 rounded border border-[#202225] focus:outline-none uppercase"
                        maxLength={7}
                      />

                      {/* Tag Preview */}
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-discord-textMuted">Pré-visualização:</span>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
                          style={{
                            backgroundColor: `${roleColor}20`,
                            color: roleColor,
                            border: `1px solid ${roleColor}60`
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: roleColor }}
                          />
                          {roleName || 'Cargo'}
                        </span>
                      </div>
                    </div>

                    {/* Presets de Cores */}
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setRoleColor(color)}
                          className={`w-7 h-7 rounded-md cursor-pointer transition-transform hover:scale-110 flex items-center justify-center ${
                            roleColor.toLowerCase() === color.toLowerCase()
                              ? 'ring-2 ring-white scale-105'
                              : ''
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {roleColor.toLowerCase() === color.toLowerCase() && (
                            <Check size={14} className="text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Permissões */}
                  <div className="pt-4 border-t border-[#35373c]">
                    <h3 className="text-sm font-bold uppercase text-discord-textMuted tracking-wider mb-4">
                      Permissões do Cargo
                    </h3>
                    <div className="space-y-3">
                      {PERMISSION_DEFINITIONS.map((p) => {
                        const isGranted = (rolePermissions & p.flag) === p.flag
                        return (
                          <div
                            key={p.flag}
                            onClick={() => togglePermission(p.flag)}
                            className="flex items-center justify-between p-3 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] cursor-pointer transition-colors"
                          >
                            <div className="flex flex-col pr-4">
                              <span className="text-sm font-semibold text-white">{p.name}</span>
                              <span className="text-xs text-discord-textMuted">{p.description}</span>
                            </div>
                            <div
                              className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 flex-shrink-0 cursor-pointer ${
                                isGranted ? 'bg-green-500 justify-end' : 'bg-[#4e5058] justify-start'
                              }`}
                            >
                              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Botão Salvar */}
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={handleSaveRole}
                      disabled={isSavingRole || !(roleName || '').trim()}
                      className="bg-discord-blurple hover:bg-discord-blurpleHover disabled:opacity-50 text-white px-6 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      {isSavingRole ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar Alterações'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-discord-textMuted text-sm">
                Selecione ou crie um cargo na lista à esquerda.
              </div>
            )}
          </div>
        )}

        {/* ABA MEMBROS */}
        {activeTab === 'members' && (
          <div className="flex-1 overflow-y-auto p-10 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Membros do Servidor — {members.length}</h2>
                <p className="text-xs text-discord-textMuted mt-1">
                  Gerencie os cargos e realize ações de moderação (Kick / Ban).
                </p>
              </div>
              <input
                type="text"
                placeholder="Buscar membros..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="bg-[#1e1f22] text-white text-xs px-3 py-2 rounded w-56 border border-[#202225] focus:outline-none focus:border-discord-blurple"
              />
            </div>

            <div className="flex flex-col gap-2">
              {filteredMembers.map((member) => (
                <div
                  key={member.id || member.userId}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      username={member.username}
                      avatarUrl={member.avatarUrl}
                      size="md"
                      status="online"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-white font-semibold text-sm truncate">
                        {member.username}
                      </span>
                      {/* Tags dos Cargos do Membro */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {member.roles && member.roles.length > 0 ? (
                          member.roles.map((r) => (
                            <span
                              key={r.id}
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1"
                              style={{
                                backgroundColor: `${r.color || '#99aab5'}25`,
                                color: r.color || '#99aab5',
                                border: `1px solid ${r.color || '#99aab5'}60`
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: r.color || '#99aab5' }}
                              />
                              {r.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-discord-textMuted italic">
                            Sem cargos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações de Cargos e Moderação */}
                  <div className="flex items-center gap-2 relative">
                    {/* Botão Adicionar/Remover Cargos */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setRoleDropdownMemberId(
                            roleDropdownMemberId === member.id ? null : member.id
                          )
                        }
                        className="p-1.5 rounded bg-[#1e1f22] hover:bg-[#404249] text-discord-textMuted hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                        title="Atribuir Cargos"
                      >
                        <Shield size={14} />
                        Cargos
                      </button>

                      {/* Dropdown de Cargos */}
                      {roleDropdownMemberId === member.id && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setRoleDropdownMemberId(null)}
                          />
                          <div className="absolute right-0 top-9 w-48 bg-[#18191c] border border-[#2e3035] rounded-md shadow-xl p-2 z-30 flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-discord-textMuted uppercase px-2 py-1">
                              Atribuir Cargos
                            </span>
                            {roles.length === 0 ? (
                              <span className="text-xs text-discord-textMuted px-2 py-1">
                                Nenhum cargo criado
                              </span>
                            ) : (
                              roles.map((r) => {
                                const has = member.roles?.some((mr) => mr.id === r.id)
                                return (
                                  <button
                                    key={r.id}
                                    onClick={() => handleToggleMemberRole(member, r)}
                                    className="flex items-center justify-between px-2 py-1.5 rounded text-xs hover:bg-[#35373c] text-left cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: r.color || '#99aab5' }}
                                      />
                                      <span className="truncate text-white font-medium">
                                        {r.name}
                                      </span>
                                    </div>
                                    {has && <Check size={14} className="text-green-500" />}
                                  </button>
                                )
                              })
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Botão Kick */}
                    <button
                      onClick={() => {
                        setActionTargetMember(member)
                        setActionType('kick')
                      }}
                      className="p-1.5 rounded hover:bg-amber-500/20 text-amber-400 transition-colors cursor-pointer"
                      title={`Expulsar ${member.username}`}
                    >
                      <UserMinus size={16} />
                    </button>

                    {/* Botão Ban */}
                    <button
                      onClick={() => {
                        setActionTargetMember(member)
                        setActionType('ban')
                      }}
                      className="p-1.5 rounded hover:bg-discord-danger/20 text-discord-danger transition-colors cursor-pointer"
                      title={`Banir ${member.username}`}
                    >
                      <UserX size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA BANIMENTOS */}
        {activeTab === 'bans' && (
          <div className="flex-1 overflow-y-auto p-10 max-w-3xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Usuários Banidos — {bans.length}</h2>
              <p className="text-xs text-discord-textMuted mt-1">
                Usuários banidos são impedidos de entrar neste servidor via convites.
              </p>
            </div>

            {isLoadingBans ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 size={24} className="animate-spin text-discord-blurple" />
              </div>
            ) : bans.length === 0 ? (
              <div className="p-8 text-center text-discord-textMuted text-sm bg-[#2b2d31] rounded-lg">
                Nenhum usuário banido neste servidor.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {bans.map((ban) => (
                  <div
                    key={ban.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#2b2d31] border border-[#202225]/40 hover:border-[#35373c] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        username={ban.username}
                        avatarUrl={ban.avatarUrl}
                        size="md"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-semibold text-sm truncate">
                          {ban.username}
                        </span>
                        <span className="text-xs text-discord-danger">
                          Motivo: {ban.reason || 'Sem motivo informado'}
                        </span>
                        <span className="text-[11px] text-discord-textMuted">
                          Banido por {ban.bannedByName} em {new Date(ban.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnban(ban.userId)}
                      className="bg-[#248046] hover:bg-[#1a6335] text-white px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      Desbanir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA CONVITES */}
        {activeTab === 'invites' && (
          <div className="flex-1 overflow-y-auto p-10 max-w-3xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Convites do Servidor — {invites.length}</h2>
              <p className="text-xs text-discord-textMuted mt-1">
                Links de convite gerados para novos membros entrarem no servidor.
              </p>
            </div>

            {isLoadingInvites ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 size={24} className="animate-spin text-discord-blurple" />
              </div>
            ) : invites.length === 0 ? (
              <div className="p-8 text-center text-discord-textMuted text-sm bg-[#2b2d31] rounded-lg">
                Nenhum convite ativo encontrado.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {invites.map((inv) => (
                  <div
                    key={inv.id || inv.code}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#2b2d31] border border-[#202225]/40"
                  >
                    <div className="flex flex-col">
                      <span className="text-white font-mono font-bold text-sm tracking-wider">
                        {inv.code}
                      </span>
                      <span className="text-xs text-discord-textMuted">
                        Criado por {inv.inviterUsername} em{' '}
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteInvite(inv.code)}
                      className="p-2 rounded hover:bg-discord-danger/20 text-discord-danger transition-colors cursor-pointer"
                      title="Revogar Convite"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO PARA KICK OU BAN */}
      {actionTargetMember && actionType && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 animate-fadeIn">
          <div className="w-[440px] bg-[#313338] rounded-lg shadow-2xl overflow-hidden border border-[#202225] animate-scaleUp">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle
                  size={24}
                  className={actionType === 'kick' ? 'text-amber-400' : 'text-discord-danger'}
                />
                <h3 className="text-lg font-bold text-white">
                  {actionType === 'kick'
                    ? `Expulsar @${actionTargetMember.username}?`
                    : `Banir @${actionTargetMember.username}?`}
                </h3>
              </div>

              <p className="text-xs text-discord-textMuted mb-4">
                {actionType === 'kick'
                  ? `Tem certeza de que deseja expulsar ${actionTargetMember.username} do servidor? Ele poderá voltar se receber outro convite.`
                  : `Tem certeza de que deseja banir ${actionTargetMember.username}? Ele será expulso imediatamente e não poderá mais entrar no servidor com nenhum convite.`}
              </p>

              {actionType === 'ban' && (
                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase text-discord-textMuted tracking-wider mb-2">
                    Motivo do Banimento (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Desrespeitou as regras do servidor"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full bg-[#1e1f22] text-white text-xs px-3 py-2 rounded border border-[#202225] focus:outline-none focus:border-discord-blurple"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setActionTargetMember(null)
                    setActionType(null)
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white hover:underline cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmKickOrBan}
                  disabled={isSubmittingAction}
                  className={`px-5 py-2 rounded text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer ${
                    actionType === 'kick'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-discord-danger hover:bg-red-700'
                  }`}
                >
                  {isSubmittingAction ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : actionType === 'kick' ? (
                    'Expulsar'
                  ) : (
                    'Banir'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
