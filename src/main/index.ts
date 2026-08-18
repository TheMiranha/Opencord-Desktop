import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let splashWindow: BrowserWindow | null = null

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 300,
    height: 350,
    frame: false,       // Sem as bordas do Windows
    transparent: true,  // Fundo transparente para os cantos arredondados do HTML funcionarem
    resizable: false,
    alwaysOnTop: true,  // Fica por cima de tudo estilo Discord
    webPreferences: {
      nodeIntegration: true, // Permite o require('electron') no HTML
      contextIsolation: false
    }
  })

  // Carrega o splash.html
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    splashWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/splash.html`)
  } else {
    splashWindow.loadFile(join(__dirname, '../renderer/splash.html'))
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false, // INICIA OCULTA! Só aparece quando não tiver atualização
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.miranda.opencord')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Cria as duas janelas
  createSplashWindow()
  createMainWindow()

  // --- LÓGICA DO UPDATER (ESTILO DISCORD) ---
  
  // Se estivermos rodando no ambiente de desenvolvimento (Vite local), pula a atualização
  if (is.dev) {
    setTimeout(() => {
      splashWindow?.close()
      mainWindow?.show()
    }, 1500)
    return
  }

  // Manda o motor checar se tem versão nova lá no seu GitHub
  autoUpdater.checkForUpdates()

  autoUpdater.on('checking-for-update', () => {
    splashWindow?.webContents.send('updater-message', 'Buscando atualizações...')
  })

  autoUpdater.on('update-available', () => {
    splashWindow?.webContents.send('updater-message', 'Baixando atualização...')
  })

  // SE ESTIVER NA ÚLTIMA VERSÃO: Fecha o splash e mostra o chat!
  autoUpdater.on('update-not-available', () => {
    splashWindow?.webContents.send('updater-message', 'Iniciando Opencord...')
    setTimeout(() => {
      splashWindow?.close()
      mainWindow?.show()
    }, 1500) // Dá 1.5s só pro usuário ver a tela e não ser um flash abrupto
  })

  // SE DEU ERRO (Sem internet, por exemplo): Pula e abre o app mesmo assim
  autoUpdater.on('error', (err) => {
    splashWindow?.webContents.send('updater-message', 'Erro ao atualizar. Iniciando...')
    setTimeout(() => {
      splashWindow?.close()
      mainWindow?.show()
    }, 2000)
  })

  // ENCHENDO A BARRA DE PROGRESSO
  autoUpdater.on('download-progress', (progressObj) => {
    let percent = Math.round(progressObj.percent)
    splashWindow?.webContents.send('updater-message', `Baixando... ${percent}%`)
    splashWindow?.webContents.send('updater-progress', percent)
  })

  // QUANDO TERMINAR DE BAIXAR A VERSÃO NOVA
  autoUpdater.on('update-downloaded', () => {
    splashWindow?.webContents.send('updater-message', 'Instalando atualização...')
    setTimeout(() => {
      autoUpdater.quitAndInstall() // Fecha o app atual, instala o novo e abre sozinho
    }, 1500)
  })
})