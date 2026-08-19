import { create } from 'zustand'
import { Client } from '@stomp/stompjs'
import { Message } from '../types'

interface ChatState {
  messages: Record<string, Message[]>
  stompClient: Client | null
  setMessages: (
    messages: Record<string, Message[]> | ((prev: Record<string, Message[]>) => Record<string, Message[]>)
  ) => void
  setStompClient: (client: Client | null) => void
  addMessage: (channelId: string, message: Message) => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: {},
  stompClient: null,
  setMessages: (messages) =>
    set((state) => ({
      messages: typeof messages === 'function' ? messages(state.messages) : messages
    })),
  setStompClient: (stompClient) => set({ stompClient }),
  addMessage: (channelId, message) =>
    set((state) => {
      const channelMsgs = state.messages[channelId] || []
      if (message.id && channelMsgs.some((m) => m.id === message.id)) {
        return state
      }
      return {
        messages: {
          ...state.messages,
          [channelId]: [...channelMsgs, message]
        }
      }
    })
}))
