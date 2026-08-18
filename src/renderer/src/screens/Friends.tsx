import { useState, useEffect } from 'react'

export function Friends({ 
  apiUrl, 
  token, 
  onSelectFriend 
}: { 
  apiUrl: string; 
  token: string; 
  onSelectFriend: (username: string) => void 
}) {
  const [tab, setTab] = useState<'online' | 'all' | 'pending' | 'add'>('online')
  const [friends, setFriends] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [addUsername, setAddUsername] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    try {
      const fRes = await fetch(`${apiUrl}/friendship`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (fRes.ok) {
        const fJson = await fRes.json()
        setFriends(fJson.data || [])
      }

      const pRes = await fetch(`${apiUrl}/friendship/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (pRes.ok) {
        const pJson = await pRes.json()
        setPending(pJson.data || [])
      }
    } catch (err) {
      console.error("Erro ao carregar dados de amizade", err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addUsername.trim()) return
    setFeedback(null)

    try {
      const res = await fetch(`${apiUrl}/friendship/request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ addresseeUsername: addUsername.trim() })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Não foi possível enviar o convite.')

      setFeedback({ type: 'success', text: `Solicitação enviada para ${addUsername} com sucesso!` })
      setAddUsername('')
      loadData()
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message })
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#313338] text-discord-textNormal h-full">
      <div className="h-12 border-b border-[#1e1f22] flex items-center px-4 gap-4 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2 font-semibold text-white border-r border-[#3f4147] pr-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-discord-textMuted">
            <path d="M19 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2ZM7 11.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM17 17H7v-.73C7 14.5 10.33 14 12 14s5 .5 5 2.27V17Z" />
          </svg>
          Amigos
        </div>

        <div className="flex gap-2 text-sm font-medium">
          <button 
            onClick={() => setTab('online')} 
            className={`px-2 py-1 rounded transition-colors ${tab === 'online' ? 'bg-[#404249] text-white' : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'}`}
          >
            Online
          </button>
          <button 
            onClick={() => setTab('all')} 
            className={`px-2 py-1 rounded transition-colors ${tab === 'all' ? 'bg-[#404249] text-white' : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => { setTab('pending'); loadData(); }} 
            className={`px-2 py-1 rounded transition-colors relative ${tab === 'pending' ? 'bg-[#404249] text-white' : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'}`}
          >
            Pendentes
            {pending.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-discord-danger text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {pending.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setTab('add')} 
            className={`px-2 py-1 rounded bg-[#248046] text-white hover:bg-[#1a6335] transition-colors`}
          >
            Adicionar Amigo
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {tab === 'add' && (
          <div className="max-w-[500px]">
            <h3 className="text-white font-bold text-base uppercase tracking-wider mb-2">Adicionar Amigo</h3>
            <p className="text-sm text-discord-textMuted mb-4">Você pode adicionar amigos com o nome de usuário deles.</p>
            
            <form onSubmit={handleSendRequest} className="bg-[#1e1f22] border border-[#111214] rounded-lg p-3 flex items-center gap-3 focus-within:border-discord-link">
              <input 
                type="text"
                placeholder="Você pode adicionar amigos pelo nome de usuário"
                value={addUsername}
                onChange={e => setAddUsername(e.target.value)}
                className="bg-transparent flex-1 outline-none text-white placeholder-discord-textMuted text-sm"
              />
              <button 
                type="submit" 
                disabled={!addUsername.trim()}
                className="bg-discord-blurple text-white px-4 py-2 rounded text-sm font-medium hover:bg-discord-blurpleHover disabled:opacity-50 transition-colors"
              >
                Enviar Solicitação de Amizade
              </button>
            </form>

            {feedback && (
              <p className={`mt-3 text-sm font-medium ${feedback.type === 'success' ? 'text-green-400' : 'text-discord-danger'}`}>
                {feedback.text}
              </p>
            )}
          </div>
        )}

        {tab === 'pending' && (
          <div>
            <h3 className="text-xs font-bold uppercase text-discord-textMuted tracking-wider mb-4">
              Solicitações Pendentes — {pending.length}
            </h3>
            {pending.length === 0 ? (
              <p className="text-discord-textMuted text-sm">Nenhuma solicitação pendente no momento.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {pending.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-[#2b2d31] border-t border-[#3f4147]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold">
                        {req.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{req.username}</div>
                        <div className="text-xs text-discord-textMuted">Solicitação de amizade recebida</div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={async () => {
                        await fetch(`${apiUrl}/friendship/request`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ addresseeUsername: req.username })
                        })
                        loadData()
                      }}
                      className="bg-[#248046] hover:bg-[#1a6335] text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                      Aceitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(tab === 'all' || tab === 'online') && (
          <div>
            <h3 className="text-xs font-bold uppercase text-discord-textMuted tracking-wider mb-4">
              {tab === 'online' ? 'Amigos Online' : 'Todos os Amigos'} — {friends.length}
            </h3>
            {friends.length === 0 ? (
              <p className="text-discord-textMuted text-sm">Nenhum amigo adicionado ainda. Clique em "Adicionar Amigo" acima!</p>
            ) : (
              <div className="flex flex-col gap-1">
                {friends.map(friend => (
                  <div 
                    key={friend.id} 
                    onClick={() => onSelectFriend(friend.username)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#35373c] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold relative">
                        {friend.username.charAt(0).toUpperCase()}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#313338] rounded-full"></div>
                      </div>
                      <span className="text-white font-medium">{friend.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}