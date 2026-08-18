import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import { Room, RoomEvent } from 'livekit-client'
import { Settings } from './Settings'
import { Friends } from './Friends'

export function Dashboard() {
  const navigate = useNavigate()

  const API_URL = localStorage.getItem('API_URL') || ''
  const LIVEKIT_URL = localStorage.getItem('LIVEKIT_URL') || ''
  const TOKEN = localStorage.getItem('JWT_TOKEN') || ''

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [channels, setChannels] = useState<any[]>([])
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)

  // Estado para o campo de pesquisa de conversas/amigos
  const [searchTerm, setSearchTerm] = useState('')

  const [messages, setMessages] = useState<Record<string, any[]>>({})
  const [inputText, setInputText] = useState('')
  const [stompClient, setStompClient] = useState<Client | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [livekitRoom, setLivekitRoom] = useState<Room | null>(null)
  const [inCall, setInCall] = useState(false)
  const [isSharingScreen, setIsSharingScreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const videoGridRef = useRef<HTMLDivElement>(null)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([])
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([])
  const [selectedInput, setSelectedInput] = useState<string>('')
  const [selectedOutput, setSelectedOutput] = useState<string>('')

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

        await loadAudioDevices()

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

  const loadAudioDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      const inputs = devices.filter(d => d.kind === 'audioinput')
      const outputs = devices.filter(d => d.kind === 'audiooutput')
      setAudioInputs(inputs)
      setAudioOutputs(outputs)
      if (inputs.length > 0 && !selectedInput) setSelectedInput(inputs[0].deviceId)
      if (outputs.length > 0 && !selectedOutput) setSelectedOutput(outputs[0].deviceId)
    } catch (e) {
      console.error("Erro ao listar dispositivos de áudio:", e)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChannelId])

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

  const handleSelectFriendByUsername = (username: string) => {
    const targetChannel = channels.find(ch => {
      const friend = ch.members.find((m: any) => m.id !== currentUser?.id)
      return friend?.username === username
    })

    if (targetChannel) {
      handleSelectChannel(targetChannel.id)
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !activeChannelId || !stompClient) return

    stompClient.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({ channelId: activeChannelId, content: inputText })
    })
    setInputText('')
  }

  const attachTrack = (track: any, participantIdentity: string, isLocal: boolean = false) => {
    const el = track.attach()
    el.id = `track-${track.sid}`
    if (isLocal) el.muted = true

    if (track.kind === 'audio') {
      el.style.display = 'none'
      document.body.appendChild(el)
      if (selectedOutput && 'setSinkId' in el) {
        ;(el as any).setSinkId(selectedOutput).catch((err: any) => console.error("Erro sinkId:", err))
      }
      if (el instanceof HTMLAudioElement) {
        el.muted = isDeafened
        el.play().catch(e => console.error("Autoplay bloqueado:", e))
      }
      return
    }

    if (!videoGridRef.current) return
    const container = document.createElement('div')
    container.className = 'relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center'

    const label = document.createElement('div')
    label.className = 'absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white z-10'
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

      const room = new Room({
        publishDefaults: { videoCodec: 'vp8' },
        rtcConfig: {
          iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }]
        }
      })
      
      setLivekitRoom(room)

      room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        attachTrack(track, participant.identity)
      })

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach()
        const el = document.getElementById(`track-${track.sid}`)
        if (el) {
          if (track.kind === 'audio') el.remove()
          else el.parentElement?.remove()
        }
      })

      room.on(RoomEvent.LocalTrackPublished, (publication) => {
        if (publication.track) attachTrack(publication.track, "Você", true)
      })

      room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
        if (publication.track) {
          publication.track.detach()
          const el = document.getElementById(`track-${publication.track.sid}`)
          if (el) {
            if (publication.track.kind === 'audio') el.remove()
            else el.parentElement?.remove()
          }
        }
      })

      await room.connect(LIVEKIT_URL, token)
      setInCall(true)

      await room.localParticipant.setCameraEnabled(true)
      await room.localParticipant.setMicrophoneEnabled(!isMuted)

      if (selectedInput) {
        await room.switchActiveDevice('audioinput', selectedInput)
      }

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
    document.querySelectorAll('audio[id^="track-"]').forEach(el => el.remove())
  }

  const toggleMute = async () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    if (livekitRoom) {
      await livekitRoom.localParticipant.setMicrophoneEnabled(!nextMuted)
    }
  }

  const toggleDeafen = () => {
    const nextDeaf = !isDeafened
    setIsDeafened(nextDeaf)
    if (nextDeaf && !isMuted) {
      toggleMute()
    }
    document.querySelectorAll('audio[id^="track-"]').forEach(el => {
      if (el instanceof HTMLAudioElement) {
        el.muted = nextDeaf
      }
    })
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
    document.querySelectorAll('audio[id^="track-"]').forEach(el => el.remove())
    navigate('/login')
  }

  const activeChannel = channels.find(c => c.id === activeChannelId)
  const friend = activeChannel?.members?.find((m: any) => m.id !== currentUser?.id)

  // Filtra os canais de acordo com o que o usuário digitar na busca
  const filteredChannels = channels.filter(ch => {
    const chFriend = ch.members.find((m: any) => m.id !== currentUser?.id)
    const name = chFriend ? chFriend.username : ''
    return name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="flex h-screen w-screen bg-discord-bg text-discord-textNormal overflow-hidden font-sans relative">

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

        {/* Campo de Pesquisa de Conversas */}
        <div className="p-2 pb-0">
          <div className="bg-[#1e1f22] rounded px-2 py-1 flex items-center">
            <input 
              type="text"
              placeholder="Encontrar ou começar uma conversa"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent w-full text-xs text-white outline-none placeholder-discord-textMuted py-1"
            />
          </div>
        </div>

        {/* Botão de Amigos */}
        <div className="p-2 pt-2">
          <button 
            onClick={() => setActiveChannelId(null)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${activeChannelId === null ? 'bg-[#404249] text-white' : 'text-discord-textMuted hover:bg-[#35373c] hover:text-discord-textNormal'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2ZM7 11.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM17 17H7v-.73C7 14.5 10.33 14 12 14s5 .5 5 2.27V17Z" />
            </svg>
            Amigos
          </button>
        </div>

        <div className="px-3 pt-2 pb-1 text-[12px] font-bold text-discord-textMuted uppercase tracking-wider">
          Conversas Diretas
        </div>

        {/* Lista Filtrada de Canais */}
        <div className="flex-1 overflow-y-auto px-2 flex flex-col gap-0.5">
          {filteredChannels.map(ch => {
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

        {/* Rodapé Padrão Discord */}
        <div className="h-[54px] bg-[#232428] mt-auto flex items-center px-2 justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#1e1f22] flex items-center justify-center font-bold relative flex-shrink-0">
              {currentUser?.username?.charAt(0).toUpperCase()}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#232428] rounded-full"></div>
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-white truncate">{currentUser?.username}</span>
              <span className="text-[10px] text-discord-textMuted truncate">Online</span>
            </div>
          </div>

     <div className="flex items-center gap-0.5">
            {/* Botão Mutar Microfone (SVG Corrigido e Alinhado) */}
            <button 
              onClick={toggleMute} 
              title={isMuted ? "Desmutar Microfone" : "Mutar Microfone"}
              className={`p-1.5 rounded hover:bg-[#35373c] transition-colors ${isMuted ? 'text-discord-danger' : 'text-discord-textMuted hover:text-discord-textNormal'}`}
            >
              {isMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
                </svg>
              )}
            </button>

            {/* Botão Ensurdecer / Mutar Áudio Geral */}
            <button 
              onClick={toggleDeafen} 
              title={isDeafened ? "Ativar Áudio Geral" : "Ensurdecer"}
              className={`p-1.5 rounded hover:bg-[#35373c] transition-colors ${isDeafened ? 'text-discord-danger' : 'text-discord-textMuted hover:text-discord-textNormal'}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3a9 9 0 0 0-9 9v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5v-2a7 7 0 0 1 14 0v2h-2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9Z" />
              </svg>
            </button>

            {/* Botão de Engrenagem Real (Substituído o ícone de estrela) */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              title="Configurações de Usuário" 
              className="p-1.5 rounded text-discord-textMuted hover:text-discord-textNormal hover:bg-[#35373c] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Área Principal do Chat ou Painel de Amigos */}
      <div className="flex-1 flex flex-col bg-[#313338] relative">
        {activeChannelId ? (
          <>
            <div className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 shadow-sm flex-shrink-0">
              <div className="flex items-center gap-2 font-semibold text-white text-[15px]">
                <span className="text-discord-textMuted text-xl font-light">@</span>
                {friend?.username || 'Desconhecido'}
              </div>

              <div className="flex gap-2 items-center">
                {!inCall ? (
                  <button 
                    onClick={handleJoinCall} 
                    title="Iniciar Chamada"
                    className="text-discord-textMuted hover:text-discord-textNormal p-1.5 rounded hover:bg-[#3f4147] transition-colors"
                  >
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

            <div
              ref={videoGridRef}
              className={`p-4 bg-[#111214] grid gap-4 overflow-y-auto ${inCall ? 'grid-cols-2 max-h-[40%]' : 'hidden'}`}
            ></div>

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

            <div className="p-4 pt-0 flex-shrink-0">
              <form onSubmit={handleSendMessage} className="bg-[#383a40] flex items-center rounded-lg pl-4 pr-2 py-1.5 focus-within:ring-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={`Conversar em @${friend?.username || 'Desconhecido'}`}
                  className="bg-transparent flex-1 outline-none text-discord-textNormal placeholder-discord-textMuted py-2"
                />
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
          <Friends 
            apiUrl={API_URL} 
            token={TOKEN} 
            onSelectFriend={handleSelectFriendByUsername} 
          />
        )}
      </div>

      {isSettingsOpen && (
        <Settings
          audioInputs={audioInputs}
          audioOutputs={audioOutputs}
          selectedInput={selectedInput}
          selectedOutput={selectedOutput}
          onInputChange={async (deviceId) => {
            setSelectedInput(deviceId)
            if (livekitRoom) {
              await livekitRoom.switchActiveDevice('audioinput', deviceId)
            }
          }}
          onOutputChange={(deviceId) => {
            setSelectedOutput(deviceId)
            document.querySelectorAll('audio[id^="track-"]').forEach(el => {
              if ('setSinkId' in el) {
                ;(el as any).setSinkId(deviceId).catch((err: any) => console.error("Erro sinkId:", err))
              }
            })
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

    </div>
  )
}