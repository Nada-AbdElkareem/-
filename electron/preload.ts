import { contextBridge, ipcRenderer } from 'electron';

// واجهة برمجية آمنة للتواصل بين واجهة التطبيق والعملية الرئيسية (IPC)
contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  platform: process.platform,
});
