import React, { useState } from 'react'
import { SendHorizontal } from 'lucide-react'

interface MessageInputProps {
  channelName: string
  isServerChannel: boolean
  onSendMessage: (text: string) => void
}

export const MessageInput: React.FC<MessageInputProps> = ({
  channelName,
  isServerChannel,
  onSendMessage
}) => {
  const [inputText, setInputText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return
    onSendMessage(inputText.trim())
    setInputText('')
  }

  return (
    <div className="p-4 pt-0 flex-shrink-0 z-10">
      <form
        onSubmit={handleSubmit}
        className="bg-[#383a40] flex items-center rounded-lg pl-4 pr-2 py-1.5 focus-within:ring-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Conversar em ${isServerChannel ? '#' : '@'}${channelName}`}
          className="bg-transparent flex-1 outline-none text-discord-textNormal placeholder-discord-textMuted py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="ml-2 text-discord-textMuted hover:text-white disabled:opacity-30 disabled:hover:text-discord-textMuted p-2 rounded-full hover:bg-discord-blurple transition-colors cursor-pointer"
        >
          <SendHorizontal size={20} />
        </button>
      </form>
    </div>
  )
}
