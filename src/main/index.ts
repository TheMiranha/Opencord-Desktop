import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import { app, BrowserWindow, ipcMain, desktopCapturer } from 'electron'

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
    width: 1280, // Começa bem maior
    height: 720,
    minWidth: 940, // Evita que o usuário esprema muito o layout
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    
    // --- MÁGICA DA BARRA CUSTOMIZADA ---
    titleBarStyle: 'hidden', 
    titleBarOverlay: {
      color: '#1e1f22', // Cor exata da barra lateral do seu Opencord
      symbolColor: '#80848e', // Cor cinza dos ícones (X, -, [])
      height: 28 // Altura da barrinha
    },
    // -----------------------------------

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

  ipcMain.handle('get-desktop-sources', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 400, height: 400 }
    })

    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }))
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
// SE DEU ERRO (Sem internet, por exemplo): Pula e abre o app mesmo assim
  autoUpdater.on('error', (err) => {
    // Agora o 'err' está sendo lido e o build vai passar!
    console.error('Erro no Auto-Updater:', err) 
    
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
     autoUpdater.quitAndInstall(true, true)
    }, 1500)
  })

})