import { useState } from 'react'

interface UserAvatarProps {
  username?: string
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  status?: 'online' | 'offline' | 'idle' | 'dnd'
  className?: string
}

const sizeMap = {
  xs: { box: 'w-6 h-6 text-xs', indicator: 'w-2 h-2' },
  sm: { box: 'w-8 h-8 text-sm', indicator: 'w-2.5 h-2.5' },
  md: { box: 'w-10 h-10 text-base', indicator: 'w-3 h-3' },
  lg: { box: 'w-12 h-12 text-lg', indicator: 'w-3.5 h-3.5' },
  xl: { box: 'w-16 h-16 text-2xl', indicator: 'w-4 h-4' },
  '2xl': { box: 'w-20 h-20 text-3xl', indicator: 'w-5 h-5' }
}

export function UserAvatar({
  username = 'U',
  avatarUrl,
  size = 'md',
  status,
  className = ''
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)
  const initial = username ? username.charAt(0).toUpperCase() : 'U'
  const config = sizeMap[size] || sizeMap.md

  const statusColors = {
    online: 'bg-green-500',
    idle: 'bg-amber-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-400'
  }

  return (
    <div className={`relative inline-block flex-shrink-0 select-none ${className}`}>
      <div
        className={`${config.box} rounded-full overflow-hidden flex items-center justify-center font-bold text-white shadow-sm bg-discord-blurple`}
      >
        {avatarUrl && !imageError ? (
          <img
            src={avatarUrl}
            alt={username}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      {status && (
        <div
          className={`absolute bottom-0 right-0 ${config.indicator} ${statusColors[status]} border-2 border-[#313338] rounded-full`}
        />
      )}
    </div>
  )
}
