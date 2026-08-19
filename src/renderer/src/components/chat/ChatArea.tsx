import React from 'react'
import { ChannelHeader } from './ChannelHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { Channel, Message, User, MessageAttachment } from '../../types'

interface ChatAreaProps {
  viewingChannel: Channel | undefined
  currentUser: User | null
  messages: Message[]
  isServerChannel: boolean
  inCall: boolean
  onStartCall: () => void
  onToggleViewCall?: () => void
  onDisconnectCall?: () => void
  onSendMessage: (text: string, attachments?: MessageAttachment[]) => void
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  viewingChannel,
  currentUser,
  messages,
  isServerChannel,
  inCall,
  onStartCall,
  onToggleViewCall,
  onDisconnectCall,
  onSendMessage
}) => {
  let channelName = 'Desconhecido'
  if (isServerChannel) {
    channelName = viewingChannel?.name || 'Geral'
  } else {
    const friend = viewingChannel?.members?.find((m) => m.id !== currentUser?.id)
    if (friend) channelName = friend.username
  }

  const isVoice = viewingChannel?.type === 'SERVER_VOICE'

  return (
    <div className="flex-1 flex flex-col bg-[#313338] h-full overflow-hidden">
      <ChannelHeader
        channelName={channelName}
        isServerChannel={isServerChannel}
        isVoiceChannel={isVoice}
        inCall={inCall}
        onStartCall={onStartCall}
        onToggleViewCall={onToggleViewCall}
        onDisconnectCall={onDisconnectCall}
      />

      <MessageList
        messages={messages}
        currentUser={currentUser}
        activeChannel={viewingChannel}
        isServerChannel={isServerChannel}
      />

      <MessageInput
        channelName={channelName}
        isServerChannel={isServerChannel}
        onSendMessage={onSendMessage}
      />
    </div>
  )
}
