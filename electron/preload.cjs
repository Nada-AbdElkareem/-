// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => import_electron.ipcRenderer.invoke("ping"),
  platform: process.platform
});
