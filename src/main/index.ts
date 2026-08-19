import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  shell,
  globalShortcut,
  Tray,
  Menu,
  nativeImage
} from 'electron'

let mainWindow: BrowserWindow | null = null
let splashWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 300,
    height: 350,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    splashWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/splash.html`)
  } else {
    splashWindow.loadFile(join(__dirname, '../renderer/splash.html'))
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 940,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1e1f22',
      symbolColor: '#80848e',
      height: 28
    },
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Close to Tray: Ao clicar no X, apenas esconde a janela em vez de fechar o app
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray() {
  if (tray) return

  const trayIcon = nativeImage.createFromPath(icon)
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))
  tray.setToolTip('Opencord')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Opencord',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Mutar / Desmutar Microfone',
      click: () => {
        mainWindow?.webContents.send('trigger-action', 'toggleMute')
      }
    },
    {
      label: 'Mutar Geral / Ensurdecer',
      click: () => {
        mainWindow?.webContents.send('trigger-action', 'toggleDeafen')
      }
    },
    { type: 'separator' },
    {
      label: 'Sair do Opencord',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  // Clique na bandeja do sistema abre/foca o Opencord
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore()
        }
        mainWindow.focus()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

// Single instance lock (apenas uma instância do app aberta por vez)
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.miranda.opencord')
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    ipcMain.handle('get-desktop-sources', async () => {
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 400, height: 400 }
      })

      return sources.map((source) => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
      }))
    })

    // Gerenciador de Atalhos Globais
    ipcMain.on('register-global-shortcuts', (_, shortcuts: { toggleMute?: string; toggleDeafen?: string }) => {
      globalShortcut.unregisterAll()

      if (shortcuts.toggleMute) {
        try {
          globalShortcut.register(shortcuts.toggleMute, () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('trigger-action', 'toggleMute')
            }
          })
        } catch (err) {
          console.error('Falha ao registrar atalho global toggleMute:', err)
        }
      }

      if (shortcuts.toggleDeafen) {
        try {
          globalShortcut.register(shortcuts.toggleDeafen, () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('trigger-action', 'toggleDeafen')
            }
          })
        } catch (err) {
          console.error('Falha ao registrar atalho global toggleDeafen:', err)
        }
      }
    })

    createSplashWindow()
    createMainWindow()
    createTray()

    // Updater
    if (is.dev) {
      setTimeout(() => {
        splashWindow?.close()
        mainWindow?.show()
      }, 1500)
      return
    }

    autoUpdater.checkForUpdates()

    autoUpdater.on('checking-for-update', () => {
      splashWindow?.webContents.send('updater-message', 'Buscando atualizações...')
    })

    autoUpdater.on('update-available', () => {
      splashWindow?.webContents.send('updater-message', 'Baixando atualização...')
    })

    autoUpdater.on('update-not-available', () => {
      splashWindow?.webContents.send('updater-message', 'Iniciando Opencord...')
      setTimeout(() => {
        splashWindow?.close()
        mainWindow?.show()
      }, 1500)
    })

    autoUpdater.on('error', (err) => {
      console.error('Erro no Auto-Updater:', err)
      splashWindow?.webContents.send('updater-message', 'Erro ao atualizar. Iniciando...')
      setTimeout(() => {
        splashWindow?.close()
        mainWindow?.show()
      }, 2000)
    })

    autoUpdater.on('download-progress', (progressObj) => {
      let percent = Math.round(progressObj.percent)
      splashWindow?.webContents.send('updater-message', `Baixando... ${percent}%`)
      splashWindow?.webContents.send('updater-progress', percent)
    })

    autoUpdater.on('update-downloaded', () => {
      splashWindow?.webContents.send('updater-message', 'Instalando atualização...')
      setTimeout(() => {
        autoUpdater.quitAndInstall(true, true)
      }, 1500)
    })
  })

  app.on('before-quit', () => {
    isQuitting = true
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })

  app.on('activate', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform === 'darwin' || !isQuitting) {
      // Continua rodando no Tray em segundo plano
    } else {
      app.quit()
    }
  })
}