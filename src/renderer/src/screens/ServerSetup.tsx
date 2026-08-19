import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle, Server } from 'lucide-react'
import { useAuthStore } from '../stores/useAuthStore'

export function ServerSetup() {
  const navigate = useNavigate()
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('API_URL') || '')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const apiInputRef = useRef<HTMLInputElement>(null)
  const { setApiUrl, fetchServerConfig } = useAuthStore()

  useEffect(() => {
    window.focus()
    const timer = setTimeout(() => {
      apiInputRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    let url = serverUrl.trim()
    if (!url) return

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }
    url = url.replace(/\/+$/, '')

    setIsLoading(true)

    try {
      setApiUrl(url)
      const config = await fetchServerConfig(url)

      if (config && config.livekitUrl) {
        navigate('/login')
      } else {
        setErrorMessage(
          'Não foi possível obter as configurações do servidor. Verifique o endereço digitado e certifique-se de que o servidor está online.'
        )
      }
    } catch (err) {
      console.error('Erro ao conectar ao servidor:', err)
      setErrorMessage('Falha ao conectar ao servidor. Verifique a URL informada.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e1f22] bg-[url('https://theme.zdassets.com/theme_assets/678183/b7e9dce75f9edb23504e13b4699e208f204e5015.png')] bg-cover bg-center overflow-hidden font-sans select-none relative">
      {/* Barra de Título Superior (Drag Region) */}
      <div className="h-[28px] w-full flex-shrink-0 drag-region flex items-center px-4 z-50">
        <span className="text-[#80848e] text-[11px] font-bold uppercase tracking-wider select-none">
          Opencord
        </span>
      </div>

      {/* Container Central com o Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-[460px] rounded-md bg-discord-bg p-8 shadow-2xl no-drag select-text">
          <div className="mb-6 text-center select-none flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-discord-blurple/20 text-discord-blurple flex items-center justify-center mb-3">
              <Server size={26} />
            </div>
            <h2 className="text-2xl font-semibold text-discord-header">Conectar a um Servidor</h2>
            <p className="mt-2 text-sm text-discord-textMuted leading-relaxed">
              Digite o endereço do servidor Opencord. As configurações de conexão e voz (WSS) serão obtidas automaticamente.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-discord-textMuted">
                Endereço do Servidor Opencord
              </label>
              <input
                ref={apiInputRef}
                type="text"
                autoFocus
                disabled={isLoading}
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="w-full rounded bg-discord-input p-2.5 text-[15px] text-discord-textNormal outline-none focus:ring-1 focus:ring-discord-link disabled:opacity-50"
                placeholder="ex: https://opencord.seuservidor.com ou http://localhost:25565"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !serverUrl.trim()}
              className="mt-2 w-full rounded bg-discord-blurple py-3 font-semibold text-white transition-colors hover:bg-discord-blurpleHover disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Conectando...
                </>
              ) : (
                'Conectar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}