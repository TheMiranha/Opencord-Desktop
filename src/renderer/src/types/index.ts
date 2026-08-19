export interface User {
  id: string
  username: string
  email?: string
  avatarUrl?: string | null
  bio?: string | null
  customStatus?: string | null
  createdAt?: string
}

export interface MutualServer {
  id: string
  name: string
  iconUrl?: string | null
}

export interface UserProfile {
  id: string
  username: string
  email?: string
  avatarUrl?: string | null
  bio?: string | null
  customStatus?: string | null
  createdAt: string
  updatedAt: string
  mutualFriendsCount: number
  mutualServers: MutualServer[]
  mutualServersCount: number
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

export interface MessageAttachment {
  url: string
  name: string
  size: number
  contentType: string
}

export interface Message {
  id?: string
  channelId: string
  senderId: string
  senderUsername?: string
  senderAvatarUrl?: string | null
  content: string
  attachments?: MessageAttachment[]
  createdAt?: string
}

export interface ServerInvite {
  id: string
  code: string
  serverId: string
  inviterUsername: string
  createdAt: string
}

export interface ServerRole {
  id: string
  serverId: string
  name: string
  color: string
  position: number
  permissions: number
}

export interface ServerBan {
  id: string
  userId: string
  username: string
  avatarUrl?: string | null
  reason?: string | null
  bannedByName: string
  createdAt: string
}

export interface ServerMember {
  id: string
  userId: string
  username: string
  avatarUrl?: string | null
  role: 'ADMIN' | 'MEMBER' | string
  roles?: ServerRole[]
}

export const SERVER_PERMISSIONS = {
  ADMINISTRATOR: 1 << 0, // 1
  MANAGE_SERVER: 1 << 1, // 2
  MANAGE_ROLES: 1 << 2,  // 4
  KICK_MEMBERS: 1 << 3,  // 8
  BAN_MEMBERS: 1 << 4,   // 16
  CREATE_INVITE: 1 << 5, // 32
  MANAGE_INVITES: 1 << 6 // 64
} as const

