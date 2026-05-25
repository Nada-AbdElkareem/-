'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

// ─── Constants ────────────────────────────────────────────────────────────────
const SERVER_PORT = 3457;
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

// ─── Database Setup ───────────────────────────────────────────────────────────
function ensureDatabase() {
  const userDataPath = app.getPath('userData');
  const dbDestPath = path.join(userDataPath, 'sqlite_db.db');

  // If DB already exists in userData, keep it (preserves user data)
  if (fs.existsSync(dbDestPath)) {
    console.log('[Electron] Database found at:', dbDestPath);
    return dbDestPath;
  }

  // In packaged app: try to copy bundled DB from resources
  if (app.isPackaged) {
    const bundledDb = path.join(process.resourcesPath, 'sqlite_db.db');
    if (fs.existsSync(bundledDb)) {
      fs.copyFileSync(bundledDb, dbDestPath);
      console.log('[Electron] Database copied from resources to:', dbDestPath);
    } else {
      console.log('[Electron] No bundled DB found — will be created fresh at:', dbDestPath);
    }
  } else {
    // Dev: try to copy from project root
    const devDb = getResourcePath('sqlite_db.db');
    if (fs.existsSync(devDb)) {
      fs.copyFileSync(devDb, dbDestPath);
      console.log('[Electron] Dev database copied to:', dbDestPath);
    } else {
      console.log('[Electron] No source DB — fresh database will be created at:', dbDestPath);
    }
  }

  return dbDestPath;
}

// ─── Server Health Check ──────────────────────────────────────────────────────
function waitForServer(url, maxAttempts = 40) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(url, (res) => {
        if (res.statusCode < 500) resolve();
        else retry();
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

// ─── Backend Server ───────────────────────────────────────────────────────────
async function startBackendServer() {
  const dbPath = ensureDatabase();

  process.env.ELECTRON = 'true';
  process.env.PORT = String(SERVER_PORT);
  process.env.NODE_ENV = isDev ? 'development' : 'production';
  process.env.DB_PATH = dbPath;

  try {
    let serverModule;
    if (app.isPackaged) {
      // Production: load compiled server bundle
      const serverCjsPath = getResourcePath('dist', 'server.cjs');
      console.log('[Electron] Loading production server from:', serverCjsPath);
      serverModule = require(serverCjsPath);
    } else {
      // Development: load TypeScript server via tsx
      try { require('tsx/cjs'); } catch (e) { /* tsx already loaded */ }
      const serverTsPath = getResourcePath('server.ts');
      console.log('[Electron] Loading dev server from:', serverTsPath);
      serverModule = require(serverTsPath);
    }

    if (serverModule && serverModule.startServer) {
      serverProcess = await serverModule.startServer();
      console.log('[Electron] Server started on port', SERVER_PORT);
    } else {
      console.error('[Electron] startServer export not found!');
    }
  } catch (err) {
    console.error('[Electron] Failed to start server:', err);
    throw err;
  }
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
async function showLoadingScreen(win) {
  const loadingPath = getElectronPath('loading.html');
  if (fs.existsSync(loadingPath)) {
    await win.loadFile(loadingPath);
  } else {
    await win.loadURL(`data:text/html,<html style="background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p style="color:white;font-family:sans-serif;font-size:18px">جارٍ التحميل...</p></html>`);
  }
}

// ─── Main Window ──────────────────────────────────────────────────────────────
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
    autoHideMenuBar: !isDev,
  });

  // Show loading screen right away
  await showLoadingScreen(mainWindow);
  mainWindow.show();

  if (!isDev) mainWindow.removeMenu();

  try {
    await startBackendServer();
    await waitForServer(`http://localhost:${SERVER_PORT}/api/settings`);
    await mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);

    if (isDev) mainWindow.webContents.openDevTools();
  } catch (err) {
    console.error('[Electron] Fatal error:', err);
    dialog.showErrorBox(
      'خطأ في تشغيل التطبيق',
      `فشل تشغيل الخادم الخلفي.\n\nالتفاصيل: ${err.message}\n\nيرجى إعادة تشغيل البرنامج أو التواصل مع الدعم الفني.`
    );
    app.quit();
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => app.getAppPath());
ipcMain.handle('ping', () => 'pong');
ipcMain.handle('open-external', async (_event, url) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    await shell.openExternal(url);
  }
});

// ─── App Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (serverProcess) {
    try { serverProcess.close(); } catch (e) {
      try { serverProcess.kill(); } catch (_) {}
    }
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('will-quit', () => {
  if (serverProcess) {
    try { serverProcess.close(); } catch (e) {
      try { serverProcess.kill(); } catch (_) {}
    }
  }
});
