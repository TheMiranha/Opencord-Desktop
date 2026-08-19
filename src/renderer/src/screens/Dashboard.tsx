import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import { Room, RoomEvent, LocalVideoTrack, Track } from 'livekit-client'

import { useAuthStore } from '../stores/useAuthStore'
import { useServerStore } from '../stores/useServerStore'
import { useChannelStore } from '../stores/useChannelStore'
import { useChatStore } from '../stores/useChatStore'
import { useVoiceStore } from '../stores/useVoiceStore'
import { useModalStore } from '../stores/useModalStore'
import { useKeybindStore, matchesKeybind } from '../stores/useKeybindStore'

import { ServerSidebar } from '../components/server/ServerSidebar'
import { ChannelSidebar } from '../components/channel/ChannelSidebar'
import { VoiceStatusBar } from '../components/voice/VoiceStatusBar'
import { UserFooter } from '../components/user/UserFooter'
import { ChatArea } from '../components/chat/ChatArea'
import { VoiceArea } from '../components/voice/VoiceArea'
import { Friends } from './Friends'
import { Settings } from './Settings'
import { ScreenPicker } from './ScreenPicker'
import { ServerModal } from '../components/modals/ServerModal'
import { ServerInvitesModal } from '../components/modals/ServerInvitesModal'
import { CreateChannelModal } from '../components/modals/CreateChannelModal'
import { DeleteChannelModal } from '../components/modals/DeleteChannelModal'
import { ServerMemberSidebar } from '../components/server/ServerMemberSidebar'
import { ServerSettingsModal } from '../components/server/ServerSettingsModal'
import { DMUserProfileSidebar } from '../components/user/DMUserProfileSidebar'
import { MessageAttachment } from '../types'

