import { useEffect, useState, useRef } from 'react'
import { X, Volume2, LogOut, User as UserIcon, Camera, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/useAuthStore'
import { UserAvatar } from '../components/common/UserAvatar'

export function Settings({
  audioInputs,
  audioOutputs,
  selectedInput,
  selectedOutput,
  onInputChange,
  onOutputChange,
  onClose,
  onLogout
}: {
  audioInputs: MediaDeviceInfo[]
  audioOutputs: MediaDeviceInfo[]
  selectedInput: string
  selectedOutput: string
  onInputChange: (id: string) => void
  onOutputChange: (id: string) => void
  onClose: () => void
  onLogout: () => void
}) {
  const { currentUser, apiUrl, token, setCurrentUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'account' | 'voice'>('account')
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Adiciona o listener para fechar ao apertar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadFeedback(null)
    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${apiUrl}/user/me/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.message || 'Falha ao fazer upload da imagem.')
      }

      const json = await res.json()
      const updatedUser = json.data || json
      setCurrentUser(updatedUser)
      setUploadFeedback({ type: 'success', text: 'Foto de perfil atualizada com sucesso!' })
    } catch (err: any) {
      setUploadFeedback({ type: 'error', text: err.message || 'Erro ao enviar foto' })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="absolute inset-0 z-50 bg-[#1e1f22]/80 backdrop-blur-sm flex justify-center items-center p-6 animate-in fade-in duration-150">
      {/* Caixa do Modal Centralizada */}
      <div className="relative w-full max-w-[960px] h-[85vh] bg-[#313338] rounded-lg shadow-2xl flex overflow-hidden border border-[#232428]">
        {/* Menu Lateral das Configurações */}
        <div className="w-[230px] bg-[#2b2d31] flex flex-col items-end py-10 pr-6 gap-2 flex-shrink-0 border-r border-[#1f2023]">
          <span className="text-xs font-bold text-discord-textMuted uppercase w-full max-w-[190px] mb-1">
            Configurações de Usuário
          </span>

          <button
            onClick={() => setActiveTab('account')}
            className={`w-full max-w-[190px] text-left px-3 py-2 rounded font-medium text-sm flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'account'
                ? 'bg-[#404249] text-white'
                : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'
            }`}
          >
            <UserIcon size={16} />
            Minha Conta
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`w-full max-w-[190px] text-left px-3 py-2 rounded font-medium text-sm flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'voice'
                ? 'bg-[#404249] text-white'
                : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'
            }`}
          >
            <Volume2 size={16} />
            Voz e Vídeo
          </button>

          <div className="w-full max-w-[190px] h-[1px] bg-[#35373c] my-2"></div>

          {!confirmingLogout ? (
            <button
              onClick={() => setConfirmingLogout(true)}
              className="w-full max-w-[190px] text-left px-3 py-2 rounded text-discord-danger hover:bg-discord-danger/10 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              Sair da Conta
            </button>
          ) : (
            <div className="w-full max-w-[190px] flex flex-col gap-2 p-2.5 rounded bg-[#1e1f22] border border-discord-danger/40">
              <span className="text-xs text-white font-semibold">Deseja realmente sair?</span>
              <div className="flex gap-2">
                <button
                  onClick={onLogout}
                  className="flex-1 bg-discord-danger hover:bg-red-700 text-white text-xs py-1.5 rounded font-bold transition-colors cursor-pointer"
                >
                  Sair
                </button>
                <button
                  onClick={() => setConfirmingLogout(false)}
                  className="flex-1 bg-[#35373c] hover:bg-[#404249] text-discord-textNormal text-xs py-1.5 rounded font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo das Configurações */}
        <div className="flex-1 p-10 overflow-y-auto">
          {activeTab === 'account' && (
            <div className="max-w-[680px]">
              <h2 className="text-xl font-bold text-white mb-6">Minha Conta</h2>

              {/* Card de Perfil Estilo Discord */}
              <div className="bg-[#1e1f22] rounded-lg overflow-hidden shadow-lg border border-[#111214]">
                {/* Banner Superior */}
                <div className="h-24 bg-[#5865F2] w-full relative"></div>

                {/* Área do Avatar e Informações */}
                <div className="p-5 relative pt-0">
                  <div className="flex items-end justify-between -mt-10 mb-4">
                    {/* Avatar com ação de troca */}
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="border-[6px] border-[#1e1f22] rounded-full overflow-hidden">
                        <UserAvatar
                          username={currentUser?.username}
                          avatarUrl={currentUser?.avatarUrl}
                          size="xl"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity border-[6px] border-transparent">
                        <Camera size={20} />
                        <span className="text-[10px] font-bold uppercase mt-0.5">Mudar</span>
                      </div>
                    </div>

                    <button
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-discord-blurple hover:bg-discord-blurpleHover text-white px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Camera size={16} />
                          Mudar Avatar
                        </>
                      )}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />

                  {uploadFeedback && (
                    <div
                      className={`mb-4 p-2.5 rounded text-sm font-medium ${
                        uploadFeedback.type === 'success'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {uploadFeedback.text}
                    </div>
                  )}

                  {/* Informações da Conta */}
                  <div className="bg-[#2b2d31] rounded-lg p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-[#35373c] pb-3">
                      <div>
                        <div className="text-xs font-bold text-discord-textMuted uppercase">Nome de Usuário</div>
                        <div className="text-white font-medium text-base mt-0.5">{currentUser?.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-discord-textMuted uppercase">E-mail</div>
                        <div className="text-white font-medium text-base mt-0.5">
                          {currentUser?.email || 'Não informado'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="max-w-[680px]">
              <h2 className="text-xl font-bold text-white mb-6">Configurações de Voz e Vídeo</h2>

              <div className="flex flex-col gap-6">
                {/* Seletor de Entrada (Microfone) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-discord-textMuted mb-2">
                    Dispositivo de Entrada (Microfone)
                  </label>
                  <select
                    value={selectedInput}
                    onChange={(e) => onInputChange(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#111214] rounded p-2.5 text-white outline-none focus:border-discord-link cursor-pointer"
                  >
                    {audioInputs.map((input) => (
                      <option key={input.deviceId} value={input.deviceId}>
                        {input.label || `Microfone (${input.deviceId.slice(0, 5)}...)`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seletor de Saída (Fone/Caixa de som) */}
                <div>
                  <label className="block text-xs font-bold uppercase text-discord-textMuted mb-2">
                    Dispositivo de Saída (Fone / Caixa de Som)
                  </label>
                  <select
                    value={selectedOutput}
                    onChange={(e) => onOutputChange(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#111214] rounded p-2.5 text-white outline-none focus:border-discord-link cursor-pointer"
                  >
                    {audioOutputs.map((output) => (
                      <option key={output.deviceId} value={output.deviceId}>
                        {output.label || `Alto-falante (${output.deviceId.slice(0, 5)}...)`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botão ESC / Fechar no canto superior direito do modal */}
        <div
          className="absolute top-6 right-6 flex flex-col items-center cursor-pointer group z-10"
          onClick={onClose}
        >
          <div className="w-9 h-9 rounded-full border-2 border-discord-textMuted flex items-center justify-center text-discord-textMuted group-hover:border-white group-hover:text-white transition-colors">
            <X size={18} />
          </div>
          <span className="text-[10px] text-discord-textMuted font-bold mt-1 uppercase group-hover:text-white transition-colors">
            ESC
          </span>
        </div>
      </div>
    </div>
  )
}