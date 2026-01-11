"use strict";const e=require("electron");console.log("PRELOAD CARREGOU");e.contextBridge.exposeInMainWorld("api",{getPrinters:async()=>await e.ipcRenderer.invoke("get-printers")});