export function Dashboard(): React.JSX.Element {
  const navigate = useNavigate()

  // Stores
  const { apiUrl, livekitUrl, token, currentUser, setCurrentUser, logout, syncFromStorage } = useAuthStore()
  const { activeServerId, serverChannelsCache, lastVisitedChannel, setServers, setServerChannelsCache, setServerMembersCache, setLastVisitedChannel } = useServerStore()
  const { dmChannels, viewingChannelId, setDmChannels, setViewingChannelId } = useChannelStore()
  const { messages, stompClient, setMessages, setStompClient, addMessage } = useChatStore()
  const {
    livekitRoom,
    inCall,
    activeVoiceChannelId,
    isMuted,
    isDeafened,
    isSharingScreen,
    remoteParticipants,
    audioInputs,
    audioOutputs,
    selectedInput,
    selectedOutput,
    screenTrack,
    screenSources,
    setLivekitRoom,
    setInCall,
    setActiveVoiceChannelId,
    setIsMuted,
    setIsDeafened,
    setIsSharingScreen,
    setRemoteParticipants,
    setAudioInputs,
    setAudioOutputs,
    setSelectedInput,
    setSelectedOutput,
    setScreenTrack,
    setScreenSources
  } = useVoiceStore()
  const { isPickerOpen, isSettingsOpen, setIsPickerOpen, setIsSettingsOpen } = useModalStore()
  const [dmVoiceViewMode, setDmVoiceViewMode] = useState<'voice' | 'chat'>('voice')

  const subscribedChannels = useRef<Set<string>>(new Set())
  const subscribedServers = useRef<Set<string>>(new Set())
  const wasMutedRef = useRef(false)

  const handleIncomingMessage = (msg: any) => {
    const newMsg = JSON.parse(msg.body)
    const chId = newMsg.channelId
    if (!chId) return
    addMessage(chId, newMsg)
  }

  const handleServerChannelEvent = (msg: any) => {
    try {
      const payload = JSON.parse(msg.body)
      const { event, serverId, channel, channelId } = payload
      if (!serverId) return

      if (event === 'CHANNEL_CREATED' && channel) {
        setServerChannelsCache((prev) => {
          const existing = prev[serverId] || []
          if (existing.some((c) => c.id === channel.id)) return prev
          return { ...prev, [serverId]: [...existing, channel] }
        })

        if (stompClient && stompClient.connected && !subscribedChannels.current.has(channel.id)) {
          stompClient.subscribe(`/topic/channel.${channel.id}`, handleIncomingMessage)
          subscribedChannels.current.add(channel.id)
        }
      } else if (event === 'CHANNEL_DELETED' && channelId) {
        setServerChannelsCache((prev) => {
          const existing = prev[serverId] || []
          return { ...prev, [serverId]: existing.filter((c) => c.id !== channelId) }
        })

        if (useChannelStore.getState().viewingChannelId === channelId) {
          const cached = useServerStore.getState().serverChannelsCache[serverId] || []
          const remaining = cached.filter((c) => c.id !== channelId)
          const nextText = remaining.find((c) => c.type === 'SERVER_TEXT')
          setViewingChannelId(nextText ? nextText.id : null)
        }
      }
    } catch (err) {
      console.error('Erro ao processar evento de canal via WS:', err)
    }
  }

  // Inicialização de Dados e WebSocket
  useEffect(() => {
    const effectiveToken = token || localStorage.getItem('JWT_TOKEN')
    const effectiveApiUrl = apiUrl || localStorage.getItem('API_URL')

    if (!effectiveToken) {
      navigate('/login')
      return
    }

    if (!token) {
      syncFromStorage()
    }

    let activeStompClient: Client | null = null

    const initData = async () => {
      try {
        const meRes = await fetch(`${effectiveApiUrl}/user/me`, { headers: { Authorization: `Bearer ${effectiveToken}` } })
        if (!meRes.ok) throw new Error('Sessão expirada')
        const userData = (await meRes.json()).data
        setCurrentUser(userData)

        const chRes = await fetch(`${effectiveApiUrl}/channels/@me`, { headers: { Authorization: `Bearer ${effectiveToken}` } })
        const chData = (await chRes.json()).data || []
        setDmChannels(chData)

        const srvRes = await fetch(`${effectiveApiUrl}/server/@me`, { headers: { Authorization: `Bearer ${effectiveToken}` } })
        let loadedServers: any[] = []
        if (srvRes.ok) {
          const srvData = await srvRes.json()
          loadedServers = Array.isArray(srvData) ? srvData : srvData.data || []
          setServers(loadedServers)
        }

        const initialMsgs: Record<string, any[]> = {}
        chData.forEach((ch: any) => {
          initialMsgs[ch.id] = []
        })
        setMessages(initialMsgs)

        activeStompClient = new Client({
          webSocketFactory: () => new SockJS(`${effectiveApiUrl}/ws`),
          connectHeaders: { Authorization: `Bearer ${effectiveToken}` },
          onConnect: () => {
            // 1. Inscrever nos canais de DM existentes
            chData.forEach((ch: any) => {
              if (!subscribedChannels.current.has(ch.id)) {
                activeStompClient!.subscribe(`/topic/channel.${ch.id}`, handleIncomingMessage)
                subscribedChannels.current.add(ch.id)
              }
            })

            // 2. Inscrever nos servidores do usuário para receber eventos de canais
            loadedServers.forEach((srv: any) => {
              if (!subscribedServers.current.has(srv.id)) {
                activeStompClient!.subscribe(`/topic/server.${srv.id}.channels`, handleServerChannelEvent)
                subscribedServers.current.add(srv.id)
              }
            })

            // 3. Inscrever no canal pessoal de notificações de amizade e eventos do usuário
            if (userData?.id) {
              activeStompClient!.subscribe(`/topic/user.${userData.id}`, (msg) => {
                try {
                  const event = JSON.parse(msg.body)
                  if (
                    event.type === 'FRIEND_REQUEST_RECEIVED' ||
                    event.type === 'FRIEND_REQUEST_ACCEPTED'
                  ) {
                    // Recarrega canais de DM
                    fetch(`${effectiveApiUrl}/channels/@me`, {
                      headers: { Authorization: `Bearer ${effectiveToken}` }
                    })
                      .then((r) => r.json())
                      .then((res) => {
                        const updatedDMs = res.data || []
                        setDmChannels(updatedDMs)
                        // Inscreve no novo canal de DM se houver
                        updatedDMs.forEach((dm: any) => {
                          if (!subscribedChannels.current.has(dm.id) && activeStompClient?.connected) {
                            activeStompClient.subscribe(`/topic/channel.${dm.id}`, handleIncomingMessage)
                            subscribedChannels.current.add(dm.id)
                          }
                        })
                      })
                      .catch((err) => console.error('Erro ao recarregar DMs:', err))

                    // Avisa os componentes que a lista de amigos/pendentes mudou
                    window.dispatchEvent(new CustomEvent('friendship-updated'))
                  }
                } catch (err) {
                  console.error('Erro ao processar mensagem do usuário:', err)
                }
              })
            }
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
      if (activeStompClient) activeStompClient.deactivate()
    }
  }, [])

  // Atualização silenciosa dos canais e membros do servidor ativo
  useEffect(() => {
    if (!activeServerId) return

    const fetchServerData = async () => {
      try {
        // 1. Canais
        const res = await fetch(`${apiUrl}/server/${activeServerId}/channels`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          const fetchedChannels = Array.isArray(data) ? data : data.data || []

          setServerChannelsCache((prev) => ({ ...prev, [activeServerId]: fetchedChannels }))

          const isViewingCurrentServer = fetchedChannels.some((c: any) => c.id === viewingChannelId)
          if (!isViewingCurrentServer) {
            const toSelect =
              fetchedChannels.find((c: any) => c.id === lastVisitedChannel[activeServerId]) ||
              fetchedChannels.find((c: any) => c.type === 'SERVER_TEXT')
            if (toSelect) {
              handleSelectChannel(toSelect.id, activeServerId)
            }
          }

          if (stompClient && stompClient.connected) {
            fetchedChannels.forEach((ch: any) => {
              if (!subscribedChannels.current.has(ch.id)) {
                stompClient.subscribe(`/topic/channel.${ch.id}`, handleIncomingMessage)
                subscribedChannels.current.add(ch.id)
              }
            })

            if (!subscribedServers.current.has(activeServerId)) {
              stompClient.subscribe(`/topic/server.${activeServerId}.channels`, handleServerChannelEvent)
              subscribedServers.current.add(activeServerId)
            }
          }
        }

        // 2. Membros
        const membersRes = await fetch(`${apiUrl}/server/${activeServerId}/members`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (membersRes.ok) {
          const membersData = await membersRes.json()
          const fetchedMembers = Array.isArray(membersData) ? membersData : membersData.data || []
          setServerMembersCache((prev) => ({ ...prev, [activeServerId]: fetchedMembers }))
        }
      } catch (err) {
        console.error('Erro ao buscar dados do servidor', err)
      }
    }

    fetchServerData()
  }, [activeServerId, stompClient])

  const loadAudioDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      const inputs = devices.filter((d) => d.kind === 'audioinput')
      const outputs = devices.filter((d) => d.kind === 'audiooutput')
      setAudioInputs(inputs)
      setAudioOutputs(outputs)
      if (inputs.length > 0 && !selectedInput) setSelectedInput(inputs[0].deviceId)
      if (outputs.length > 0 && !selectedOutput) setSelectedOutput(outputs[0].deviceId)
    } catch (e) {
      console.error(e)
    }
  }

  const loadHistory = async (channelId: string) => {
    try {
      const res = await fetch(`${apiUrl}/channels/${channelId}/messages?page=0&size=50`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return
      const json = await res.json()
      const content = json.data?.content || []
      setMessages((prev) => ({ ...prev, [channelId]: content.reverse() }))
    } catch (err) {
      console.error('Erro ao buscar histórico', err)
    }
  }

  const handleSelectChannel = (channelId: string, serverIdToCache?: string) => {
    setViewingChannelId(channelId || null)

    const currentServer = serverIdToCache || activeServerId
    if (currentServer && channelId) {
      setLastVisitedChannel((prev) => ({ ...prev, [currentServer]: channelId }))
    }

    if (channelId && (!messages[channelId] || messages[channelId].length === 0)) {
      loadHistory(channelId)
    }
  }

  const handleSelectFriendByUsername = async (username: string) => {
    let targetChannel = dmChannels.find((ch) => {
      const friend = ch.members?.find((m: any) => m.id !== currentUser?.id)
      return friend?.username === username
    })

    if (!targetChannel) {
      try {
        const res = await fetch(`${apiUrl}/channels/@me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const json = await res.json()
          const chData = json.data || []
          setDmChannels(chData)
          targetChannel = chData.find((ch: any) => {
            const friend = ch.members?.find((m: any) => m.id !== currentUser?.id)
            return friend?.username === username
          })
        }
      } catch (err) {
        console.error('Erro ao buscar canal de DM:', err)
      }
    }

    if (targetChannel) handleSelectChannel(targetChannel.id)
  }

  const handleSendMessage = (content: string, attachments?: MessageAttachment[]) => {
    const validAttachments = (attachments || []).filter(
      (a) => Boolean(a && a.url && typeof a.url === 'string' && a.url.trim() !== '')
    )
    if (!content.trim() && validAttachments.length === 0) return
    if (!viewingChannelId || !stompClient) return

    stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        channelId: viewingChannelId,
        content: content.trim(),
        attachments: validAttachments.length > 0 ? validAttachments : null
      })
    })
  }

  const handleLogout = () => {
    setIsSettingsOpen(false)
    setIsPickerOpen(false)
    useModalStore.getState().setIsServerModalOpen(false)
    useModalStore.getState().setIsInviteModalOpen(false)
    logout()
    if (stompClient) stompClient.deactivate()
    if (livekitRoom) livekitRoom.disconnect()
    window.focus()
    navigate('/login')
  }

  // WebRTC / Chamadas de Voz
  const attachTrack = (track: any, participantIdentity: string, isLocal = false) => {
    if (isLocal && track.kind === 'audio') return

    const el = track.attach()
    el.id = `track-${track.sid}`

    if (track.kind === 'audio') {
      el.style.display = 'none'
      el.setAttribute('data-participant', participantIdentity)
      document.body.appendChild(el)
      if (selectedOutput && 'setSinkId' in el) {
        ;(el as any).setSinkId(selectedOutput).catch((err: any) => console.error('Erro sinkId:', err))
      }
      if (el instanceof HTMLAudioElement) {
        const userVol = useVoiceStore.getState().getUserVolume(participantIdentity)
        el.volume = Math.max(0, Math.min(1, userVol / 100))
        el.muted = isDeafened || userVol === 0
        el.play().catch((e) => console.error('Autoplay bloqueado:', e))
      }
      return
    }

    el.style.width = '100%'
    el.style.height = '100%'
    el.style.objectFit = 'contain'
    el.style.position = 'absolute'
    el.style.top = '0'
    el.style.left = '0'
    el.style.zIndex = '10'
    el.style.backgroundColor = 'black'

    const containerId = isLocal ? 'tile-local' : `tile-${participantIdentity}`
    const container = document.getElementById(containerId)
    if (container) container.appendChild(el)
  }

  const handleJoinCall = async (channelId: string) => {
    if (inCall && activeVoiceChannelId === channelId) return

    // Se o usuário já estiver em outro canal de voz, desconecta de forma limpa da sala anterior
    if (livekitRoom) {
      try {
        await livekitRoom.disconnect()
      } catch (err) {
        console.error('Erro ao desconectar do canal de voz anterior:', err)
      }
      setLivekitRoom(null)
    }

    if (screenTrack) {
      screenTrack.stop()
      setScreenTrack(null)
    }

    setIsSharingScreen(false)
    setRemoteParticipants([])
    document.querySelectorAll('audio[id^="track-"]').forEach((el) => el.remove())

    try {
      const res = await fetch(`${apiUrl}/calls/${channelId}/token`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Sem permissão para chamada')
      const { data: { token: roomToken } } = await res.json()

      const room = new Room({ publishDefaults: { videoCodec: 'vp8' } })
      setLivekitRoom(room)

      room.on(RoomEvent.ParticipantConnected, (p) =>
        setRemoteParticipants((prev) => (!prev.includes(p.identity) ? [...prev, p.identity] : prev))
      )
      room.on(RoomEvent.ParticipantDisconnected, (p) =>
        setRemoteParticipants((prev) => prev.filter((id) => id !== p.identity))
      )
      room.on(RoomEvent.TrackSubscribed, (track, _pub, p) => attachTrack(track, p.identity))
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach()
        document.getElementById(`track-${track.sid}`)?.remove()
      })
      room.on(RoomEvent.LocalTrackPublished, (pub) => {
        if (pub.track) attachTrack(pub.track, 'Você', true)
      })
      room.on(RoomEvent.LocalTrackUnpublished, (pub) => {
        if (pub.track) {
          pub.track.detach()
          document.getElementById(`track-${pub.track.sid}`)?.remove()
        }
      })

      await room.connect(livekitUrl, roomToken, {
        rtcConfig: {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }]
        }
      })

      setRemoteParticipants(Array.from(room.remoteParticipants.values()).map((p) => p.identity))
      setInCall(true)
      setActiveVoiceChannelId(channelId)
      setViewingChannelId(channelId)
      setDmVoiceViewMode('voice')

      try {
        await room.localParticipant.setMicrophoneEnabled(!isMuted)
        if (selectedInput) await room.switchActiveDevice('audioinput', selectedInput)
      } catch (micError) {
        console.error(micError)
      }
    } catch (err: any) {
      setInCall(false)
      setActiveVoiceChannelId(null)
      alert(err.message || 'Erro ao conectar ao canal de voz.')
    }
  }

  const handleLeaveCall = async () => {
    if (livekitRoom) {
      try {
        await livekitRoom.disconnect()
      } catch (err) {
        console.error('Erro ao desconectar da chamada:', err)
      }
    }
    if (screenTrack) {
      screenTrack.stop()
      setScreenTrack(null)
    }
    setLivekitRoom(null)
    setInCall(false)
    setIsSharingScreen(false)
    setRemoteParticipants([])
    setActiveVoiceChannelId(null)

    const serverChannels = activeServerId ? serverChannelsCache[activeServerId] || [] : []
    if (viewingChannelId === activeVoiceChannelId) {
      const firstText = serverChannels.find((c) => c.type === 'SERVER_TEXT')
      if (firstText) setViewingChannelId(firstText.id)
    }

    document.querySelectorAll('audio[id^="track-"]').forEach((el) => el.remove())
  }

  const toggleMute = async (forceState?: boolean) => {
    const currentMuted = useVoiceStore.getState().isMuted
    const currentDeafened = useVoiceStore.getState().isDeafened
    const room = useVoiceStore.getState().livekitRoom

    const nextMuted = typeof forceState === 'boolean' ? forceState : !currentMuted
    setIsMuted(nextMuted)

    if (!nextMuted && currentDeafened) {
      setIsDeafened(false)
      document.querySelectorAll('audio').forEach((el) => {
        if (el instanceof HTMLAudioElement) {
          const participant = el.getAttribute('data-participant')
          const userVol = participant ? useVoiceStore.getState().getUserVolume(participant) : 100
          el.muted = userVol === 0
        }
      })
    }
    if (room?.localParticipant) {
      try {
        await room.localParticipant.setMicrophoneEnabled(!nextMuted)
      } catch (err) {
        console.error('Erro ao alternar microfone no LiveKit:', err)
      }
    }
  }

  const toggleDeafen = async () => {
    const currentDeaf = useVoiceStore.getState().isDeafened
    const currentMuted = useVoiceStore.getState().isMuted

    const nextDeaf = !currentDeaf
    setIsDeafened(nextDeaf)

    if (nextDeaf) {
      wasMutedRef.current = currentMuted
      if (!currentMuted) await toggleMute(true)
    } else {
      if (currentMuted && !wasMutedRef.current) await toggleMute(false)
    }

    document.querySelectorAll('audio').forEach((el) => {
      if (el instanceof HTMLAudioElement) {
        const participant = el.getAttribute('data-participant')
        const userVol = participant ? useVoiceStore.getState().getUserVolume(participant) : 100
        el.muted = nextDeaf || userVol === 0
      }
    })
  }

  // Atalhos de teclado (Locais e Globais via IPC)
  useEffect(() => {
    // Sincroniza atalhos com o Electron
    useKeybindStore.getState().syncWithElectron()

    // Listener de Atalhos Globais (via IPC do Electron)
    const removeIpc = window.electron?.ipcRenderer?.on('trigger-action', (_, action) => {
      if (action === 'toggleDeafen') {
        toggleDeafen()
      } else if (action === 'toggleMute') {
        toggleMute()
      }
    })

    // Listener de Atalhos Locais (quando a janela está em foco)
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true'

      const currentKeybinds = useKeybindStore.getState().keybinds

      // Testa primeiro o atalho composto de Ensurdecer / Mutar Geral
      if (matchesKeybind(e, currentKeybinds.toggleDeafen)) {
        const hasModifier = e.ctrlKey || e.altKey || e.metaKey || e.shiftKey
        if (!isInput || hasModifier) {
          e.preventDefault()
          toggleDeafen()
        }
      } else if (matchesKeybind(e, currentKeybinds.toggleMute)) {
        const hasModifier = e.ctrlKey || e.altKey || e.metaKey || e.shiftKey
        if (!isInput || hasModifier) {
          e.preventDefault()
          toggleMute()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (typeof removeIpc === 'function') {
        removeIpc()
      } else {
        window.electron?.ipcRenderer?.removeAllListeners('trigger-action')
      }
    }
  }, [])

  const handleShareScreen = async () => {
    if (!livekitRoom) return
    if (isSharingScreen && screenTrack) {
      await livekitRoom.localParticipant.unpublishTrack(screenTrack)
      screenTrack.stop()
      setScreenTrack(null)
      setIsSharingScreen(false)
      return
    }
    try {
      // @ts-ignore
      const sources = await window.electron.ipcRenderer.invoke('get-desktop-sources')
      setScreenSources(sources)
      setIsPickerOpen(true)
    } catch {
      alert('Não foi possível acessar a lista de telas do sistema.')
    }
  }

  const confirmScreenShare = async (sourceId: string, quality: 'boa' | 'muito_boa' | 'excelente' | 'insana') => {
    setIsPickerOpen(false)

    const qualitySpecs = {
      boa: { width: 1280, height: 720, fps: 60, bitrate: 3_000_000 },
      muito_boa: { width: 1920, height: 1080, fps: 60, bitrate: 6_000_000 },
      excelente: { width: 1920, height: 1080, fps: 60, bitrate: 10_000_000 },
      insana: { width: 2560, height: 1440, fps: 60, bitrate: 20_000_000 }
    }

    const specs = qualitySpecs[quality]

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            maxWidth: specs.width,
            maxHeight: specs.height,
            maxFrameRate: specs.fps
          }
        } as any
      })

      const videoTrack = stream.getVideoTracks()[0]
      const localTrack = new LocalVideoTrack(videoTrack)

      await livekitRoom!.localParticipant.publishTrack(localTrack, {
        name: 'screen',
        source: Track.Source.ScreenShare,
        videoEncoding: {
          maxBitrate: specs.bitrate,
          maxFramerate: specs.fps
        }
      })

      videoTrack.onended = () => {
        livekitRoom!.localParticipant.unpublishTrack(localTrack)
        setScreenTrack(null)
        setIsSharingScreen(false)
      }

      setScreenTrack(localTrack)
      setIsSharingScreen(true)
    } catch (err) {
      console.error('Erro ao iniciar captura:', err)
      alert('Permissão negada ou erro ao capturar a janela.')
    }
  }

  // Determinar visualização ativa
  const serverChannels = activeServerId ? serverChannelsCache[activeServerId] || [] : []
  const allChannels = [...dmChannels, ...serverChannels]
  const viewingChannel = allChannels.find((c) => c.id === viewingChannelId)
  const isServerChannel = !!serverChannels.find((c) => c.id === viewingChannelId)
  const isDMVoiceActive = !isServerChannel && inCall && activeVoiceChannelId === viewingChannelId
  const isViewingVoice =
    viewingChannel?.type === 'SERVER_VOICE' || (isDMVoiceActive && dmVoiceViewMode === 'voice')

  // Amigo na conversa de DM ativa
  const dmFriendUser =
    !isServerChannel && viewingChannel
      ? viewingChannel?.members?.find((m) => m.id !== currentUser?.id)
      : undefined

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e1f22] overflow-hidden font-sans relative">
      {/* Barra de Título Superior */}
      <div className="h-[28px] w-full flex-shrink-0 drag-region flex items-center px-4 z-50">
        <span className="text-[#80848e] text-[11px] font-bold uppercase tracking-wider select-none">
          Opencord
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden bg-discord-bg text-discord-textNormal relative">
        {/* 1. Barra Lateral de Servidores */}
        <ServerSidebar />

        {/* 2. Barra de Canais */}
        <ChannelSidebar
          onSelectChannel={handleSelectChannel}
          onJoinVoice={(channelId) => {
            handleJoinCall(channelId)
            setViewingChannelId(channelId)
          }}
        />

        {/* 3. Dock Flutuante do Usuário e Voz (Estilo Discord - Sobrepõe Servidores e Canais) */}
        <div className="absolute bottom-2 left-2 z-30 flex flex-col gap-1.5 pointer-events-none w-[296px]">
          <div className="pointer-events-auto">
            <VoiceStatusBar onDisconnect={handleLeaveCall} onShareScreen={handleShareScreen} />
          </div>
          <div className="pointer-events-auto">
            <UserFooter onToggleMute={toggleMute} onToggleDeafen={toggleDeafen} />
          </div>
        </div>

        {/* 4. Área Principal */}
        <div className="flex-1 flex bg-[#313338] relative overflow-hidden">
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {viewingChannelId ? (
              isViewingVoice ? (
                <VoiceArea
                  currentUser={currentUser}
                  remoteParticipants={remoteParticipants}
                  activeVoiceChannelId={activeVoiceChannelId}
                  viewingChannelId={viewingChannelId}
                  isMuted={isMuted}
                  isDeafened={isDeafened}
                  isSharingScreen={isSharingScreen}
                  room={livekitRoom}
                  channelTitle={
                    isServerChannel
                      ? viewingChannel?.name
                      : dmFriendUser?.username
                        ? `@${dmFriendUser.username}`
                        : undefined
                  }
                  isDM={!isServerChannel}
                  onOpenChat={isDMVoiceActive ? () => setDmVoiceViewMode('chat') : undefined}
                  onToggleMute={toggleMute}
                  onToggleDeafen={toggleDeafen}
                  onShareScreen={handleShareScreen}
                  onLeaveCall={handleLeaveCall}
                />
              ) : (
                <ChatArea
                  viewingChannel={viewingChannel}
                  currentUser={currentUser}
                  messages={messages[viewingChannelId] || []}
                  isServerChannel={isServerChannel}
                  inCall={inCall}
                  onStartCall={() => handleJoinCall(viewingChannelId)}
                  onToggleViewCall={isDMVoiceActive ? () => setDmVoiceViewMode('voice') : undefined}
                  onDisconnectCall={handleLeaveCall}
                  onSendMessage={handleSendMessage}
                />
              )
            ) : activeServerId === null ? (
              <Friends apiUrl={apiUrl} token={token} onSelectFriend={handleSelectFriendByUsername} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-discord-textMuted gap-2">
                <h3 className="text-lg font-bold text-white">Nenhum canal selecionado</h3>
                <p className="text-sm">Selecione um canal na barra lateral para começar a conversar.</p>
              </div>
            )}
          </div>

          {/* 4. Sidebar Direita (Membros do Servidor OU Perfil do Usuário em DM) */}
          {activeServerId !== null ? (
            <ServerMemberSidebar />
          ) : (
            viewingChannelId && !isServerChannel && dmFriendUser && (
              <DMUserProfileSidebar user={dmFriendUser} />
            )
          )}
        </div>
      </div>

      {/* Modais Globais */}
      <ServerModal />
      <ServerInvitesModal />
      <ServerSettingsModal />
      <CreateChannelModal />
      <DeleteChannelModal />

      {isPickerOpen && (
        <ScreenPicker
          sources={screenSources}
          onSelect={confirmScreenShare}
          onClose={() => setIsPickerOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <Settings
          audioInputs={audioInputs}
          audioOutputs={audioOutputs}
          selectedInput={selectedInput}
          selectedOutput={selectedOutput}
          onInputChange={async (deviceId) => {
            setSelectedInput(deviceId)
            if (livekitRoom) await livekitRoom.switchActiveDevice('audioinput', deviceId)
          }}
          onOutputChange={(deviceId) => {
            setSelectedOutput(deviceId)
            document.querySelectorAll('audio[id^="track-"]').forEach((el) => {
              if ('setSinkId' in el) {
                ;(el as any).setSinkId(deviceId).catch((err: any) => console.error('Erro sinkId:', err))
              }
            })
          }}
          onClose={() => setIsSettingsOpen(false)}
          onLogout={() => {
            setIsSettingsOpen(false)
            handleLogout()
          }}
        />
      )}
    </div>
  )
}