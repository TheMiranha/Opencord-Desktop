import React from 'react'
import { useServerStore } from '../../stores/useServerStore'
import { DMChannelList } from './DMChannelList'
import { ServerHeader } from '../server/ServerHeader'
import { ServerChannelList } from './ServerChannelList'
import { VoiceStatusBar } from '../voice/VoiceStatusBar'
import { UserFooter } from '../user/UserFooter'

interface ChannelSidebarProps {
  onSelectChannel: (channelId: string) => void
  onJoinVoice: (channelId: string) => void
  onLeaveCall: () => void
  onShareScreen: () => void
  onToggleMute: () => void
  onToggleDeafen: () => void
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  onSelectChannel,
  onJoinVoice,
  onLeaveCall,
  onShareScreen,
  onToggleMute,
  onToggleDeafen
}) => {
  const { activeServerId } = useServerStore()

  return (
    <div className="w-[240px] bg-[#2b2d31] flex flex-col flex-shrink-0 z-10 select-none">
      {activeServerId === null ? (
        <DMChannelList onSelectChannel={onSelectChannel} />
      ) : (
        <>
          <ServerHeader />
          <ServerChannelList
            onSelectChannel={onSelectChannel}
            onJoinVoice={onJoinVoice}
          />
        </>
      )}

      <VoiceStatusBar onDisconnect={onLeaveCall} onShareScreen={onShareScreen} />
      <UserFooter onToggleMute={onToggleMute} onToggleDeafen={onToggleDeafen} />
    </div>
  )
}
