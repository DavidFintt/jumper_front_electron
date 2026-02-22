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
  checkForUpdates: (): Promise<void> => ipcRenderer.invoke("check-for-updates"),
  onLoadingStep: (callback: (message: string) => void): void => {
    ipcRenderer.on("loading-step", (_event, message: string) => callback(message));
  },
  onUpdateStatus: (callback: (data: { status: string; version?: string; percent?: number; message?: string }) => void): void => {
    ipcRenderer.on("update-status", (_event, data) => callback(data));
  },
});
