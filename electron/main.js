const { app, BrowserWindow, shell, ipcMain, Menu } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let nextProcess = null;

function createWindow(port) {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    const appUrl = app.isPackaged ? `http://localhost:35412` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const appOrigin = new URL(appUrl).origin;

    try {
      const targetOrigin = new URL(url).origin;
      if (url.startsWith('http') && targetOrigin !== appOrigin) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    } catch (e) {}
    
    return { action: 'allow' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const appUrl = app.isPackaged ? `http://localhost:35412` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const appOrigin = new URL(appUrl).origin;
    
    try {
      const targetOrigin = new URL(url).origin;
      // If it's a different domain, open in external browser
      if (url.startsWith('http') && targetOrigin !== appOrigin && !url.includes('localhost')) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch (e) {
      // Not a valid URL or relative path, allow it
    }
  });

  const url = app.isPackaged ? `http://localhost:${port}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  win.loadURL(url);
}

const template = [
  {
    label: 'File',
    submenu: [
      { role: 'quit' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          const { shell } = require('electron');
          await shell.openExternal('https://electronjs.org');
        }
      }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

app.whenReady().then(() => {
  if (app.isPackaged) {
    const port = 35412; // Use a fixed port for simplicity
    const serverPath = path.join(process.resourcesPath, 'app.asar.unpacked/standalone/server.js');
    
    // In Electron, to run a Node script natively, we use fork with process.execPath and set ELECTRON_RUN_AS_NODE
    nextProcess = fork(serverPath, [], {
      execPath: process.execPath,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        PORT: port,
        NODE_ENV: 'production'
      }
    });

    // Wait a brief moment for the server to start
    setTimeout(() => {
      createWindow(port);
    }, 1500);
  } else {
    createWindow(3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (app.isPackaged) createWindow(35412);
      else createWindow(3000);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill();
  }
});


