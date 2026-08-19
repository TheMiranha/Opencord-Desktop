import React from 'react'
import { File, FileText, Film, Music, Download } from 'lucide-react'
import { Message, User, MessageAttachment } from '../../types'
import { UserAvatar } from '../common/UserAvatar'

interface MessageItemProps {
  message: Message
  currentUser: User | null
  senderName: string
  senderAvatarUrl?: string | null
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  senderName,
  senderAvatarUrl
}) => {
  const timeFormatted = new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileText size={22} className="text-discord-blurple" />
    if (mimeType.startsWith('video/')) return <Film size={22} className="text-red-400" />
    if (mimeType.startsWith('audio/')) return <Music size={22} className="text-amber-400" />
    return <File size={22} className="text-discord-textMuted" />
  }

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename || 'arquivo'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Erro ao baixar arquivo via blob:', err)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || 'arquivo'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const renderAttachment = (att: MessageAttachment, idx: number) => {
    const mime = att.contentType || ''

    // Imagem
    if (mime.startsWith('image/')) {
      return (
        <div key={idx} className="mt-2 max-w-lg overflow-hidden rounded-lg">
          <img
            src={att.url}
            alt={att.name || 'Imagem'}
            onClick={() => downloadFile(att.url, att.name)}
            className="max-h-80 max-w-full rounded-lg object-contain hover:opacity-95 transition-opacity cursor-pointer border border-[#202225]"
            title="Clique para baixar imagem"
          />
        </div>
      )
    }

    // Vídeo
    if (mime.startsWith('video/')) {
      return (
        <div key={idx} className="mt-2 max-w-xl">
          <video
            src={att.url}
            controls
            className="max-h-80 max-w-full rounded-lg bg-black/60 border border-[#202225]"
          />
        </div>
      )
    }

    // Áudio
    if (mime.startsWith('audio/')) {
      return (
        <div key={idx} className="mt-2 max-w-md bg-[#2b2d31] p-2.5 rounded-lg border border-[#202225]">
          <span className="text-xs text-discord-textMuted block mb-1 truncate font-medium">
            {att.name}
          </span>
          <audio src={att.url} controls className="w-full h-8" />
        </div>
      )
    }

    // Documento / Outro arquivo
    return (
      <div
        key={idx}
        className="mt-2 flex items-center justify-between p-3 rounded-lg bg-[#2b2d31] border border-[#202225] max-w-md hover:bg-[#35373c] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 pr-3">
          <div className="w-10 h-10 rounded bg-[#1e1f22] flex items-center justify-center flex-shrink-0">
            {getFileIcon(mime)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white truncate" title={att.name}>
              {att.name}
            </span>
            <span className="text-xs text-discord-textMuted font-mono">
              {formatFileSize(att.size)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => downloadFile(att.url, att.name)}
          className="p-2 rounded-full hover:bg-[#404249] text-discord-textMuted hover:text-white transition-colors cursor-pointer flex-shrink-0"
          title="Baixar arquivo"
        >
          <Download size={18} />
        </button>
      </div>
    )
  }

  const validAttachments = (message.attachments || []).filter(
    (att) => Boolean(att && att.url && typeof att.url === 'string' && att.url.trim() !== '')
  )

  return (
    <div className="flex gap-4 hover:bg-[#2e3035] p-1 -mx-1 rounded group">
      <UserAvatar
        username={senderName}
        avatarUrl={senderAvatarUrl || message.senderAvatarUrl}
        size="md"
        className="mt-0.5 cursor-pointer hover:opacity-90 transition-opacity"
      />
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-white font-medium hover:underline cursor-pointer">{senderName}</span>
          <span className="text-xs text-discord-textMuted">{timeFormatted}</span>
        </div>

        {/* Texto da mensagem */}
        {message.content && (
          <span className="text-discord-textNormal whitespace-pre-wrap break-words">
            {message.content}
          </span>
        )}

        {/* Anexos da mensagem */}
        {validAttachments.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {validAttachments.map((att, idx) => renderAttachment(att, idx))}
          </div>
        )}
      </div>
    </div>
  )
}
