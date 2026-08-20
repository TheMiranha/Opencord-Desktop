import React from 'react'

interface OpencordLogoProps {
  className?: string
  size?: number
  withBackground?: boolean
}

export const OpencordLogo: React.FC<OpencordLogoProps> = ({
  className = '',
  size = 28,
  withBackground = false
}) => {
  if (withBackground) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id="opBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5865F2" />
            <stop offset="100%" stopColor="#3B44B0" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="128" fill="url(#opBgGrad)" />
        <path
          d="M140 130 C 80 130, 80 290, 80 290 C 80 370, 160 370, 160 370 L 160 410 C 160 420, 175 425, 185 415 L 235 370 L 372 370 C 432 370, 432 290, 432 290 C 432 130, 372 130, 372 130 Z"
          fill="#FFFFFF"
        />
        <circle cx="195" cy="245" r="28" fill="#5865F2" />
        <circle cx="317" cy="245" r="28" fill="#5865F2" />
        <path
          d="M 235 245 Q 256 265 277 245"
          stroke="#5865F2"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M140 130 C 80 130, 80 290, 80 290 C 80 370, 160 370, 160 370 L 160 410 C 160 420, 175 425, 185 415 L 235 370 L 372 370 C 432 370, 432 290, 432 290 C 432 130, 372 130, 372 130 Z"
        fill="currentColor"
      />
      <circle cx="195" cy="245" r="28" fill="var(--bg-cutout, #1e1f22)" />
      <circle cx="317" cy="245" r="28" fill="var(--bg-cutout, #1e1f22)" />
      <path
        d="M 235 245 Q 256 265 277 245"
        stroke="var(--bg-cutout, #1e1f22)"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
