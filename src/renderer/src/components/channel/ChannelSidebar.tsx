import React from 'react'
import { useServerStore } from '../../stores/useServerStore'
import { DMChannelList } from './DMChannelList'
import { ServerHeader } from '../server/ServerHeader'
import { ServerChannelList } from './ServerChannelList'

interface ChannelSidebarProps {
  onSelectChannel: (channelId: string) => void
  onJoinVoice: (channelId: string) => void
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  onSelectChannel,
  onJoinVoice
}) => {
  const { activeServerId } = useServerStore()

  return (
    <div className="w-[240px] bg-[#2b2d31] flex flex-col flex-shrink-0 z-10 select-none h-full overflow-hidden">
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
    </div>
  )
}
