import { BrowserWindow } from "electron";

export async function getPrintersName(): Promise<string[]> {
  const window = BrowserWindow.getFocusedWindow();

  if (!window) {
    return [];
  }

  const printers = await window.webContents.getPrintersAsync();
  const printerNames = printers.map(printer => printer.name);

  return printerNames;
}