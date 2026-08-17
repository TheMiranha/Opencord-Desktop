import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const apiUrl = localStorage.getItem('API_URL')

    try {
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      })

      if (!res.ok) throw new Error('Erro ao registrar. Verifique os dados ou o servidor.')
      
      alert('Conta criada com sucesso! Faça login.')
      navigate('/login')

    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#1e1f22] bg-[url('https://theme.zdassets.com/theme_assets/678183/b7e9dce75f9edb23504e13b4699e208f204e5015.png')] bg-cover bg-center">
      
      <div className="w-[480px] rounded-md bg-discord-bg p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-discord-header">Criar Conta</h2>
          <p className="mt-2 text-[15px] text-discord-textMuted">Junte-se à nossa comunidade!</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-discord-textMuted flex justify-between">
              Usuário
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

          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-discord-textMuted">
              E-mail
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full rounded bg-discord-input p-2.5 text-[15px] text-discord-textNormal outline-none focus:ring-1 focus:ring-discord-link"
              required 
            />
          </div>

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

          <button 
            type="submit" 
            className="mt-4 w-full rounded bg-discord-blurple py-3 font-semibold text-white transition-colors hover:bg-discord-blurpleHover"
          >
            Registrar
          </button>
        </form>

        <div className="mt-4 text-[14px]">
          <span className="text-discord-textMuted">Já tem uma conta? </span>
          <button onClick={() => navigate('/login')} className="font-medium text-discord-link hover:underline">
            Faça Login
          </button>
        </div>

      </div>
    </div>
  )
}