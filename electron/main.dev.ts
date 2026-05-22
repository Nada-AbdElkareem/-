import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const resolvedDirname = __dirname;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "نظام بيت الضيافة الطبي (بيئة التطوير)",
    webPreferences: {
      preload: path.join(resolvedDirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // الاتصال بخادم التطوير المحلي
  mainWindow.loadURL('http://localhost:3000');

  // فتح أدوات المطورين تلقائياً في بيئة التطوير
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

// التعامل مع IPC للتحقق من الاتصال
ipcMain.handle('ping', () => 'pong');
