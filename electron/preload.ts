import { contextBridge, ipcRenderer } from "electron";

console.log("PRELOAD CARREGOU");

contextBridge.exposeInMainWorld("api", {
  getPrinters: async (): Promise<string[]> => {
    const printers = await ipcRenderer.invoke("get-printers");
    return printers;
  }
});

contextBridge.exposeInMainWorld("electronAPI", {
  getMachineId: (): Promise<string> => ipcRenderer.invoke("get-machine-id"),
  getMachineName: (): Promise<string> => ipcRenderer.invoke("get-machine-name"),
});
