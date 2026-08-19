import React, { useState, useRef, useEffect } from 'react'
import {
  SendHorizontal,
  Plus,
  X,
  File,
  FileText,
  Film,
  Music,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { MessageAttachment } from '../../types'
import { useAuthStore } from '../../stores/useAuthStore'
import { useChannelStore } from '../../stores/useChannelStore'

interface MessageInputProps {
  channelName: string
  isServerChannel: boolean
  onSendMessage: (text: string, attachments?: MessageAttachment[]) => void
}

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export const MessageInput: React.FC<MessageInputProps> = ({
  channelName,
  isServerChannel,
  onSendMessage
}) => {
  const [inputText, setInputText] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<{ file: File; previewUrl?: string }[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { apiUrl, token } = useAuthStore()
  const { viewingChannelId } = useChannelStore()

  // Gerar previews para arquivos de imagem
  useEffect(() => {
    const previews = pendingFiles.map((file) => {
      if (file.type.startsWith('image/')) {
        return { file, previewUrl: URL.createObjectURL(file) }
      }
      return { file }
    })
    setFilePreviews(previews)

    return () => {
      previews.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
      })
    }
  }, [pendingFiles])

  // Limpar erro automaticamente após 4s
  useEffect(() => {
    if (!errorMessage) return undefined
    const timer = setTimeout(() => setErrorMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [errorMessage])

  const addFiles = (files: FileList | File[]) => {
    const validFiles: File[] = []
    let hasOverLimit = false

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        hasOverLimit = true
      } else {
        validFiles.push(file)
      }
    })

    if (hasOverLimit) {
      setErrorMessage('Um ou mais arquivos excedem o limite de 100MB.')
    }

    if (validFiles.length > 0) {
      setPendingFiles((prev) => [...prev, ...validFiles])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
      e.target.value = ''
    }
  }

  // Suporte a colar arquivos com CTRL + V
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    const pastedFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile()
        if (file) {
          pastedFiles.push(file)
        }
      }
    }

    if (pastedFiles.length > 0) {
      addFiles(pastedFiles)
    }
  }

  // Suporte a Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, idx) => idx !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileText size={20} className="text-discord-blurple" />
    if (mimeType.startsWith('video/')) return <Film size={20} className="text-red-400" />
    if (mimeType.startsWith('audio/')) return <Music size={20} className="text-amber-400" />
    return <File size={20} className="text-discord-textMuted" />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() && pendingFiles.length === 0) return
    if (isUploading) return

    let uploadedAttachments: MessageAttachment[] = []

    if (pendingFiles.length > 0) {
      if (!viewingChannelId) return
      setIsUploading(true)

      try {
        let uploadFailed = false

        for (const file of pendingFiles) {
          const formData = new FormData()
          formData.append('file', file)

          const res = await fetch(`${apiUrl}/channels/${viewingChannelId}/attachments`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`
            },
            body: formData
          })

          if (res.ok) {
            const rawJson = await res.json()
            const data: MessageAttachment = rawJson?.data || rawJson
            if (data && data.url) {
              uploadedAttachments.push(data)
            } else {
              uploadFailed = true
              setErrorMessage(`Erro: resposta inválida ao enviar ${file.name}`)
            }
          } else {
            uploadFailed = true
            const errText = await res.text()
            console.error('Erro ao enviar anexo:', res.status, errText)
            setErrorMessage(`Erro (${res.status}) ao enviar o arquivo ${file.name}`)
          }
        }

        if (uploadFailed) {
          setIsUploading(false)
          return
        }
      } catch (err) {
        console.error('Erro no upload:', err)
        setErrorMessage('Falha ao conectar com o servidor para upload.')
        setIsUploading(false)
        return
      } finally {
        setIsUploading(false)
      }
    }

    if (inputText.trim() || uploadedAttachments.length > 0) {
      onSendMessage(inputText.trim(), uploadedAttachments)
      setInputText('')
      setPendingFiles([])
    }
  }

  return (
    <div
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="p-4 pt-0 flex-shrink-0 z-10 select-none relative"
    >
      {/* Alerta de erro */}
      {errorMessage && (
        <div className="mb-2 px-3 py-2 rounded bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Input de arquivo invisível */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        className={`bg-[#383a40] rounded-lg transition-all ${
          isDraggingOver ? 'ring-2 ring-discord-blurple bg-[#404249]' : ''
        }`}
      >
        {/* Preview dos Arquivos Pendentes */}
        {filePreviews.length > 0 && (
          <div className="p-3 pb-0 flex flex-wrap gap-3 border-b border-[#2e3035]">
            {filePreviews.map(({ file, previewUrl }, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="relative group bg-[#2b2d31] rounded-lg p-2 flex items-center gap-2.5 max-w-[220px] border border-[#202225] shadow-sm"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="w-12 h-12 rounded object-cover flex-shrink-0 bg-black/40"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-[#1e1f22] flex items-center justify-center flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                )}

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-white truncate" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-[10px] text-discord-textMuted font-mono">
                    {formatFileSize(file.size)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  disabled={isUploading}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-discord-danger text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow cursor-pointer disabled:opacity-50"
                  title="Remover arquivo"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Barra de Digitação */}
        <form onSubmit={handleSubmit} className="flex items-center pl-3 pr-2 py-1.5">
          {/* Botão de Anexo (+) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-1.5 rounded-full bg-[#4e5058] hover:bg-[#6d6f78] text-white transition-colors cursor-pointer mr-2 flex-shrink-0 disabled:opacity-50"
            title="Anexar arquivo (máx. 100MB)"
          >
            <Plus size={18} />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isUploading
                ? 'Enviando arquivos...'
                : `Conversar em ${isServerChannel ? '#' : '@'}${channelName}`
            }
            disabled={isUploading}
            className="bg-transparent flex-1 outline-none text-discord-textNormal placeholder-discord-textMuted py-2 text-sm disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && pendingFiles.length === 0) || isUploading}
            className="ml-2 text-discord-textMuted hover:text-white disabled:opacity-30 disabled:hover:text-discord-textMuted p-2 rounded-full hover:bg-discord-blurple transition-colors cursor-pointer flex-shrink-0"
          >
            {isUploading ? (
              <Loader2 size={20} className="animate-spin text-discord-blurple" />
            ) : (
              <SendHorizontal size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
