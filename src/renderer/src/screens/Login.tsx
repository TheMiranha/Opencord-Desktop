import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'

export function Login() {
  const navigate = useNavigate()
  const { setToken } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const usernameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.focus()
    const timer = setTimeout(() => {
      usernameInputRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const apiUrl = localStorage.getItem('API_URL')

    try {
      const res = await fetch(`${apiUrl}/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!res.ok) throw new Error('Credenciais inválidas ou servidor offline')

      const json = await res.json()
      const token = json.data?.accessToken || json.accessToken
      if (!token) throw new Error('Token de acesso não retornado pelo servidor')

      // Salva no localStorage e atualiza a store global
      setToken(token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
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
        <div className="w-[480px] rounded-md bg-discord-bg p-8 shadow-2xl no-drag select-text">
          <div className="mb-8 text-center select-none">
            <h2 className="text-2xl font-semibold text-discord-header">Boas-vindas de volta!</h2>
            <p className="mt-2 text-[15px] text-discord-textMuted">Estamos muito animados em te ver novamente!</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Input Username */}
            <div>
              <label className="mb-2 text-xs font-bold uppercase text-discord-textMuted flex justify-between">
                Username
                {error && <span className="font-medium text-discord-danger italic normal-case">- {error}</span>}
              </label>
              <input
                ref={usernameInputRef}
                type="text"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded bg-discord-input p-2.5 text-[15px] text-discord-textNormal outline-none focus:ring-1 focus:ring-discord-link"
                required
              />
            </div>

            {/* Input Senha */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-discord-textMuted">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded bg-discord-input p-2.5 text-[15px] text-discord-textNormal outline-none focus:ring-1 focus:ring-discord-link"
                required
              />
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              className="mt-2 w-full rounded bg-discord-blurple py-3 font-semibold text-white transition-colors hover:bg-discord-blurpleHover cursor-pointer"
            >
              Entrar
            </button>
          </form>

          {/* Rodapé de Registro / Troca de Servidor */}
          <div className="mt-4 flex flex-col gap-2 text-[14px]">
            <div>
              <span className="text-discord-textMuted">Precisando de uma conta? </span>
              <button
                onClick={() => navigate('/register')}
                className="font-medium text-discord-link hover:underline cursor-pointer"
              >
                Registre-se
              </button>
            </div>

            <div className="mt-4 border-t border-[#3f4147] pt-4 text-center">
              <button
                onClick={() => navigate('/server-setup')}
                className="text-sm text-discord-textMuted hover:text-discord-textNormal hover:underline cursor-pointer"
              >
                Trocar endereço do servidor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}