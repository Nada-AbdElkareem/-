'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

try {
  require('tsx/cjs');
} catch (e) {
  // Ignored in production
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SERVER_PORT = process.env.PORT || 3457;
const isDev = !app.isPackaged;

// ─── State ────────────────────────────────────────────────────────────────────
let mainWindow = null;
let serverProcess = null;

// ─── Path Helpers ─────────────────────────────────────────────────────────────
function getResourcePath(...segments) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, ...segments);
  }
  return path.join(__dirname, '..', ...segments);
}

function getElectronPath(...segments) {
  return path.join(__dirname, ...segments);
}

// ─── Server Health Check ───────────────────────────────────────────────────────
function waitForServer(url, maxAttempts = 40) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      attempts++;
      const req = http.get(url, (res) => {
        if (res.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
      });
      req.on('error', retry);
      req.setTimeout(1000, () => { req.destroy(); retry(); });

      function retry() {
        if (attempts >= maxAttempts) {
          reject(new Error(`Server did not start after ${maxAttempts} attempts`));
        } else {
          setTimeout(check, 500);
        }
      }
    };

    check();
  });
}

// ─── Backend Server ────────────────────────────────────────────────────────────
async function startBackendServer() {
  process.env.ELECTRON = 'true';  // ← المهم ده موجود
  const dbPath = getResourcePath('sqlite_db.db');

  process.env.PORT = String(SERVER_PORT);
  process.env.NODE_ENV = app.isPackaged ? 'production' : 'development';
  process.env.DB_PATH = dbPath;

  try {
    let serverModule;
    if (app.isPackaged) {
      const serverCjsPath = getResourcePath('dist', 'server.cjs');
      serverModule = require(serverCjsPath);
    } else {
      const serverTsPath = getResourcePath('server.ts');
      serverModule = require(serverTsPath);
    }

    if (serverModule && serverModule.startServer) {
      serverProcess = await serverModule.startServer();
      console.log('[Electron] Server started internally on port', SERVER_PORT);
    } else {
      console.error('[Electron] startServer export not found in server module');
    }
  } catch (err) {
    console.error('[Electron ERR] Failed to start server:', err);
  }
}

// ─── Main Window ───────────────────────────────────────────────────────────────
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'نظام إدارة دار الضيافة الطبية',
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getElectronPath('preload.cjs'),
      webSecurity: true,
    },
    show: false,
    titleBarStyle: 'default',
  });

  // Show loading screen immediately
  await mainWindow.loadFile(getElectronPath('loading.html'));
  mainWindow.show();

  // Remove default menu in production
  if (!isDev) {
    mainWindow.removeMenu();
  }

  try {
    startBackendServer();

    await waitForServer(`http://localhost:${SERVER_PORT}/api/settings`);

    await mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);

    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  } catch (err) {
    console.error('[Electron] Fatal error:', err);
    dialog.showErrorBox(
      'خطأ في تشغيل التطبيق',
      `فشل تشغيل الخادم الخلفي.\n\nالتفاصيل: ${err.message}\n\nيرجى إعادة تشغيل البرنامج أو التواصل مع الدعم الفني.`
    );
    app.quit();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── IPC Handlers ──────────────────────────────────────────────────────────────
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => app.getAppPath());

ipcMain.handle('open-external', async (_event, url) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    await shell.openExternal(url);
  }
});

// ─── App Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (serverProcess) {
    try {
      serverProcess.close();
    } catch (e) {
      console.error('[Electron] Error closing server:', e);
    }
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
