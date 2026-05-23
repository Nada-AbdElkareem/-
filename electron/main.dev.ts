import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fork, ChildProcess } from 'child_process';
import http from 'http';

const resolvedDirname = __dirname;

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

// مجلد البيانات الآمن للتطبيق
const userDataPath = app.getPath('userData');
const dbDestPath = path.join(userDataPath, 'sqlite_db.db');

function setupDatabase() {
  try {
    const dbSrcPath = path.resolve('sqlite_db.db');
    console.log(`[Dev] Checking database at dest: ${dbDestPath}`);
    console.log(`[Dev] Source database path: ${dbSrcPath}`);

    // نسخ قاعدة البيانات إذا لم تكن موجودة بالفعل في مجلد userData
    if (!fs.existsSync(dbDestPath)) {
      if (fs.existsSync(dbSrcPath)) {
        fs.copyFileSync(dbSrcPath, dbDestPath);
        console.log('[Dev] Database successfully copied to user data directory.');
      } else {
        console.warn('[Dev] Warning: Source database file not found.');
      }
    } else {
      console.log('[Dev] Database already exists in user data directory.');
    }
  } catch (error) {
    console.error('[Dev] Error during database setup:', error);
  }
}

function startExpressServer() {
  setupDatabase();

  const serverFile = path.resolve('dist/server.cjs');
  console.log(`[Dev] Starting server process inside Electron: ${serverFile}`);

  // تشغيل الخادم كعملية فرعية داخل بيئة تشغيل Electron (تمنع خطأ اختلاف نسخة Node)
  serverProcess = fork(serverFile, [], {
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DB_PATH: dbDestPath,
      PORT: '3000',
      ELECTRON_RUN_AS_NODE: '1'
    },
    silent: false
  });

  serverProcess.on('error', (err) => {
    console.error('[Dev] Failed to start server process:', err);
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`[Dev] Server process exited with code ${code} and signal ${signal}`);
  });
}

function checkServerReady(callback: () => void, retries = 50) {
  if (retries === 0) {
    console.error('[Dev] Server failed to start in time.');
    callback();
    return;
  }

  http.get('http://localhost:3000', (res) => {
    console.log('[Dev] Server is ready! Status code:', res.statusCode);
    callback();
  }).on('error', (err) => {
    console.log('[Dev] Waiting for server to start...');
    setTimeout(() => {
      checkServerReady(callback, retries - 1);
    }, 200);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "نظام بيت الضيافة الطبي (بيئة التطوير)",
    webPreferences: {
      preload: path.join(resolvedDirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    autoHideMenuBar: false,
  });

  checkServerReady(() => {
    if (mainWindow) {
      mainWindow.loadURL('http://localhost:3000');
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startExpressServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

ipcMain.handle('ping', () => 'pong');
