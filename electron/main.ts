import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { machineIdSync } from "node-machine-id";
import { ChildProcess, spawn} from "node:child_process";

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let djangoProcess: ChildProcess | null = null;

const logDir = path.join(app.getPath('userData'), 'logs');
const logFile = path.join(logDir, 'jump.log');

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, line);
  } catch {}
  console.log(msg);
}

function getDjangoPath(): string {
  const bin = process.platform === 'win32' ? 'backend.exe' : 'backend';
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend", bin);
  }
  return path.join(__dirname, 'resources', 'backend', bin);
}

function waitForDjango(url: string, retries = 120, interval = 500): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      fetch(url)
        .then((res) => {
          log(`Health check tentativa ${attempts + 1}: status ${res.status}`);
          if (res.ok) {
            resolve();
          } else {
            throw new Error(`HTTP ${res.status}`);
          }
        })
        .catch((err) => {
          attempts++;
          if (attempts % 10 === 0) {
            log(`Ainda aguardando Django... tentativa ${attempts} — ${err.message}`);
          }
          if (attempts < retries) {
            setTimeout(check, interval);
          } else {
            reject(new Error(`Django não respondeu após ${attempts} tentativas. Último erro: ${err.message}`));
          }
        });
    };
    check();
  });
}

function startDjango() {
  const djangoBin = getDjangoPath();
  const djangoDir = path.dirname(djangoBin);

  log(`Django bin: ${djangoBin}`);
  log(`Django dir: ${djangoDir}`);
  log(`Bin exists: ${fs.existsSync(djangoBin)}`);

  const dbPath = path.join(app.getPath('userData'), 'jump.db');

  const env = {
    ...process.env,
    PYTHONUNBUFFERED: "1",
    DB_PATH: dbPath,
  };

  const migrate = spawn(djangoBin, ["migrate", "--run-syncdb"], {
    cwd: djangoDir,
    env,
  });

  migrate.on("exit", (code) => {
    log (`Migrate exited with code: ${code}`);
    
    djangoProcess = spawn(djangoBin, [
    "runserver",
    "127.0.0.1:8000",
    "--noreload",
    ], {
      cwd: djangoDir,
      env,
    });

    djangoProcess.stdout?.on("data", (data) => {
    log(`Django stdout: ${data}`);
    });

    djangoProcess.stderr?.on("data", (data) => {
      log(`Django stderr: ${data}`);
    });

    djangoProcess.on("error", (error) => {
      log(`Django spawn error: ${error}`);
    });

    djangoProcess.on("exit", (code, signal) => {
      log(`Django exited — code: ${code}, signal: ${signal}`);
    });

    log("Django process setup complete");

  })

}



ipcMain.handle('get-machine-id', () => {
  try {
    return machineIdSync();
  } catch (error) {
    return `fallback-${os.hostname()}-${Date.now()}`;
  }
});

ipcMain.handle('get-machine-name', () => {
  return os.hostname();
});

async function createWindow() {
  // Define o caminho do ícone
  const iconPath = isDev
    ? path.join(__dirname, "../public/logo.ico")
    : path.join(process.resourcesPath, "logo.ico");

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  try {
    await waitForDjango("http://127.0.0.1:8000/api/health/");

    if (isDev && process.env.VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
      mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }
    mainWindow.webContents.openDevTools();
  } catch (error) {
    log(`Django não iniciou: ${error}`);
    mainWindow.loadFile(path.join(__dirname, "../dist/error.html"));
  }
  

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  startDjango();
  createWindow();
});

app.on('will-quit', () => {
  if (djangoProcess) {
    djangoProcess.kill()
    djangoProcess = null
  }

  if(process.platform === 'win32') {
    try{
      require("child_process").execSync('taskkill /F /IM backend.exe /T', { stdio: 'ignore' });
    } catch (error) {
      log(`Erro ao finalizar backend.exe: ${error}`);
    }
  } else {
    try {
      require("child_process").execSync('pkill -f backend', { stdio: 'ignore' });
    } catch (error) {
      log(`Erro ao finalizar processo backend: ${error}`);
    }
  }
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
