import { useState, useEffect } from 'react'
import { Users, UserPlus, MessageSquare, Check, Loader2 } from 'lucide-react'
import { useChannelStore } from '../stores/useChannelStore'
import { UserAvatar } from '../components/common/UserAvatar'

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
  const [isAccepting, setIsAccepting] = useState<string | null>(null)
  const { setDmChannels } = useChannelStore()

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

  const syncDMs = async () => {
    try {
      const res = await fetch(`${apiUrl}/channels/@me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        setDmChannels(json.data || [])
      }
    } catch (err) {
      console.error('Erro ao sincronizar DMs:', err)
    }
  }

  useEffect(() => {
    loadData()

    const handleUpdate = () => {
      loadData()
      syncDMs()
    }

    window.addEventListener('friendship-updated', handleUpdate)
    return () => {
      window.removeEventListener('friendship-updated', handleUpdate)
    }
  }, [token])

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
      syncDMs()
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message })
    }
  }

  const handleAcceptFriendship = async (targetUsername: string) => {
    setIsAccepting(targetUsername)
    try {
      const res = await fetch(`${apiUrl}/friendship/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ addresseeUsername: targetUsername })
      })
      if (res.ok) {
        await loadData()
        await syncDMs()
        setTab('all')
      }
    } catch (err) {
      console.error('Erro ao aceitar amizade:', err)
    } finally {
      setIsAccepting(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#313338] text-discord-textNormal h-full">
      <div className="h-12 border-b border-[#1e1f22] flex items-center px-4 gap-4 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2 font-semibold text-white border-r border-[#3f4147] pr-4">
          <Users size={20} className="text-discord-textMuted" />
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
            className={`px-2 py-1 rounded bg-[#248046] text-white hover:bg-[#1a6335] transition-colors flex items-center gap-1.5`}
          >
            <UserPlus size={15} />
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
                {pending.map((req) => (
                  <div
                    key={req.id || req.userId}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#2b2d31] border border-[#3f4147]/30 hover:border-[#3f4147] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        username={req.username}
                        avatarUrl={req.avatarUrl}
                        size="md"
                      />
                      <div>
                        <div className="text-white font-semibold text-sm">{req.username}</div>
                        <div className="text-xs text-discord-textMuted">Solicitação de amizade recebida</div>
                      </div>
                    </div>

                    <button
                      disabled={isAccepting === req.username}
                      onClick={() => handleAcceptFriendship(req.username)}
                      className="bg-[#248046] hover:bg-[#1a6335] disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {isAccepting === req.username ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Aceitando...
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          Aceitar
                        </>
                      )}
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
              <p className="text-discord-textMuted text-sm">
                Nenhum amigo adicionado ainda. Clique em "Adicionar Amigo" acima!
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {friends.map((friend) => (
                  <div
                    key={friend.id || friend.userId}
                    onClick={() => onSelectFriend(friend.username)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#35373c] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        username={friend.username}
                        avatarUrl={friend.avatarUrl}
                        size="md"
                        status="online"
                      />
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm group-hover:underline">
                          {friend.username}
                        </span>
                        <span className="text-xs text-discord-textMuted">Disponível</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectFriend(friend.username)
                      }}
                      className="w-9 h-9 rounded-full bg-[#2b2d31] flex items-center justify-center text-discord-textMuted group-hover:text-white hover:bg-[#1e1f22] transition-colors"
                      title="Enviar Mensagem"
                    >
                      <MessageSquare size={18} />
                    </button>
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