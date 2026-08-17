import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function ServerSetup() {
  const navigate = useNavigate()
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('API_URL') || 'https://')
  const [livekitUrl, setLivekitUrl] = useState(localStorage.getItem('LIVEKIT_URL') || 'wss://')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('API_URL', apiUrl)
    localStorage.setItem('LIVEKIT_URL', livekitUrl)
    navigate('/login')
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#1e1f22] bg-[url('https://theme.zdassets.com/theme_assets/678183/b7e9dce75f9edb23504e13b4699e208f204e5015.png')] bg-cover bg-center">
      
      <div className="w-[480px] rounded-md bg-discord-bg p-8 shadow-2xl">
        <div className="mb-8 text-center">
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
              type="text" 
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
            className="mt-2 w-full rounded bg-discord-blurple py-3 font-semibold text-white transition-colors hover:bg-discord-blurpleHover"
          >
            Conectar
          </button>
        </form>
      </div>
    </div>
  )
}