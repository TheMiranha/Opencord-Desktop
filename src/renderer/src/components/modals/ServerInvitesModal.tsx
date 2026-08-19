import React, { useState, useEffect } from 'react'
import { X, Copy, Check, Trash2, RefreshCw, Plus, Loader2 } from 'lucide-react'
import { useModalStore } from '../../stores/useModalStore'
import { useServerStore } from '../../stores/useServerStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { ServerInvite } from '../../types'

export const ServerInvitesModal: React.FC = () => {
  const { isInviteModalOpen, setIsInviteModalOpen } = useModalStore()
  const { servers, activeServerId } = useServerStore()
  const { apiUrl, token } = useAuthStore()

  const [activeInviteCode, setActiveInviteCode] = useState<string | null>(null)
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false)
  const [inviteGenerateError, setInviteGenerateError] = useState<string | null>(null)
  const [copiedRecent, setCopiedRecent] = useState(false)
  const [serverInvites, setServerInvites] = useState<ServerInvite[]>([])
  const [isLoadingInvites, setIsLoadingInvites] = useState(false)
  const [copiedInviteCode, setCopiedInviteCode] = useState<string | null>(null)
  const [isDeletingInviteCode, setIsDeletingInviteCode] = useState<string | null>(null)

  const activeServer = servers.find((s) => s.id === activeServerId)

  const loadServerInvites = async () => {
    if (!activeServerId) return
    setIsLoadingInvites(true)
    try {
      const res = await fetch(`${apiUrl}/server/${activeServerId}/invites`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        const data = json.data || json
        setServerInvites(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Erro ao carregar convites do servidor:', err)
    } finally {
      setIsLoadingInvites(false)
    }
  }

  useEffect(() => {
    if (isInviteModalOpen && activeServerId) {
      setInviteGenerateError(null)
      setCopiedRecent(false)
      setCopiedInviteCode(null)
      loadServerInvites()
    }
  }, [isInviteModalOpen, activeServerId])

  if (!isInviteModalOpen || !activeServerId) return null

  const handleGenerateNewInvite = async () => {
    setIsGeneratingInvite(true)
    setInviteGenerateError(null)
    setCopiedRecent(false)

    try {
      const res = await fetch(`${apiUrl}/server/${activeServerId}/invites`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      const json = await res.json()

      if (!res.ok) {
        const errMsg = json.message || 'Apenas administradores podem gerar convites'
        throw new Error(errMsg)
      }

      const inviteData = json.data || json
      setActiveInviteCode(inviteData.code)
      await loadServerInvites()
    } catch (err: any) {
      setInviteGenerateError(err.message || 'Não foi possível gerar o código de convite.')
    } finally {
      setIsGeneratingInvite(false)
    }
  }

  const handleDeleteInvite = async (code: string) => {
    setIsDeletingInviteCode(code)
    try {
      const res = await fetch(`${apiUrl}/server/${activeServerId}/invites/${code}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        let errMsg = 'Não foi possível excluir o convite'
        try {
          const json = await res.json()
          if (json.message) errMsg = json.message
        } catch {}
        throw new Error(errMsg)
      }

      setServerInvites((prev) => prev.filter((inv) => inv.code !== code))
      if (activeInviteCode === code) {
        setActiveInviteCode(null)
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsDeletingInviteCode(null)
    }
  }

  const handleCopyCode = async (code: string, isRecent = false) => {
    try {
      await navigator.clipboard.writeText(code)
      if (isRecent) {
        setCopiedRecent(true)
        setTimeout(() => setCopiedRecent(false), 2000)
      } else {
        setCopiedInviteCode(code)
        setTimeout(() => setCopiedInviteCode(null), 2000)
      }
    } catch (err) {
      console.error('Erro ao copiar código:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1f22]/80 backdrop-blur-sm flex justify-center items-center p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-[500px] bg-[#313338] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-[#232428] max-h-[85vh]">
        <button
          onClick={() => setIsInviteModalOpen(false)}
          className="absolute top-4 right-4 text-discord-textMuted hover:text-white transition-colors cursor-pointer z-10"
        >
          <X size={20} />
        </button>
        <div className="p-6 pb-3 flex-shrink-0">
          <h2 className="text-xl font-bold text-white mb-1">Convidar amigos</h2>
          <p className="text-discord-textMuted text-xs uppercase tracking-wider font-semibold">
            Para {activeServer?.name}
          </p>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-4 overflow-y-auto flex-1">
          {/* Seção Gerar Novo Convite */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-discord-textMuted">
                {activeInviteCode ? 'Código Gerado Recentemente' : 'Gerar Novo Código'}
              </label>
              {activeInviteCode && (
                <button
                  type="button"
                  onClick={handleGenerateNewInvite}
                  disabled={isGeneratingInvite}
                  className="text-xs text-discord-link hover:underline cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingInvite ? 'Gerando...' : 'Gerar outro código'}
                </button>
              )}
            </div>

            {activeInviteCode ? (
              <div className="flex items-center bg-[#1e1f22] border border-[#111214] rounded p-1.5 focus-within:border-discord-link transition-colors">
                <input
                  type="text"
                  readOnly
                  value={activeInviteCode}
                  className="bg-transparent flex-1 px-2 text-white font-mono text-base outline-none select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyCode(activeInviteCode, true)}
                  className={`px-4 py-2 rounded font-medium text-sm transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                    copiedRecent
                      ? 'bg-[#23a559] text-white'
                      : 'bg-discord-blurple hover:bg-discord-blurpleHover text-white'
                  }`}
                >
                  {copiedRecent ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedRecent ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerateNewInvite}
                disabled={isGeneratingInvite}
                className="w-full py-2.5 px-4 rounded bg-discord-blurple hover:bg-discord-blurpleHover text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isGeneratingInvite ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                <span>{isGeneratingInvite ? 'Gerando código...' : 'Gerar código de convite'}</span>
              </button>
            )}

            {inviteGenerateError && (
              <div className="p-2.5 rounded bg-discord-danger/10 border border-discord-danger/30 text-discord-danger text-xs font-medium mt-1">
                {inviteGenerateError}
              </div>
            )}
          </div>

          {/* Divisor */}
          <div className="h-[1px] bg-[#232428] my-1 flex-shrink-0"></div>

          {/* Seção Convites Ativos */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-discord-textMuted tracking-wider">
                Convites Ativos {serverInvites.length > 0 && `(${serverInvites.length})`}
              </h3>
              <button
                type="button"
                onClick={loadServerInvites}
                title="Atualizar lista"
                className="text-discord-textMuted hover:text-white text-xs transition-colors p-1 cursor-pointer"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {isLoadingInvites ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="text-discord-blurple animate-spin" />
                <span className="text-xs text-discord-textMuted">Carregando convites...</span>
              </div>
            ) : serverInvites.length === 0 ? (
              <div className="py-6 text-center text-xs text-discord-textMuted bg-[#1e1f22]/50 rounded-lg border border-[#232428] p-4">
                Nenhum convite ativo encontrado para este servidor.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                {serverInvites.map((inv) => {
                  const isCopied = copiedInviteCode === inv.code
                  const isDeleting = isDeletingInviteCode === inv.code
                  const createdDate = inv.createdAt
                    ? new Date(inv.createdAt).toLocaleString([], {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : ''

                  return (
                    <div
                      key={inv.id || inv.code}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] border border-[#232428] transition-colors gap-3"
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm tracking-wider bg-[#1e1f22] px-2 py-0.5 rounded border border-[#111214]">
                            {inv.code}
                          </span>
                        </div>
                        <span className="text-[11px] text-discord-textMuted truncate mt-1">
                          Criado por{' '}
                          <span className="text-discord-textNormal font-medium">{inv.inviterUsername}</span>{' '}
                          {createdDate && `• ${createdDate}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(inv.code, false)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                            isCopied
                              ? 'bg-[#23a559] text-white'
                              : 'bg-[#1e1f22] hover:bg-discord-blurple text-discord-textNormal hover:text-white'
                          }`}
                        >
                          {isCopied ? <Check size={13} /> : <Copy size={13} />}
                          <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInvite(inv.code)}
                          disabled={isDeleting}
                          title="Excluir Convite"
                          className="p-1.5 rounded bg-[#1e1f22] text-discord-textMuted hover:text-discord-danger hover:bg-[#da373c]/10 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 size={16} className="text-discord-danger animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end items-center bg-[#2b2d31] p-4 flex-shrink-0 border-t border-[#232428]">
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(false)}
            className="px-6 py-2 rounded bg-discord-blurple font-semibold text-sm text-white hover:bg-discord-blurpleHover transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
