import React from 'react'
import { Mic, MicOff, Headphones, Monitor, PhoneOff } from 'lucide-react'

interface VoiceControlsProps {
  isMuted: boolean
  isDeafened: boolean
  isSharingScreen: boolean
  onToggleMute: () => void
  onToggleDeafen: () => void
  onShareScreen: () => void
  onLeaveCall: () => void
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isMuted,
  isDeafened,
  isSharingScreen,
  onToggleMute,
  onToggleDeafen,
  onShareScreen,
  onLeaveCall
}) => {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-[#1e1f22] p-2 rounded-2xl shadow-2xl border border-[#2b2d31] flex items-center gap-3 z-30 opacity-90 hover:opacity-100 transition-opacity">
      <button
        onClick={onToggleMute}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
          isMuted ? 'bg-[#da373c] text-white' : 'bg-[#2b2d31] text-discord-textNormal hover:bg-[#35373c]'
        }`}
        title={isMuted ? 'Desmutar' : 'Mutar'}
      >
        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
      </button>

      <button
        onClick={onToggleDeafen}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
          isDeafened ? 'bg-[#da373c] text-white' : 'bg-[#2b2d31] text-discord-textNormal hover:bg-[#35373c]'
        }`}
        title={isDeafened ? 'Desativar ensurdecer' : 'Ensurdecer'}
      >
        <Headphones size={22} />
      </button>

      <button
        onClick={onShareScreen}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
          isSharingScreen ? 'bg-discord-blurple text-white' : 'bg-[#2b2d31] text-discord-textNormal hover:bg-[#35373c]'
        }`}
        title={isSharingScreen ? 'Parar transmissão' : 'Compartilhar tela'}
      >
        <Monitor size={22} />
      </button>

      <button
        onClick={onLeaveCall}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-[#da373c] text-white hover:bg-[#a1282c] transition-colors cursor-pointer"
        title="Desconectar"
      >
        <PhoneOff size={22} />
      </button>
    </div>
  )
}
