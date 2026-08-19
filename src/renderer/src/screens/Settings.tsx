import { useEffect, useState } from 'react'
import { X, Volume2, LogOut } from 'lucide-react'

export function Settings({ 
  audioInputs, 
  audioOutputs, 
  selectedInput, 
  selectedOutput, 
  onInputChange, 
  onOutputChange, 
  onClose,
  onLogout
}: {
  audioInputs: MediaDeviceInfo[]
  audioOutputs: MediaDeviceInfo[]
  selectedInput: string
  selectedOutput: string
  onInputChange: (id: string) => void
  onOutputChange: (id: string) => void
  onClose: () => void
  onLogout: () => void
}) {
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  // Adiciona o listener para fechar ao apertar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className="absolute inset-0 z-50 bg-[#1e1f22]/80 backdrop-blur-sm flex justify-center items-center p-6 animate-in fade-in duration-150">
      
      {/* Caixa do Modal Centralizada */}
      <div className="relative w-full max-w-[960px] h-[85vh] bg-[#313338] rounded-lg shadow-2xl flex overflow-hidden border border-[#232428]">
        
        {/* Menu Lateral das Configurações */}
        <div className="w-[230px] bg-[#2b2d31] flex flex-col items-end py-10 pr-6 gap-2 flex-shrink-0 border-r border-[#1f2023]">
          <span className="text-xs font-bold text-discord-textMuted uppercase w-full max-w-[190px] mb-1">Configurações de Usuário</span>
          <button className="w-full max-w-[190px] text-left px-3 py-2 rounded bg-[#404249] text-white font-medium text-sm flex items-center gap-2 cursor-pointer">
            <Volume2 size={16} />
            Voz e Vídeo
          </button>

          <div className="w-full max-w-[190px] h-[1px] bg-[#35373c] my-2"></div>

          {!confirmingLogout ? (
            <button 
              onClick={() => setConfirmingLogout(true)}
              className="w-full max-w-[190px] text-left px-3 py-2 rounded text-discord-danger hover:bg-discord-danger/10 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              Sair da Conta
            </button>
          ) : (
            <div className="w-full max-w-[190px] flex flex-col gap-2 p-2.5 rounded bg-[#1e1f22] border border-discord-danger/40">
              <span className="text-xs text-white font-semibold">Deseja realmente sair?</span>
              <div className="flex gap-2">
                <button
                  onClick={onLogout}
                  className="flex-1 bg-discord-danger hover:bg-red-700 text-white text-xs py-1.5 rounded font-bold transition-colors cursor-pointer"
                >
                  Sair
                </button>
                <button
                  onClick={() => setConfirmingLogout(false)}
                  className="flex-1 bg-[#35373c] hover:bg-[#404249] text-discord-textNormal text-xs py-1.5 rounded font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo das Configurações */}
        <div className="flex-1 p-10 overflow-y-auto">
          <h2 className="text-xl font-bold text-white mb-6">Configurações de Voz e Vídeo</h2>

          <div className="flex flex-col gap-6 max-w-[680px]">
            {/* Seletor de Entrada (Microfone) */}
            <div>
              <label className="block text-xs font-bold uppercase text-discord-textMuted mb-2">Dispositivo de Entrada (Microfone)</label>
              <select 
                value={selectedInput}
                onChange={(e) => onInputChange(e.target.value)}
                className="w-full bg-[#1e1f22] border border-[#111214] rounded p-2.5 text-white outline-none focus:border-discord-link cursor-pointer"
              >
                {audioInputs.map(input => (
                  <option key={input.deviceId} value={input.deviceId}>
                    {input.label || `Microfone (${input.deviceId.slice(0, 5)}...)`}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Saída (Fone/Caixa de som) */}
            <div>
              <label className="block text-xs font-bold uppercase text-discord-textMuted mb-2">Dispositivo de Saída (Fone / Caixa de Som)</label>
              <select 
                value={selectedOutput}
                onChange={(e) => onOutputChange(e.target.value)}
                className="w-full bg-[#1e1f22] border border-[#111214] rounded p-2.5 text-white outline-none focus:border-discord-link cursor-pointer"
              >
                {audioOutputs.map(output => (
                  <option key={output.deviceId} value={output.deviceId}>
                    {output.label || `Alto-falante (${output.deviceId.slice(0, 5)}...)`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Botão ESC / Fechar no canto superior direito do modal */}
        <div className="absolute top-6 right-6 flex flex-col items-center cursor-pointer group z-10" onClick={onClose}>
          <div className="w-9 h-9 rounded-full border-2 border-discord-textMuted flex items-center justify-center text-discord-textMuted group-hover:border-white group-hover:text-white transition-colors">
            <X size={18} />
          </div>
          <span className="text-[10px] text-discord-textMuted font-bold mt-1 uppercase group-hover:text-white transition-colors">ESC</span>
        </div>

      </div>
    </div>
  )
}