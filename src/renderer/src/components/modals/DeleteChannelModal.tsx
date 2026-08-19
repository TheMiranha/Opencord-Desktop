import React, { useState } from 'react'
import { useModalStore } from '../../stores/useModalStore'
import { useServerStore } from '../../stores/useServerStore'
import { useChannelStore } from '../../stores/useChannelStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { AlertTriangle, X } from 'lucide-react'

export const DeleteChannelModal: React.FC = () => {
  const { isDeleteChannelModalOpen, channelToDelete, setIsDeleteChannelModalOpen, setChannelToDelete } =
    useModalStore()
  const { activeServerId, setServerChannelsCache } = useServerStore()
  const { viewingChannelId, setViewingChannelId } = useChannelStore()
  const { apiUrl, token } = useAuthStore()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isDeleteChannelModalOpen || !channelToDelete || !activeServerId) return null

  const handleClose = () => {
    setIsDeleteChannelModalOpen(false)
    setChannelToDelete(null)
    setError(null)
  }

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${apiUrl}/server/${activeServerId}/channels/${channelToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Erro ao excluir o canal.')
      }

      // Atualiza o cache local de canais
      setServerChannelsCache((prev) => {
        const existing = prev[activeServerId] || []
        const updated = existing.filter((c) => c.id !== channelToDelete.id)

        // Se o usuário estava no canal deletado, redireciona para outro canal
        if (viewingChannelId === channelToDelete.id) {
          const nextText = updated.find((c) => c.type === 'SERVER_TEXT')
          setViewingChannelId(nextText ? nextText.id : null)
        }

        return { ...prev, [activeServerId]: updated }
      })

      handleClose()
    } catch (err: any) {
      setError(err.message || 'Falha ao excluir o canal. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const channelPrefix = channelToDelete.type === 'SERVER_TEXT' ? '#' : '🔊 '

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-[#313338] text-discord-textNormal w-full max-w-[440px] rounded-lg shadow-2xl overflow-hidden flex flex-col border border-[#1f2023]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle className="text-red-500" size={22} />
            <h2 className="text-lg font-bold">Excluir Canal</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded text-discord-textMuted hover:text-white hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-4 flex flex-col gap-3">
          {error && (
            <div className="p-2.5 rounded bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <p className="text-sm text-discord-textNormal leading-relaxed">
            Tem certeza de que deseja excluir{' '}
            <strong className="text-white font-bold">
              {channelPrefix}
              {channelToDelete.name}
            </strong>
            ? Esta ação não pode ser desfeita e todas as mensagens e arquivos enviados serão apagados permanentemente.
          </p>
        </div>

        {/* Rodapé / Ações */}
        <div className="p-4 bg-[#2b2d31] flex items-center justify-end gap-3 border-t border-[#1f2023]">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="text-xs font-semibold text-white hover:underline px-3 py-2 cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded text-xs font-bold transition-colors cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? 'Excluindo...' : 'Excluir Canal'}
          </button>
        </div>
      </div>
    </div>
  )
}
