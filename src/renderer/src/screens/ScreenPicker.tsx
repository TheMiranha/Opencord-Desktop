import { useState, useEffect } from 'react'
import { X, Monitor, AppWindow } from 'lucide-react'

export type ScreenQuality = 'boa' | 'muito_boa' | 'excelente' | 'insana'

export function ScreenPicker({ 
  sources, 
  onSelect, 
  onClose 
}: { 
  sources: any[]; 
  onSelect: (sourceId: string, quality: ScreenQuality) => void; 
  onClose: () => void 
}) {
  const [tab, setTab] = useState<'screens' | 'windows'>('screens')
  const [quality, setQuality] = useState<ScreenQuality>('boa')

  const screens = sources.filter(s => s.id.startsWith('screen'))
  const windows = sources.filter(s => s.id.startsWith('window'))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const renderGrid = (items: any[]) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 overflow-y-auto max-h-[60vh]">
      {items.map(s => (
        <div 
          key={s.id} 
          onClick={() => onSelect(s.id, quality)} 
          className="flex flex-col items-center p-2 rounded-lg hover:bg-[#3f4147] cursor-pointer group transition-colors"
        >
          <img 
            src={s.thumbnail} 
            alt={s.name} 
            className="w-full aspect-video object-cover rounded border-2 border-transparent group-hover:border-discord-blurple transition-colors shadow-md bg-black" 
          />
          <span className="text-white text-xs mt-2 truncate w-full text-center font-medium">
            {s.name}
          </span>
        </div>
      ))}
      {items.length === 0 && <div className="text-discord-textMuted col-span-3 text-center py-10">Nenhuma fonte encontrada.</div>}
    </div>
  )

  return (
    <div className="absolute inset-0 z-50 bg-[#1e1f22]/80 backdrop-blur-sm flex justify-center items-center p-6 animate-in fade-in duration-150">
      
      <div className="relative w-full max-w-[800px] bg-[#313338] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-[#232428]">
        
        <div className="p-6 pb-0 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Monitor size={22} className="text-discord-blurple" />
              Compartilhar Tela
            </h2>
            <button onClick={onClose} className="text-discord-textMuted hover:text-white transition-colors cursor-pointer">
              <X size={22} />
            </button>
          </div>

          <div className="flex justify-between items-center border-b border-[#3f4147]">
            <div className="flex gap-6">
              <button 
                onClick={() => setTab('screens')}
                className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${tab === 'screens' ? 'text-white border-discord-blurple' : 'text-discord-textMuted border-transparent hover:text-discord-textNormal'}`}
              >
                <Monitor size={16} />
                Telas
              </button>
              <button 
                onClick={() => setTab('windows')}
                className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${tab === 'windows' ? 'text-white border-discord-blurple' : 'text-discord-textMuted border-transparent hover:text-discord-textNormal'}`}
              >
                <AppWindow size={16} />
                Aplicativos
              </button>
            </div>
            
            {/* Seletor de Qualidade */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-discord-textMuted uppercase">Qualidade:</span>
              <select 
                value={quality}
                onChange={(e) => setQuality(e.target.value as ScreenQuality)}
                className="bg-[#1e1f22] text-white text-xs p-1.5 rounded outline-none border border-[#111214] focus:border-discord-blurple cursor-pointer"
              >
                <option value="boa">Boa (720p60 - 3 Mbps)</option>
                <option value="muito_boa">Muito Boa (1080p60 - 6 Mbps)</option>
                <option value="excelente">Excelente (1080p60 - 10 Mbps)</option>
                <option value="insana">Insana (1440p60 - 20 Mbps)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#2b2d31] flex-1">
          {tab === 'screens' ? renderGrid(screens) : renderGrid(windows)}
        </div>

      </div>
    </div>
  )
}