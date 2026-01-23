"use strict";
const electron = require("electron");
console.log("PRELOAD CARREGOU");
electron.contextBridge.exposeInMainWorld("api", {
  getPrinters: async () => {
    const printers = await electron.ipcRenderer.invoke("get-printers");
    return printers;
  }
});
