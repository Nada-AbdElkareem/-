'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

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
function startBackendServer() {
  const serverCjsPath = getResourcePath('dist', 'server.cjs');
  const dbPath = getResourcePath('sqlite_db.db');

  const env = {
    ...process.env,
    PORT: String(SERVER_PORT),
    NODE_ENV: app.isPackaged ? 'production' : 'development',
    DB_PATH: dbPath,
  };

  if (fs.existsSync(serverCjsPath)) {
    // Production: run compiled server
    console.log('[Electron] Starting compiled server:', serverCjsPath);
    serverProcess = spawn('node', [serverCjsPath], {
      cwd: getResourcePath(),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } else {
    // Development: run via tsx
    const serverTsPath = getResourcePath('server.ts');
    console.log('[Electron] Starting dev server via tsx:', serverTsPath);
    serverProcess = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['tsx', serverTsPath],
      {
        cwd: getResourcePath(),
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      }
    );
  }

  serverProcess.stdout.on('data', (data) => console.log(`[Server] ${data.toString().trim()}`));
  serverProcess.stderr.on('data', (data) => console.error(`[Server ERR] ${data.toString().trim()}`));

  serverProcess.on('exit', (code, signal) => {
    console.log(`[Server] Process exited — code: ${code}, signal: ${signal}`);
  });
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
      serverProcess.kill('SIGTERM');
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          serverProcess.kill('SIGKILL');
        }
      }, 3000);
    } catch (e) {
      console.error('[Electron] Error killing server:', e);
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
