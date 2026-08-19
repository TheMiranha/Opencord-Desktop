import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export function ServerSetup() {
  const navigate = useNavigate()
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('API_URL') || 'https://')
  const [livekitUrl, setLivekitUrl] = useState(localStorage.getItem('LIVEKIT_URL') || 'wss://')
  const apiInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.focus()
    const timer = setTimeout(() => {
      apiInputRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('API_URL', apiUrl)
    localStorage.setItem('LIVEKIT_URL', livekitUrl)
    navigate('/login')
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
        <div className="w-[480px] rounded-md bg-discord-bg p-8 shadow-2xl no-drag select-text">
          <div className="mb-8 text-center select-none">
            <h2 className="text-2xl font-semibold text-discord-header">Conectar a um Servidor</h2>
            <p className="mt-2 text-[15px] text-discord-textMuted">
              Insira os endereços do servidor Opencord que você deseja acessar.
            </p>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-discord-textMuted">
                URL da API (REST/STOMP)
              </label>
              <input 
                ref={apiInputRef}
                type="text" 
                autoFocus
                value={apiUrl} 
                onChange={e => setApiUrl(e.target.value)} 
                className="w-full rounded bg-discord-input p-2.5 text-[15px] text-discord-textNormal outline-none focus:ring-1 focus:ring-discord-link"
                placeholder="https://api.seuservidor.com"
                required 
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-discord-textMuted">
                URL do LiveKit (WebRTC)
              </label>
              <input 
                type="text" 
                value={livekitUrl} 
                onChange={e => setLivekitUrl(e.target.value)} 
                className="w-full rounded bg-discord-input p-2.5 text-[15px] text-discord-textNormal outline-none focus:ring-1 focus:ring-discord-link"
                placeholder="wss://livekit.seuservidor.com"
                required 
              />
            </div>

            <button 
              type="submit" 
              className="mt-2 w-full rounded bg-discord-blurple py-3 font-semibold text-white transition-colors hover:bg-discord-blurpleHover cursor-pointer"
            >
              Conectar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}