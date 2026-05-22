var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_child_process = require("child_process");
var import_http = __toESM(require("http"), 1);
var resolvedDirname = __dirname;
var mainWindow = null;
var serverProcess = null;
var userDataPath = import_electron.app.getPath("userData");
var dbDestPath = import_path.default.join(userDataPath, "sqlite_db.db");
function setupDatabase() {
  try {
    let dbSrcPath = "";
    if (import_electron.app.isPackaged) {
      dbSrcPath = import_path.default.join(process.resourcesPath, "sqlite_db.db");
    } else {
      dbSrcPath = import_path.default.resolve("sqlite_db.db");
    }
    console.log(`Checking database at dest: ${dbDestPath}`);
    console.log(`Source database path: ${dbSrcPath}`);
    if (!import_fs.default.existsSync(dbDestPath)) {
      if (import_fs.default.existsSync(dbSrcPath)) {
        import_fs.default.copyFileSync(dbSrcPath, dbDestPath);
        console.log("Database successfully copied to user data directory.");
      } else {
        console.warn("Warning: Source database file not found. A new one will be created.");
      }
    } else {
      console.log("Database already exists in user data directory.");
    }
  } catch (error) {
    console.error("Error during database setup:", error);
  }
}
function startExpressServer() {
  setupDatabase();
  const serverFile = import_electron.app.isPackaged ? import_path.default.join(process.resourcesPath, "server.cjs") : import_path.default.resolve("dist/server.cjs");
  console.log(`Starting server process: ${serverFile}`);
  serverProcess = (0, import_child_process.fork)(serverFile, [], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      DB_PATH: dbDestPath,
      PORT: "3000"
    },
    silent: false
  });
  serverProcess.on("error", (err) => {
    console.error("Failed to start server process:", err);
  });
  serverProcess.on("exit", (code, signal) => {
    console.log(`Server process exited with code ${code} and signal ${signal}`);
  });
}
function checkServerReady(callback, retries = 50) {
  if (retries === 0) {
    console.error("Server failed to start in time.");
    callback();
    return;
  }
  import_http.default.get("http://localhost:3000", (res) => {
    console.log("Server is ready! Status code:", res.statusCode);
    callback();
  }).on("error", (err) => {
    console.log("Waiting for server to start...");
    setTimeout(() => {
      checkServerReady(callback, retries - 1);
    }, 200);
  });
}
function createWindow() {
  mainWindow = new import_electron.BrowserWindow({
    width: 1280,
    height: 800,
    title: "\u0646\u0638\u0627\u0645 \u0628\u064A\u062A \u0627\u0644\u0636\u064A\u0627\u0641\u0629 \u0627\u0644\u0637\u0628\u064A",
    webPreferences: {
      preload: import_path.default.join(resolvedDirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true
    },
    // إخفاء القائمة الافتراضية للحصول على مظهر احترافي ومميز
    autoHideMenuBar: true
  });
  checkServerReady(() => {
    if (mainWindow) {
      mainWindow.loadURL("http://localhost:3000");
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
import_electron.app.whenReady().then(() => {
  startExpressServer();
  createWindow();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
import_electron.app.on("will-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
import_electron.ipcMain.handle("ping", () => "pong");
