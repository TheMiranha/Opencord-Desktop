export interface User {
  id: string
  username: string
  email?: string
}

export interface Server {
  id: string
  name: string
  iconUrl?: string | null
}

export type ChannelType = 'SERVER_TEXT' | 'SERVER_VOICE' | 'DM'

export interface Channel {
  id: string
  name: string
  type: ChannelType
  serverId?: string
  members?: User[]
}

export interface Message {
  id?: string
  channelId: string
  senderId: string
  senderUsername?: string
  content: string
  createdAt?: string
}

export interface ServerInvite {
  id: string
  code: string
  serverId: string
  inviterUsername: string
  createdAt: string
}

export interface ServerMember {
  id: string
  userId: string
  username: string
  role: 'ADMIN' | 'MEMBER' | string
}
