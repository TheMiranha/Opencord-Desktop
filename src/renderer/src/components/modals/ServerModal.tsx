import React, { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useModalStore } from '../../stores/useModalStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { useServerStore } from '../../stores/useServerStore'

export const ServerModal: React.FC = () => {
  const { isServerModalOpen, serverModalTab, setIsServerModalOpen, setServerModalTab } =
    useModalStore()
  const { apiUrl, token } = useAuthStore()
  const { setServers, setActiveServerId } = useServerStore()

  const [newServerName, setNewServerName] = useState('')
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isJoiningServer, setIsJoiningServer] = useState(false)
  const [isCreatingServer, setIsCreatingServer] = useState(false)

  if (!isServerModalOpen) return null

  const handleClose = () => {
    setIsServerModalOpen(false)
    setServerModalTab('create')
    setNewServerName('')
    setInviteCodeInput('')
    setInviteError(null)
  }

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newServerName.trim() || isCreatingServer) return
    setIsCreatingServer(true)

    try {
      const res = await fetch(`${apiUrl}/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newServerName.trim() })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Não foi possível criar o servidor')

      const newServer = json.data || json

      const srvRes = await fetch(`${apiUrl}/server/@me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (srvRes.ok) {
        const srvData = await srvRes.json()
        setServers(srvData.data || (Array.isArray(srvData) ? srvData : []))
      }

      handleClose()
      if (newServer?.id) {
        setActiveServerId(newServer.id)
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsCreatingServer(false)
    }
  }

  const handleJoinServer = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = inviteCodeInput.trim()
    if (!cleanCode || isJoiningServer) return

    setIsJoiningServer(true)
    setInviteError(null)

    try {
      let targetServerId: string | null = null
      try {
        const detailsRes = await fetch(`${apiUrl}/server/invites/${cleanCode}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (detailsRes.ok) {
          const detailsJson = await detailsRes.json()
          const details = detailsJson.data || detailsJson
          targetServerId = details.serverId
        }
      } catch (e) {
        console.warn('Não foi possível buscar detalhes do convite:', e)
      }

      const res = await fetch(`${apiUrl}/server/invites/${cleanCode}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        let errorMsg = 'Convite inválido ou expirado'
        try {
          const errData = await res.json()
          if (errData.message) errorMsg = errData.message
        } catch {}
        throw new Error(errorMsg)
      }

      const srvRes = await fetch(`${apiUrl}/server/@me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (srvRes.ok) {
        const srvData = await srvRes.json()
        const serverList = srvData.data || (Array.isArray(srvData) ? srvData : [])
        setServers(serverList)

        if (targetServerId) {
          setActiveServerId(targetServerId)
        } else if (serverList.length > 0) {
          setActiveServerId(serverList[serverList.length - 1].id)
        }
      }

      handleClose()
    } catch (err: any) {
      setInviteError(err.message || 'Erro ao entrar no servidor')
    } finally {
      setIsJoiningServer(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1f22]/80 backdrop-blur-sm flex justify-center items-center p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-[440px] bg-[#313338] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-[#232428]">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-discord-textMuted hover:text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Abas */}
        <div className="flex border-b border-[#232428] pt-3 px-6 gap-4">
          <button
            type="button"
            onClick={() => {
              setServerModalTab('create')
              setInviteError(null)
            }}
            className={`pb-3 font-semibold text-sm transition-colors relative cursor-pointer ${
              serverModalTab === 'create' ? 'text-white' : 'text-discord-textMuted hover:text-discord-textNormal'
            }`}
          >
            Criar um Servidor
            {serverModalTab === 'create' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-discord-blurple rounded-full"></div>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setServerModalTab('join')
              setInviteError(null)
            }}
            className={`pb-3 font-semibold text-sm transition-colors relative cursor-pointer ${
              serverModalTab === 'join' ? 'text-white' : 'text-discord-textMuted hover:text-discord-textNormal'
            }`}
          >
            Entrar em um Servidor
            {serverModalTab === 'join' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-discord-blurple rounded-full"></div>
            )}
          </button>
        </div>

        {serverModalTab === 'create' ? (
          <>
            <div className="p-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Criar seu servidor</h2>
              <p className="text-discord-textMuted text-[15px]">
                Seu servidor é onde você e seus amigos se reúnem. Crie o seu e comece a conversar.
              </p>
            </div>
            <form onSubmit={handleCreateServer} className="px-6 pb-6 flex flex-col">
              <label className="text-xs font-bold uppercase text-discord-textMuted mb-2">Nome do Servidor</label>
              <input
                type="text"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                className="w-full bg-[#1e1f22] border border-[#111214] rounded p-2.5 text-white outline-none focus:border-discord-link transition-colors"
                placeholder="Servidor do usuário"
                autoFocus
                required
              />
              <div className="mt-8 flex justify-between items-center bg-[#2b2d31] -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setServerModalTab('join')}
                  className="text-white hover:underline text-sm font-medium cursor-pointer"
                >
                  Já tem um convite?
                </button>
                <button
                  type="submit"
                  disabled={!newServerName.trim() || isCreatingServer}
                  className="px-6 py-2.5 rounded bg-discord-blurple font-semibold text-white transition-colors hover:bg-discord-blurpleHover disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isCreatingServer && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Criar
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="p-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Entrar em um servidor</h2>
              <p className="text-discord-textMuted text-[15px]">
                Insira um código de convite abaixo para se juntar a um servidor existente.
              </p>
            </div>
            <form onSubmit={handleJoinServer} className="px-6 pb-6 flex flex-col">
              <label className="text-xs font-bold uppercase text-discord-textMuted mb-2">
                Código de Convite <span className="text-discord-danger">*</span>
              </label>
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => {
                  setInviteCodeInput(e.target.value)
                  if (inviteError) setInviteError(null)
                }}
                className="w-full bg-[#1e1f22] border border-[#111214] rounded p-2.5 text-white outline-none focus:border-discord-link transition-colors font-mono"
                placeholder="Ex: a1b2c3d4"
                autoFocus
                required
              />
              <span className="text-[12px] text-discord-textMuted mt-1.5">
                Convites têm códigos como{' '}
                <span className="text-discord-textNormal font-mono font-medium">8b3f12a0</span>
              </span>

              {inviteError && (
                <div className="mt-3 p-2.5 rounded bg-discord-danger/10 border border-discord-danger/30 text-discord-danger text-xs font-medium">
                  {inviteError}
                </div>
              )}

              <div className="mt-8 flex justify-between items-center bg-[#2b2d31] -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setServerModalTab('create')}
                  className="text-white hover:underline text-sm font-medium cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={!inviteCodeInput.trim() || isJoiningServer}
                  className="px-6 py-2.5 rounded bg-discord-blurple font-semibold text-white transition-colors hover:bg-discord-blurpleHover disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isJoiningServer && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Entrar no Servidor
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
