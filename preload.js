const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // App & Shortcut Management
  getApps: () => ipcRenderer.invoke('get-apps'),
  saveApps: (apps) => ipcRenderer.invoke('save-apps', apps),
  browseApp: () => ipcRenderer.invoke('browse-app'),
  browseFolder: () => ipcRenderer.invoke('browse-folder'),
  extractIcon: (filePath) => ipcRenderer.invoke('extract-icon', filePath),
  inspectPath: (filePath) => ipcRenderer.invoke('inspect-path', filePath),
  scanInstalledApps: () => ipcRenderer.invoke('scan-installed-apps'),

  // Launching & External
  launchApp: (targetPath, runAsAdmin = false) => ipcRenderer.invoke('launch-app', { target: targetPath, runAsAdmin }),
  showInFolder: (filePath) => ipcRenderer.invoke('show-in-folder', filePath),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Global Hotkey
  getGlobalHotkey: () => ipcRenderer.invoke('get-global-hotkey'),
  setGlobalHotkey: (hotkey) => ipcRenderer.invoke('set-global-hotkey', hotkey),

  // Window Controls
  togglePin: () => ipcRenderer.invoke('toggle-pin'),
  getPinState: () => ipcRenderer.invoke('get-pin-state'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // Listeners
  onWindowShown: (callback) => ipcRenderer.on('window-shown', () => callback())
});
