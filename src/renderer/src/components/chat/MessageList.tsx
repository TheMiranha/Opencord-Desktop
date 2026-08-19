import React, { useRef, useEffect } from 'react'
import { MessageItem } from './MessageItem'
import { Message, Channel, User } from '../../types'
import { useServerStore } from '../../stores/useServerStore'

interface MessageListProps {
  messages: Message[]
  currentUser: User | null
  activeChannel: Channel | undefined
  isServerChannel: boolean
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  activeChannel,
  isServerChannel
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { activeServerId, serverMembersCache } = useServerStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {messages.map((msg, idx) => {
        const isMe = msg.senderId === currentUser?.id

        let senderName = msg.senderUsername
        let senderAvatarUrl = msg.senderAvatarUrl

        if (isMe) {
          senderName = senderName || currentUser?.username || 'Você'
          senderAvatarUrl = senderAvatarUrl || currentUser?.avatarUrl
        } else if (isServerChannel && activeServerId) {
          const serverMember = serverMembersCache[activeServerId]?.find(
            (m) => m.userId === msg.senderId
          )
          senderName = senderName || serverMember?.username
          senderAvatarUrl = senderAvatarUrl || serverMember?.avatarUrl
        } else if (activeChannel?.members) {
          const friend = activeChannel.members.find((m) => m.id === msg.senderId)
          senderName = senderName || friend?.username
          senderAvatarUrl = senderAvatarUrl || friend?.avatarUrl
        }

        if (!senderName) {
          senderName = isMe ? currentUser?.username || 'Você' : 'Usuário'
        }

        return (
          <MessageItem
            key={msg.id || idx}
            message={msg}
            currentUser={currentUser}
            senderName={senderName}
            senderAvatarUrl={senderAvatarUrl}
          />
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
