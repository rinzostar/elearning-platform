const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Add IPC methods here as needed for desktop integration
  // e.g., showOpenDialog, setDownloadPath, etc.
});
