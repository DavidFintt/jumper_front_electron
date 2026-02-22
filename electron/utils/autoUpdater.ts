import { autoUpdater, UpdateInfo } from "electron-updater";
import { BrowserWindow, dialog, app } from "electron";

const UPDATE_SERVER_URL = "https://updates.jumpersystem.com.br";

let mainWindow: BrowserWindow | null = null;
let updateAvailable = false;

function log(msg: string) {
  const fs = require("node:fs");
  const path = require("node:path");
  const logDir = path.join(app.getPath("userData"), "logs");
  const logFile = path.join(logDir, "jump-updater.log");
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, line);
  } catch {}
  console.log(`[AutoUpdater] ${msg}`);
}

function sendStatusToWindow(status: string, data?: Record<string, unknown>) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update-status", { status, ...data });
  }
}

export function initAutoUpdater(win: BrowserWindow) {
  mainWindow = win;

  autoUpdater.setFeedURL({
    provider: "generic",
    url: UPDATE_SERVER_URL,
  });

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    log("Verificando atualizacoes...");
    sendStatusToWindow("checking");
  });

  autoUpdater.on("update-available", (info: UpdateInfo) => {
    log(`Atualizacao disponivel: ${info.version}`);
    updateAvailable = true;
    sendStatusToWindow("available", { version: info.version });

    dialog
      .showMessageBox({
        type: "info",
        title: "Atualizacao disponivel",
        message: `Uma nova versao (${info.version}) esta disponivel. Deseja baixar agora?`,
        buttons: ["Baixar", "Depois"],
        defaultId: 0,
        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
  });

  autoUpdater.on("update-not-available", () => {
    log("Nenhuma atualizacao disponivel");
    sendStatusToWindow("not-available");
  });

  autoUpdater.on("download-progress", (progress) => {
    const percent = Math.round(progress.percent);
    log(`Progresso do download: ${percent}%`);
    sendStatusToWindow("downloading", {
      percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
    log(`Atualizacao baixada: ${info.version}`);
    sendStatusToWindow("downloaded", { version: info.version });

    dialog
      .showMessageBox({
        type: "info",
        title: "Atualizacao pronta",
        message: `A versao ${info.version} foi baixada. O aplicativo sera reiniciado para aplicar a atualizacao.`,
        buttons: ["Reiniciar agora", "Depois"],
        defaultId: 0,
        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall(false, true);
        }
      });
  });

  autoUpdater.on("error", (error) => {
    log(`Erro ao verificar atualizacoes: ${error.message}`);
    sendStatusToWindow("error", { message: error.message });
  });
}

export function checkForUpdates() {
  if (app.isPackaged) {
    log("Iniciando verificacao de atualizacoes");
    try {
      autoUpdater.checkForUpdates().catch((err: Error) => {
        log(`Falha ao verificar atualizacoes: ${err.message}`);
        sendStatusToWindow("error", { message: err.message });
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log(`Erro inesperado ao iniciar verificacao: ${message}`);
      sendStatusToWindow("error", { message });
    }
  } else {
    log("Modo desenvolvimento - verificacao de atualizacoes ignorada");
  }
}

export function isUpdateAvailable(): boolean {
  return updateAvailable;
}
