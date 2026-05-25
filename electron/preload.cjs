'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  platform: process.platform,
  isElectron: true,
});
