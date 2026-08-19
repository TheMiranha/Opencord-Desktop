import React, { useState, useEffect } from 'react'
import { useModalStore } from '../../stores/useModalStore'
import { useServerStore } from '../../stores/useServerStore'
import { useChannelStore } from '../../stores/useChannelStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { Hash, Volume2, X } from 'lucide-react'
import { Channel } from '../../types'

export const CreateChannelModal: React.FC = () => {
  const { isCreateChannelModalOpen, createChannelType, setIsCreateChannelModalOpen } = useModalStore()
  const { activeServerId, setServerChannelsCache, setLastVisitedChannel } = useServerStore()
  const { setViewingChannelId } = useChannelStore()
  const { apiUrl, token } = useAuthStore()

  const [channelType, setChannelType] = useState<'SERVER_TEXT' | 'SERVER_VOICE'>('SERVER_TEXT')
  const [channelName, setChannelName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isCreateChannelModalOpen) {
      setChannelType(createChannelType || 'SERVER_TEXT')
      setChannelName('')
      setError(null)
      setIsLoading(false)
    }
  }, [isCreateChannelModalOpen, createChannelType])

  if (!isCreateChannelModalOpen || !activeServerId) return null

  const handleNameChange = (val: string) => {
    if (channelType === 'SERVER_TEXT') {
      // Normaliza para formato kebab-case estilo Discord
      const formatted = val.toLowerCase().replace(/\s+/g, '-')
      setChannelName(formatted)
    } else {
      setChannelName(val)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = channelName.trim()
    if (!trimmed) {
      setError('Por favor, digite um nome para o canal.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${apiUrl}/server/${activeServerId}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: trimmed,
          type: channelType
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Erro ao criar o canal.')
      }

      const json = await res.json()
      const newChannel: Channel = json.data || json

      if (newChannel && newChannel.id) {
        // 1. Atualiza o cache de canais do servidor
        setServerChannelsCache((prev) => {
          const currentList = prev[activeServerId] || []
          if (currentList.some((c) => c.id === newChannel.id)) return prev
          return {
            ...prev,
            [activeServerId]: [...currentList, newChannel]
          }
        })

        // 2. Registra o último canal visitado
        setLastVisitedChannel((prev) => ({
          ...prev,
          [activeServerId]: newChannel.id
        }))

        // 3. Redireciona a visualização para o canal recém-criado
        setViewingChannelId(newChannel.id)
      }

      setIsCreateChannelModalOpen(false)
    } catch (err: any) {
      setError(err.message || 'Falha ao criar o canal. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-[#313338] text-discord-textNormal w-full max-w-[460px] rounded-lg shadow-2xl overflow-hidden flex flex-col border border-[#1f2023]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">Criar Canal</h2>
            <p className="text-xs text-discord-textMuted mt-0.5">
              no servidor selecionado
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateChannelModalOpen(false)}
            className="p-1 rounded text-discord-textMuted hover:text-white hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleCreate} className="p-4 flex flex-col gap-4">
          {error && (
            <div className="p-2.5 rounded bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Tipo de Canal */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-bold text-discord-textMuted uppercase tracking-wider">
              Tipo de Canal
            </label>

            {/* Opção Canal de Texto */}
            <div
              onClick={() => {
                setChannelType('SERVER_TEXT')
                setChannelName((prev) => prev.toLowerCase().replace(/\s+/g, '-'))
              }}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                channelType === 'SERVER_TEXT'
                  ? 'bg-[#2b2d31] border-discord-blurple shadow-sm'
                  : 'bg-[#2b2d31]/50 border-transparent hover:bg-[#2b2d31]'
              }`}
            >
              <Hash size={24} className={channelType === 'SERVER_TEXT' ? 'text-white' : 'text-discord-textMuted'} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white leading-tight">Texto</div>
                <div className="text-xs text-discord-textMuted leading-tight mt-0.5">
                  Envie mensagens, imagens, memes e opiniões
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  channelType === 'SERVER_TEXT' ? 'border-discord-blurple' : 'border-[#4e5058]'
                }`}
              >
                {channelType === 'SERVER_TEXT' && (
                  <div className="w-2 h-2 rounded-full bg-discord-blurple" />
                )}
              </div>
            </div>

            {/* Opção Canal de Voz */}
            <div
              onClick={() => setChannelType('SERVER_VOICE')}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                channelType === 'SERVER_VOICE'
                  ? 'bg-[#2b2d31] border-discord-blurple shadow-sm'
                  : 'bg-[#2b2d31]/50 border-transparent hover:bg-[#2b2d31]'
              }`}
            >
              <Volume2 size={24} className={channelType === 'SERVER_VOICE' ? 'text-white' : 'text-discord-textMuted'} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white leading-tight">Voz</div>
                <div className="text-xs text-discord-textMuted leading-tight mt-0.5">
                  Converse por voz, compartilhe sua tela e jogue juntos
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  channelType === 'SERVER_VOICE' ? 'border-discord-blurple' : 'border-[#4e5058]'
                }`}
              >
                {channelType === 'SERVER_VOICE' && (
                  <div className="w-2 h-2 rounded-full bg-discord-blurple" />
                )}
              </div>
            </div>
          </div>

          {/* Nome do Canal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-discord-textMuted uppercase tracking-wider">
              Nome do Canal
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-discord-textMuted flex items-center">
                {channelType === 'SERVER_TEXT' ? <Hash size={16} /> : <Volume2 size={16} />}
              </span>
              <input
                type="text"
                value={channelName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={channelType === 'SERVER_TEXT' ? 'novo-canal' : 'Geral'}
                autoFocus
                maxLength={100}
                className="w-full bg-[#1e1f22] text-white pl-8 pr-3 py-2 rounded text-sm outline-none focus:ring-1 focus:ring-discord-blurple border border-[#111214]"
              />
            </div>
          </div>

          {/* Rodapé / Ações */}
          <div className="mt-2 -mx-4 -mb-4 p-4 bg-[#2b2d31] flex items-center justify-end gap-3 border-t border-[#1f2023]">
            <button
              type="button"
              onClick={() => setIsCreateChannelModalOpen(false)}
              className="text-xs font-semibold text-white hover:underline px-3 py-2 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !channelName.trim()}
              className="bg-discord-blurple hover:bg-discord-blurpleHover disabled:opacity-50 text-white px-5 py-2 rounded text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              {isLoading ? 'Criando...' : 'Criar Canal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
