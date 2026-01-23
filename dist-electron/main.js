"use strict";
const electron = require("electron");
const path = require("node:path");
const isDev = !electron.app.isPackaged;
let mainWindow = null;
function createWindow() {
  const iconPath = isDev ? path.join(__dirname, "../public/logo.ico") : path.join(process.resourcesPath, "logo.ico");
  mainWindow = new electron.BrowserWindow({
    width: 1024,
    height: 768,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
electron.app.on("ready", () => {
  createWindow();
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
