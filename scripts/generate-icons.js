const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    frame: false,
    transparent: true
  })

  await win.loadFile(path.resolve(__dirname, 'icon.html'))
  await new Promise((r) => setTimeout(r, 600))

  const image = await win.capturePage({ x: 0, y: 0, width: 512, height: 512 })
  const pngBuffer = image.toPNG()

  const resourcesIcon = path.resolve(__dirname, '../resources/icon.png')
  const buildIcon = path.resolve(__dirname, '../build/icon.png')

  fs.writeFileSync(resourcesIcon, pngBuffer)
  fs.writeFileSync(buildIcon, pngBuffer)

  console.log('Ícones PNG gerados com sucesso!')
  app.quit()
})
