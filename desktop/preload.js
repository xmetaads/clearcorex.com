// ============================================
// Preload — exposes a tiny, safe API to the renderer
// ============================================
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cc', {
  version: '4.0.4',
  platform: process.platform,
  openFile:     ()    => ipcRenderer.invoke('file:open'),
  saveFile:     (data) => ipcRenderer.invoke('file:save', data),
  openExternal: (url)  => ipcRenderer.invoke('app:openExternal', url),
  minimize:     ()    => ipcRenderer.invoke('app:minimize'),
  maximize:     ()    => ipcRenderer.invoke('app:maximize'),
  close:        ()    => ipcRenderer.invoke('app:close'),
});
