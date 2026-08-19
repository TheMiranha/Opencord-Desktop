import { create } from 'zustand'

export type KeybindAction = 'toggleMute' | 'toggleDeafen'

export interface KeybindItem {
  id: KeybindAction
  label: string
  description: string
  defaultKey: string
}

export const DEFAULT_KEYBINDS: Record<KeybindAction, string> = {
  toggleMute: '',
  toggleDeafen: ''
}

export const KEYBIND_DEFINITIONS: KeybindItem[] = [
  {
    id: 'toggleMute',
    label: 'Mutar / Desmutar Microfone',
    description: 'Alterna o status do seu microfone durante uma chamada de voz.',
    defaultKey: ''
  },
  {
    id: 'toggleDeafen',
    label: 'Mutar Geral / Ensurdecer',
    description: 'Silencia todo o áudio da chamada e muta seu microfone simultaneamente.',
    defaultKey: ''
  }
]

const KEYBINDS_STORAGE_KEY = 'OPENCORD_KEYBINDS'

const loadInitialKeybinds = (): Record<KeybindAction, string> => {
  try {
    const raw = localStorage.getItem(KEYBINDS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        toggleMute: typeof parsed.toggleMute === 'string' ? parsed.toggleMute : '',
        toggleDeafen: typeof parsed.toggleDeafen === 'string' ? parsed.toggleDeafen : ''
      }
    }
  } catch (err) {
    console.error('Erro ao carregar atalhos do localStorage:', err)
  }
  return { toggleMute: '', toggleDeafen: '' }
}

export function isValidKeybind(keybind: string): boolean {
  return Boolean(keybind && keybind.trim().length > 0)
}

export function formatKeybindToAccelerator(keybind: string): string {
  if (!isValidKeybind(keybind)) return ''

  const parts = keybind.split('+').map((p) => p.trim())
  const mainKeys = parts.filter(
    (p) => !['ctrl', 'control', 'shift', 'alt', 'cmd', 'meta', 'win'].includes(p.toLowerCase())
  )

  // Electron globalShortcut requer pelo menos uma tecla principal que não seja apenas modificador
  if (mainKeys.length === 0) return ''

  const accelParts: string[] = []

  parts.forEach((part) => {
    const lower = part.toLowerCase()
    if (lower === 'ctrl' || lower === 'control') accelParts.push('CommandOrControl')
    else if (lower === 'alt') accelParts.push('Alt')
    else if (lower === 'shift') accelParts.push('Shift')
    else if (lower === 'meta' || lower === 'win' || lower === 'cmd') accelParts.push('Super')
    else if (lower === 'space') accelParts.push('Space')
    else if (lower === 'enter') accelParts.push('Return')
    else accelParts.push(part.toUpperCase())
  })

  return accelParts.join('+')
}

export function matchesKeybind(e: KeyboardEvent, keybindStr: string): boolean {
  if (!isValidKeybind(keybindStr)) return false

  const parts = keybindStr.split('+').map((p) => p.trim().toLowerCase())
  const hasCtrl = parts.includes('ctrl') || parts.includes('control')
  const hasShift = parts.includes('shift')
  const hasAlt = parts.includes('alt')
  const hasMeta = parts.includes('cmd') || parts.includes('meta') || parts.includes('win')

  // Checagem estrita de modificadores: os modificadores pressionados no evento DEVEM ser exatamente iguais aos do atalho
  if (Boolean(e.ctrlKey) !== hasCtrl) return false
  if (Boolean(e.shiftKey) !== hasShift) return false
  if (Boolean(e.altKey) !== hasAlt) return false
  if (Boolean(e.metaKey) !== hasMeta) return false

  const mainKeys = parts.filter(
    (p) => !['ctrl', 'control', 'shift', 'alt', 'cmd', 'meta', 'win'].includes(p)
  )

  // Caso o usuário tenha vinculado apenas modificadores (ex: "Shift", "Ctrl", "Ctrl+Shift", "Alt")
  if (mainKeys.length === 0) {
    const isShiftKey = e.key === 'Shift' || e.code.startsWith('Shift')
    const isCtrlKey = e.key === 'Control' || e.code.startsWith('Control')
    const isAltKey = e.key === 'Alt' || e.code.startsWith('Alt')
    const isMetaKey = e.key === 'Meta' || e.code.startsWith('Meta')

    if (hasShift && isShiftKey) return true
    if (hasCtrl && isCtrlKey) return true
    if (hasAlt && isAltKey) return true
    if (hasMeta && isMetaKey) return true

    return false
  }

  const targetKey = mainKeys[0].toLowerCase()
  const eventKey = (e.key || '').toLowerCase()
  const eventCode = (e.code || '').toLowerCase()

  if (targetKey === 'space' && (eventKey === ' ' || eventCode === 'space')) return true
  if (targetKey === eventKey) return true
  if (eventCode === `key${targetKey}`) return true
  if (eventCode === `digit${targetKey}`) return true
  if (eventCode === targetKey) return true

  return false
}

interface KeybindState {
  keybinds: Record<KeybindAction, string>
  setKeybind: (action: KeybindAction, shortcut: string) => void
  resetKeybind: (action: KeybindAction) => void
  resetAllKeybinds: () => void
  clearKeybind: (action: KeybindAction) => void
  syncWithElectron: () => void
}

export const useKeybindStore = create<KeybindState>((set, get) => ({
  keybinds: loadInitialKeybinds(),

  setKeybind: (action, shortcut) => {
    const updated = { ...get().keybinds, [action]: shortcut }
    try {
      localStorage.setItem(KEYBINDS_STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error('Erro ao salvar atalhos:', e)
    }
    set({ keybinds: updated })
    get().syncWithElectron()
  },

  resetKeybind: (action) => {
    get().setKeybind(action, DEFAULT_KEYBINDS[action])
  },

  resetAllKeybinds: () => {
    try {
      localStorage.setItem(KEYBINDS_STORAGE_KEY, JSON.stringify(DEFAULT_KEYBINDS))
    } catch (e) {
      console.error('Erro ao resetar atalhos:', e)
    }
    set({ keybinds: { ...DEFAULT_KEYBINDS } })
    get().syncWithElectron()
  },

  clearKeybind: (action) => {
    get().setKeybind(action, '')
  },

  syncWithElectron: () => {
    if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
      const { keybinds } = get()
      const payload = {
        toggleMute: formatKeybindToAccelerator(keybinds.toggleMute),
        toggleDeafen: formatKeybindToAccelerator(keybinds.toggleDeafen)
      }
      window.electron.ipcRenderer.send('register-global-shortcuts', payload)
    }
  }
}))
