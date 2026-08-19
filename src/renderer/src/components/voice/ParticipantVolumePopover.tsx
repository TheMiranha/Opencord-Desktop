import React from 'react'
import { Volume2, Volume1, VolumeX, RotateCcw } from 'lucide-react'
import { useVoiceStore } from '../../stores/useVoiceStore'

interface ParticipantVolumePopoverProps {
  identity: string
  onClose: () => void
  className?: string
}

export const ParticipantVolumePopover: React.FC<ParticipantVolumePopoverProps> = ({
  identity,
  onClose,
  className = ''
}) => {
  const { userVolumes, setUserVolume } = useVoiceStore()
  const currentVolume = typeof userVolumes[identity] === 'number' ? userVolumes[identity] : 100

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserVolume(identity, Number(e.target.value))
  }

  const toggleQuickMute = () => {
    if (currentVolume === 0) {
      setUserVolume(identity, 100)
    } else {
      setUserVolume(identity, 0)
    }
  }

  const resetVolume = () => {
    setUserVolume(identity, 100)
  }

  const getVolumeIcon = () => {
    if (currentVolume === 0) return <VolumeX size={16} className="text-discord-danger" />
    if (currentVolume < 50) return <Volume1 size={16} className="text-amber-400" />
    return <Volume2 size={16} className="text-green-400" />
  }

  return (
    <>
      {/* Backdrop transparente para fechar ao clicar fora */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className={`absolute z-50 bg-[#18191c] border border-[#2e3035] p-3 rounded-lg shadow-2xl w-60 text-left select-none animate-fadeIn ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-discord-textMuted uppercase tracking-wider truncate max-w-[150px]">
            {identity}
          </span>
          <span className="text-xs font-mono font-bold text-white bg-[#2b2d31] px-1.5 py-0.5 rounded">
            {currentVolume}%
          </span>
        </div>

        <div className="text-[11px] text-discord-textMuted mb-2">
          Volume do Usuário (Ajuste Individual)
        </div>

        {/* Slider de Volume */}
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={toggleQuickMute}
            className="p-1.5 rounded hover:bg-[#2b2d31] transition-colors cursor-pointer flex-shrink-0"
            title={currentVolume === 0 ? 'Desmutar' : 'Mutar usuário'}
          >
            {getVolumeIcon()}
          </button>

          <input
            type="range"
            min="0"
            max="200"
            step="1"
            value={currentVolume}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-[#4e5058] rounded-lg appearance-none cursor-pointer accent-discord-blurple"
          />
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2e3035]">
          <button
            type="button"
            onClick={toggleQuickMute}
            className={`text-xs px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
              currentVolume === 0
                ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
            }`}
          >
            {currentVolume === 0 ? 'Desmutar' : 'Mutar'}
          </button>

          <button
            type="button"
            onClick={resetVolume}
            disabled={currentVolume === 100}
            className="text-xs text-discord-textMuted hover:text-white disabled:opacity-30 px-2 py-1 rounded hover:bg-[#2b2d31] transition-colors flex items-center gap-1 cursor-pointer"
            title="Restaurar para 100%"
          >
            <RotateCcw size={12} />
            100%
          </button>
        </div>
      </div>
    </>
  )
}
