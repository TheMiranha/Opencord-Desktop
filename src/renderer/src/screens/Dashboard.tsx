import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import { Room, RoomEvent } from 'livekit-client'

export function Dashboard() {
  const navigate = useNavigate()

  // Constantes de Rede
  const API_URL = localStorage.getItem('API_URL') || ''
  const LIVEKIT_URL = localStorage.getItem('LIVEKIT_URL') || ''
  const TOKEN = localStorage.getItem('JWT_TOKEN') || ''

  // Estados Globais da Tela
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [channels, setChannels] = useState<any[]>([])
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)

  // Estados de Chat
  const [messages, setMessages] = useState<Record<string, any[]>>({})
  const [inputText, setInputText] = useState('')
  const [stompClient, setStompClient] = useState<Client | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Estados de Chamada (WebRTC)
  const [livekitRoom, setLivekitRoom] = useState<Room | null>(null)
  const [inCall, setInCall] = useState(false)
  const [isSharingScreen, setIsSharingScreen] = useState(false)
  const videoGridRef = useRef<HTMLDivElement>(null)

  // 1. Inicialização: Busca usuário, canais e conecta no WebSocket
  useEffect(() => {
    if (!TOKEN) {
      navigate('/login')
      return
    }

    let activeStompClient: Client | null = null

    const initData = async () => {
      try {
        const meRes = await fetch(`${API_URL}/user/me`, { headers: { 'Authorization': `Bearer ${TOKEN}` } })
        if (!meRes.ok) throw new Error("Sessão expirada")
        const userData = (await meRes.json()).data
        setCurrentUser(userData)

        const chRes = await fetch(`${API_URL}/channels/@me`, { headers: { 'Authorization': `Bearer ${TOKEN}` } })
        const chData = (await chRes.json()).data || []
        setChannels(chData)

        const initialMsgs: Record<string, any[]> = {}
        chData.forEach((ch: any) => { initialMsgs[ch.id] = [] })
        setMessages(initialMsgs)

        activeStompClient = new Client({
          webSocketFactory: () => new SockJS(`${API_URL}/ws`),
          connectHeaders: { 'Authorization': `Bearer ${TOKEN}` },
          onConnect: () => {
            chData.forEach((ch: any) => {
              activeStompClient!.subscribe(`/topic/channel.${ch.id}`, (msg) => {
                const newMsg = JSON.parse(msg.body)

                setMessages(prev => {
                  const channelMsgs = prev[ch.id] || []
                  if (newMsg.id && channelMsgs.some(m => m.id === newMsg.id)) {
                    return prev
                  }
                  return {
                    ...prev,
                    [ch.id]: [...channelMsgs, newMsg]
                  }
                })
              })
            })
          }
        })

        activeStompClient.activate()
        setStompClient(activeStompClient)

      } catch (err) {
        console.error(err)
        handleLogout()
      }
    }

    initData()

    return () => {
      if (activeStompClient) {
        activeStompClient.deactivate()
      }
    }
  }, []) 

  // 2. Auto-Scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChannelId])

  // 3. Buscar Histórico
  const loadHistory = async (channelId: string) => {
    try {
      const res = await fetch(`${API_URL}/channels/${channelId}/messages?page=0&size=50`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      })
      const json = await res.json()
      const content = json.data.content || []

      setMessages(prev => ({
        ...prev,
        [channelId]: content.reverse() 
      }))
    } catch (err) {
      console.error("Erro ao buscar histórico", err)
    }
  }

  const handleSelectChannel = (channelId: string) => {
    setActiveChannelId(channelId)
    if (!messages[channelId] || messages[channelId].length === 0) {
      loadHistory(channelId)
    }
  }

  // 4. Enviar Mensagem STOMP
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !activeChannelId || !stompClient) return

    stompClient.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({ channelId: activeChannelId, content: inputText })
    })
    setInputText('')
  }

  // 5. Integração LiveKit (Voz e Vídeo)
  const attachTrack = (track: any, participantIdentity: string, isLocal: boolean = false) => {
    if (!videoGridRef.current) return
    const el = track.attach()
    el.id = `track-${track.sid}`
    if (isLocal) el.muted = true

    const container = document.createElement('div')
    container.className = 'relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center'

    const label = document.createElement('div')
    label.className = 'absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white'
    label.innerText = participantIdentity

    el.style.width = '100%'
    el.style.height = '100%'
    el.style.objectFit = 'cover'

    container.appendChild(el)
    container.appendChild(label)
    videoGridRef.current.appendChild(container)
  }

  const handleJoinCall = async () => {
    if (!activeChannelId) return
    try {
      const res = await fetch(`${API_URL}/calls/${activeChannelId}/token`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      })
      if (!res.ok) throw new Error("Sem permissão para chamada")
      const { data: { token } } = await res.json()

      const room = new Room()
      setLivekitRoom(room)

      room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        attachTrack(track, participant.identity)
      })

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach()
        const el = document.getElementById(`track-${track.sid}`)
        if (el) el.parentElement?.remove()
      })

      room.on(RoomEvent.LocalTrackPublished, (publication) => {
        if (publication.track) attachTrack(publication.track, "Você", true)
      })

      room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
        if (publication.track) {
          publication.track.detach()
          const el = document.getElementById(`track-${publication.track.sid}`)
          if (el) el.parentElement?.remove()
        }
      })

      await room.connect(LIVEKIT_URL, token)
      setInCall(true)

      await room.localParticipant.setCameraEnabled(true)
      await room.localParticipant.setMicrophoneEnabled(true)

    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleLeaveCall = () => {
    if (livekitRoom) livekitRoom.disconnect()
    setLivekitRoom(null)
    setInCall(false)
    setIsSharingScreen(false)
    if (videoGridRef.current) videoGridRef.current.innerHTML = ''
  }

  const handleShareScreen = async () => {
    if (!livekitRoom) return
    try {
      const willShare = !isSharingScreen
      await livekitRoom.localParticipant.setScreenShareEnabled(willShare)
      setIsSharingScreen(willShare)
    } catch (err) {
      setIsSharingScreen(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('JWT_TOKEN')
    if (stompClient) stompClient.deactivate()
    if (livekitRoom) livekitRoom.disconnect()
    navigate('/login')
  }

  const activeChannel = channels.find(c => c.id === activeChannelId)
  const friend = activeChannel?.members?.find((m: any) => m.id !== currentUser?.id)

  return (
    <div className="flex h-screen w-screen bg-discord-bg text-discord-textNormal overflow-hidden font-sans">

      {/* 1. Barra Lateral de Servidores */}
      <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2 flex-shrink-0">
        <div className="w-12 h-12 bg-discord-blurple rounded-[16px] flex items-center justify-center cursor-pointer transition-all hover:rounded-[12px]">
          <span className="text-white font-bold text-xl">O</span>
        </div>
        <div className="w-8 h-[2px] bg-[#313338] my-1 rounded"></div>
      </div>

      {/* 2. Barra de Canais / DMs */}
      <div className="w-[240px] bg-[#2b2d31] flex flex-col flex-shrink-0">
        <div className="h-12 border-b border-[#1e1f22] flex items-center px-4 shadow-sm font-semibold text-[15px]">
          Mensagens Diretas
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
          {channels.map(ch => {
            const chFriend = ch.members.find((m: any) => m.id !== currentUser?.id)
            const name = chFriend ? chFriend.username : 'Desconhecido'
            const isActive = activeChannelId === ch.id

            return (
              <div
                key={ch.id}
                onClick={() => handleSelectChannel(ch.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-[#404249] text-white' : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'}`}
              >
                <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold flex-shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{name}</span>
              </div>
            )
          })}
        </div>

        {/* Rodapé: Perfil do Usuário */}
        <div className="h-[52px] bg-[#232428] mt-auto flex items-center px-2 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1e1f22] flex items-center justify-center font-bold relative">
              {currentUser?.username?.charAt(0).toUpperCase()}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#232428] rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight">{currentUser?.username}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="text-discord-textMuted hover:text-discord-danger p-2 rounded-md hover:bg-[#313338] transition-colors">
            Sair
          </button>
        </div>
      </div>

      {/* 3. Área Principal do Chat */}
      <div className="flex-1 flex flex-col bg-[#313338] relative">
        {activeChannelId ? (
          <>
            {/* Cabeçalho do Chat */}
            <div className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 shadow-sm flex-shrink-0">
              <div className="flex items-center gap-2 font-semibold text-white text-[15px]">
                <span className="text-discord-textMuted text-xl font-light">@</span>
                {friend?.username || 'Desconhecido'}
              </div>

              {/* Controles de Chamada */}
              <div className="flex gap-2 items-center">
                {!inCall ? (
                  <button 
                    onClick={handleJoinCall} 
                    title="Iniciar Chamada"
                    className="text-discord-textMuted hover:text-discord-textNormal p-1.5 rounded hover:bg-[#3f4147] transition-colors"
                  >
                    {/* Ícone de Chamada (Telefone Clássico Discord) */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.36 15.68a2 2 0 0 1-.36 2.45l-1.9 1.9a13.3 13.3 0 0 1-8.5-8.5l1.9-1.9a2 2 0 0 1 2.45-.36l2.31.93a2 2 0 0 1 1.2 1.83v2.65ZM5.32 2.64a2 2 0 0 1 2.45-.36l2.31.93a2 2 0 0 1 1.2 1.83v2.65a2 2 0 0 1-.36 2.45l-1.9 1.9a13.3 13.3 0 0 1-8.5-8.5l1.9-1.9a2 2 0 0 1 2.45-.36l2.31.93Z" />
                    </svg>
                  </button>
                ) : (
                  <>
                    <button onClick={handleShareScreen} className={`${isSharingScreen ? 'bg-discord-danger' : 'bg-[#1e1f22]'} hover:brightness-110 text-white px-3 py-1 rounded text-sm font-medium transition-colors`}>
                      {isSharingScreen ? 'Parar Tela' : 'Compartilhar Tela'}
                    </button>
                    <button onClick={handleLeaveCall} className="bg-discord-danger hover:bg-[#d92c4b] text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                      Desconectar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Grid de Vídeo (Oculta se não estiver em call) */}
            <div
              ref={videoGridRef}
              className={`p-4 bg-[#111214] grid gap-4 overflow-y-auto ${inCall ? 'grid-cols-2 max-h-[40%]' : 'hidden'}`}
            ></div>

            {/* Lista de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {(messages[activeChannelId] || []).map((msg, idx) => {
                const isMe = msg.senderId === currentUser?.id
                const sender = isMe ? currentUser : activeChannel?.members?.find((m: any) => m.id === msg.senderId)
                const senderName = sender?.username || 'Desconhecido'

                return (
                  <div key={msg.id || idx} className="flex gap-4 hover:bg-[#2e3035] p-1 -mx-1 rounded group">
                    <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity">
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="text-white font-medium hover:underline cursor-pointer">{senderName}</span>
                        <span className="text-xs text-discord-textMuted">
                          {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-discord-textNormal whitespace-pre-wrap">{msg.content}</span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Chat */}
            <div className="p-4 pt-0 flex-shrink-0">
              <form onSubmit={handleSendMessage} className="bg-[#383a40] flex items-center rounded-lg pl-4 pr-2 py-1.5 focus-within:ring-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={`Conversar em @${friend?.username || 'Desconhecido'}`}
                  className="bg-transparent flex-1 outline-none text-discord-textNormal placeholder-discord-textMuted py-2"
                />
                
                {/* Botão de Enviar com Ícone (Avião de Papel) */}
                <button 
                  type="submit"
                  disabled={!inputText.trim()} 
                  className="ml-2 text-discord-textMuted hover:text-discord-textNormal disabled:opacity-50 disabled:hover:text-discord-textMuted p-2 rounded-full hover:bg-[#2b2d31] transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.52 2.22A1 1 0 0 0 2 3.05L4.4 11H12a1 1 0 0 1 0 2H4.4l-2.4 7.95a1 1 0 0 0 1.52.83l18-9a1 1 0 0 0 0-1.79l-18-9Z" />
                  </svg>
                </button>

              </form>
            </div>
          </>
        ) : (
          /* Estado Vazio (Nenhum canal selecionado) */
          <div className="flex-1 flex flex-col items-center justify-center text-discord-textMuted">
            <div className="w-20 h-20 bg-[#2b2d31] rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl text-[#1e1f22]">💬</span>
            </div>
            <h3 className="text-lg font-medium text-white">Nenhuma conversa selecionada</h3>
            <p className="text-sm mt-1">Selecione uma mensagem direta na barra lateral.</p>
          </div>
        )}
      </div>
    </div>
  )
}