import { useState, useEffect } from 'react'

export function ScreenPicker({ 
  sources, 
  onSelect, 
  onClose 
}: { 
  sources: any[]; 
  onSelect: (sourceId: string) => void; 
  onClose: () => void 
}) {
  const [tab, setTab] = useState<'screens' | 'windows'>('screens')

  // Separa o que é monitor inteiro e o que é janela de aplicativo
  const screens = sources.filter(s => s.id.startsWith('screen'))
  const windows = sources.filter(s => s.id.startsWith('window'))

  // Fecha no ESC
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
          onClick={() => onSelect(s.id)} 
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
        
        {/* Cabeçalho do Modal */}
        <div className="p-6 pb-0 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Compartilhar Tela</h2>
            <button onClick={onClose} className="text-discord-textMuted hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Abas */}
          <div className="flex gap-6 border-b border-[#3f4147]">
            <button 
              onClick={() => setTab('screens')}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${tab === 'screens' ? 'text-white border-discord-blurple' : 'text-discord-textMuted border-transparent hover:text-discord-textNormal'}`}
            >
              Telas
            </button>
            <button 
              onClick={() => setTab('windows')}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${tab === 'windows' ? 'text-white border-discord-blurple' : 'text-discord-textMuted border-transparent hover:text-discord-textNormal'}`}
            >
              Aplicativos
            </button>
          </div>
        </div>

        {/* Grade de Miniaturas */}
        <div className="bg-[#2b2d31] flex-1">
          {tab === 'screens' ? renderGrid(screens) : renderGrid(windows)}
        </div>

      </div>
    </div>
  )
}