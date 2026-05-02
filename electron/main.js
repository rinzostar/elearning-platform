const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
    frame: false,
  });

  // Intercept target="_blank" links and open in default OS browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Intercept normal navigations to external sites
  win.webContents.on('will-navigate', (event, url) => {
    // Check if the URL is external (not localhost or the specific dev IP)
    if (url.startsWith('http') && !url.includes('localhost') && !url.includes('10.43.199.44')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Load from localhost where Next.js is running in dev
  // In production, you would point this to the compiled bundle
  const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  win.loadURL(url);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
