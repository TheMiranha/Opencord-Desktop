import React, { useState, useEffect } from 'react'
import { Keyboard, RotateCcw, X, Info, Check } from 'lucide-react'
import {
  useKeybindStore,
  KEYBIND_DEFINITIONS,
  KeybindAction,
  DEFAULT_KEYBINDS,
  isValidKeybind
} from '../../stores/useKeybindStore'

export const KeybindSettings: React.FC = () => {
  const { keybinds, setKeybind, resetKeybind, clearKeybind } = useKeybindStore()
  const [recordingAction, setRecordingAction] = useState<KeybindAction | null>(null)
  const [tempCombo, setTempCombo] = useState<string>('')

  const startRecording = (action: KeybindAction) => {
    setRecordingAction(action)
    setTempCombo(keybinds[action] || '')
  }

  const cancelRecording = () => {
    setRecordingAction(null)
    setTempCombo('')
  }

  const saveRecording = (action: KeybindAction) => {
    if (isValidKeybind(tempCombo)) {
      setKeybind(action, tempCombo)
    } else if (!tempCombo) {
      clearKeybind(action)
    }
    setRecordingAction(null)
    setTempCombo('')
  }

  useEffect(() => {
    if (!recordingAction) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Tecla Escape cancela a gravação
      if (e.key === 'Escape') {
        cancelRecording()
        return
      }

      // Tecla Enter confirma e salva (se válido)
      if (e.key === 'Enter') {
        if (isValidKeybind(tempCombo) || !tempCombo) {
          saveRecording(recordingAction)
        }
        return
      }

      // Backspace desvincula o atalho
      if (e.key === 'Backspace' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        setTempCombo('')
        return
      }

      const combo: string[] = []
      if (e.ctrlKey) combo.push('Ctrl')
      if (e.shiftKey) combo.push('Shift')
      if (e.altKey) combo.push('Alt')
      if (e.metaKey) combo.push('Meta')

      const keyName = e.key
      // Ignora eventos que são apenas o pressionar de teclas modificadoras isoladas
      if (!['Control', 'Shift', 'Alt', 'Meta', 'AltGraph'].includes(keyName)) {
        let normalizedKey = keyName.toUpperCase()
        if (keyName === ' ') normalizedKey = 'Space'
        if (e.code.startsWith('Key')) normalizedKey = e.code.replace('Key', '')
        if (e.code.startsWith('Digit')) normalizedKey = e.code.replace('Digit', '')
        if (e.code.startsWith('Numpad')) normalizedKey = e.code

        if (!combo.includes(normalizedKey)) {
          combo.push(normalizedKey)
        }

        const finalShortcut = combo.join('+')
        setTempCombo(finalShortcut)
      } else {
        if (combo.length > 0) {
          setTempCombo(combo.join('+'))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [recordingAction, tempCombo])

  const renderKeyBadges = (keybindStr: string) => {
    if (!keybindStr) {
      return (
        <span className="text-xs text-[#80848e] italic font-medium flex items-center gap-1">
          Desvinculado (Gravar)
        </span>
      )
    }

    const parts = keybindStr.split('+')
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {parts.map((k, idx) => (
          <kbd
            key={idx}
            className="px-2.5 py-1 bg-[#1e1f22] text-[#dbdee1] border border-[#111214] border-b-2 rounded text-xs font-mono font-bold shadow-sm"
          >
            {k.trim()}
          </kbd>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-[680px] text-left">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Keyboard size={22} className="text-discord-blurple" />
          Atalhos de Teclado (Shortcuts)
        </h2>
        <p className="text-sm text-discord-textMuted mt-1">
          Personalize os atalhos para controlar seu microfone e áudio durante chamadas.
        </p>
      </div>

      {/* Caixa de Informação */}
      <div className="bg-[#2b2d31] border border-[#1e1f22] rounded-lg p-3.5 mb-6 flex items-start gap-3 text-xs text-discord-textMuted leading-relaxed">
        <Info size={18} className="text-discord-blurple flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Atalhos Globais do Sistema:</strong> Os atalhos configurados
          aqui funcionam mesmo se o Opencord estiver minimizado ou enquanto você estiver jogando ou
          utilizando outros programas.
        </div>
      </div>

      {/* Lista de Atalhos */}
      <div className="flex flex-col gap-4">
        {KEYBIND_DEFINITIONS.map((def) => {
          const currentShortcut = keybinds[def.id]
          const isRecording = recordingAction === def.id
          const isDefault = currentShortcut === DEFAULT_KEYBINDS[def.id]
          const isTempValid = isValidKeybind(tempCombo)

          return (
            <div
              key={def.id}
              className={`p-4 rounded-lg bg-[#2b2d31] border transition-all ${
                isRecording
                  ? 'border-discord-blurple bg-[#2b2d31] ring-1 ring-discord-blurple'
                  : 'border-[#1e1f22]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-bold text-white mb-0.5">{def.label}</div>
                  <div className="text-xs text-discord-textMuted">{def.description}</div>
                </div>

                {/* Área de Controle do Atalho */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isRecording ? (
                    <div className="flex items-center gap-2 animate-fadeIn">
                      {/* Caixa de Visualização do Atalho sendo gravado */}
                      <div className="min-w-[140px] px-3 py-1.5 rounded text-xs font-semibold bg-[#1e1f22] border border-discord-blurple text-white flex items-center justify-center min-h-[34px]">
                        {tempCombo ? (
                          renderKeyBadges(tempCombo)
                        ) : (
                          <span className="text-discord-blurple animate-pulse">
                            Pressione as teclas...
                          </span>
                        )}
                      </div>

                      {/* Botão de Confirmar / Salvar */}
                      <button
                        type="button"
                        disabled={!isTempValid && tempCombo !== ''}
                        onClick={() => saveRecording(def.id)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md ${
                          isTempValid || tempCombo === ''
                            ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer'
                            : 'bg-green-600/40 text-white/50 cursor-not-allowed'
                        }`}
                        title={isTempValid ? 'Salvar este atalho' : 'Pressione uma tecla principal para completar o atalho'}
                      >
                        <Check size={15} />
                        Confirmar
                      </button>

                      {/* Botão de Cancelar */}
                      <button
                        type="button"
                        onClick={cancelRecording}
                        className="bg-[#35373c] hover:bg-[#404249] text-discord-textNormal px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                        title="Cancelar alteração"
                      >
                        <X size={15} />
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Botão para iniciar a gravação / editar */}
                      <button
                        type="button"
                        onClick={() => startRecording(def.id)}
                        className="min-w-[140px] px-3 py-2 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer bg-[#1e1f22] hover:bg-[#35373c] text-white border border-[#111214] hover:border-discord-blurple/50"
                        title="Clique para alterar este atalho"
                      >
                        {renderKeyBadges(currentShortcut)}
                      </button>

                      {/* Reset para Padrão */}
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => resetKeybind(def.id)}
                          className="p-2 rounded text-discord-textMuted hover:text-white hover:bg-[#35373c] transition-colors cursor-pointer"
                          title={`Restaurar para padrão (${DEFAULT_KEYBINDS[def.id] || 'Desvinculado'})`}
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}

                      {/* Limpar Atalho */}
                      {currentShortcut && (
                        <button
                          type="button"
                          onClick={() => clearKeybind(def.id)}
                          className="p-2 rounded text-discord-textMuted hover:text-red-400 hover:bg-[#35373c] transition-colors cursor-pointer"
                          title="Desvincular atalho"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {isRecording && (
                <div className="mt-3 pt-3 border-t border-[#35373c] flex items-center justify-between text-[11px] text-discord-textMuted animate-fadeIn">
                  <span>
                    Pressione as teclas desejadas (ex: <kbd className="px-1 py-0.5 bg-[#1e1f22] rounded text-white font-mono">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-[#1e1f22] rounded text-white font-mono">M</kbd>) e clique em{' '}
                    <strong className="text-green-400 font-semibold">Confirmar</strong>.
                  </span>
                  <span>
                    Aperte <kbd className="px-1 py-0.5 bg-[#1e1f22] rounded text-white font-mono">ESC</kbd> para cancelar
                    ou <kbd className="px-1 py-0.5 bg-[#1e1f22] rounded text-white font-mono">Backspace</kbd> para limpar.
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
