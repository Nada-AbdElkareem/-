import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fork, ChildProcess } from 'child_process';
import http from 'http';
import { fileURLToPath } from 'url';

const resolvedDirname = __dirname;

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

// مجلد البيانات الآمن للتطبيق
const userDataPath = app.getPath('userData');
const dbDestPath = path.join(userDataPath, 'sqlite_db.db');

function setupDatabase() {
  try {
    // تحديد مسار قاعدة البيانات الأساسية المرفقة مع التطبيق
    let dbSrcPath = '';
    
    if (app.isPackaged) {
      dbSrcPath = path.join(process.resourcesPath, 'sqlite_db.db');
    } else {
      dbSrcPath = path.resolve('sqlite_db.db');
    }

    console.log(`Checking database at dest: ${dbDestPath}`);
    console.log(`Source database path: ${dbSrcPath}`);

    // نسخ قاعدة البيانات إذا لم تكن موجودة بالفعل في مجلد userData
    if (!fs.existsSync(dbDestPath)) {
      if (fs.existsSync(dbSrcPath)) {
        fs.copyFileSync(dbSrcPath, dbDestPath);
        console.log('Database successfully copied to user data directory.');
      } else {
        console.warn('Warning: Source database file not found. A new one will be created.');
      }
    } else {
      console.log('Database already exists in user data directory.');
    }
  } catch (error) {
    console.error('Error during database setup:', error);
  }
}

function startExpressServer() {
  setupDatabase();

  const serverFile = app.isPackaged 
    ? path.join(process.resourcesPath, 'server.cjs')
    : path.resolve('dist/server.cjs');

  console.log(`Starting server process: ${serverFile}`);

  // تشغيل الخادم كعملية فرعية (Child Process)
  serverProcess = fork(serverFile, [], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DB_PATH: dbDestPath,
      PORT: '3000',
      ELECTRON_RUN_AS_NODE: '1'
    },
    silent: false
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server process:', err);
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`Server process exited with code ${code} and signal ${signal}`);
  });
}

// دالة للتحقق من جاهزية الخادم المحلي
function checkServerReady(callback: () => void, retries = 50) {
  if (retries === 0) {
    console.error('Server failed to start in time.');
    callback();
    return;
  }

  http.get('http://localhost:3000', (res) => {
    console.log('Server is ready! Status code:', res.statusCode);
    callback();
  }).on('error', (err) => {
    console.log('Waiting for server to start...');
    setTimeout(() => {
      checkServerReady(callback, retries - 1);
    }, 200);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "نظام بيت الضيافة الطبي",
    webPreferences: {
      preload: path.join(resolvedDirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
  },
    // إخفاء القائمة الافتراضية للحصول على مظهر احترافي ومميز
    autoHideMenuBar: true,
  });

  // الانتظار حتى يصبح الخادم جاهزاً قبل تحميل الصفحة الرئيسية للتخلص من الشاشة البيضاء
  checkServerReady(() => {
    if (mainWindow) {
      mainWindow.loadURL('http://localhost:3000');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // تشغيل الخادم عند جاهزية Electron
  startExpressServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // إغلاق الخادم عند إغلاق النوافذ
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// إغلاق الخادم للتأكد من عدم بقائه نشطاً في الخلفية
app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

ipcMain.handle('ping', () => 'pong');
