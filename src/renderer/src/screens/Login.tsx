import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

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
      localStorage.setItem('JWT_TOKEN', json.data.accessToken)
      navigate('/dashboard')

    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    // Container com background (pode colocar uma imagem de fundo aqui depois se quiser)
    <div className="flex h-screen w-screen items-center justify-center bg-[#1e1f22] bg-[url('https://theme.zdassets.com/theme_assets/678183/b7e9dce75f9edb23504e13b4699e208f204e5015.png')] bg-cover bg-center">

      {/* Card Principal */}
      <div className="w-[480px] rounded-md bg-discord-bg p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-discord-header">Boas-vindas de volta!</h2>
          <p className="mt-2 text-[15px] text-discord-textMuted">Estamos muito animados em te ver novamente!</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">

          {/* Input Username */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-discord-textMuted flex justify-between">
              Username
              {error && <span className="font-medium text-discord-danger italic normal-case">- {error}</span>}
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
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
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded bg-discord-input p-2.5 text-[15px] text-discord-textNormal outline-none focus:ring-1 focus:ring-discord-link"
              required
            />
          </div>

          {/* Botão de Entrar */}
          <button
            type="submit"
            className="mt-2 w-full rounded bg-discord-blurple py-3 font-semibold text-white transition-colors hover:bg-discord-blurpleHover"
          >
            Entrar
          </button>
        </form>

        {/* Rodapé de Registro / Troca de Servidor */}
        <div className="mt-4 flex flex-col gap-2 text-[14px]">
          <div>
            <span className="text-discord-textMuted">Precisando de uma conta? </span>
            <button onClick={() => navigate('/register')} className="font-medium text-discord-link hover:underline">
              Registre-se
            </button>
          </div>

          <div className="mt-4 border-t border-[#3f4147] pt-4 text-center">
            <button
              onClick={() => navigate('/server-setup')}
              className="text-sm text-discord-textMuted hover:text-discord-textNormal hover:underline"
            >
              Trocar endereço do servidor
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}