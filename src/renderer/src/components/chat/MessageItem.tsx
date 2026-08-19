import React from 'react'
import { Message, User } from '../../types'

interface MessageItemProps {
  message: Message
  currentUser: User | null
  senderName: string
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  senderName
}) => {
  const timeFormatted = new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="flex gap-4 hover:bg-[#2e3035] p-1 -mx-1 rounded group">
      <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity">
        {senderName.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-white font-medium hover:underline cursor-pointer">{senderName}</span>
          <span className="text-xs text-discord-textMuted">{timeFormatted}</span>
        </div>
        <span className="text-discord-textNormal whitespace-pre-wrap">{message.content}</span>
      </div>
    </div>
  )
}
