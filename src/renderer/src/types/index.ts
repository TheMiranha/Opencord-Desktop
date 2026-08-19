export interface User {
  id: string
  username: string
  email?: string
  avatarUrl?: string | null
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
  senderAvatarUrl?: string | null
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
  avatarUrl?: string | null
  role: 'ADMIN' | 'MEMBER' | string
}
