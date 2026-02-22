export interface IElectronAPI {
  getPrinters: () => Promise<string[]>;
  printFiscal: (printerName: string, content: string) => Promise<{ success: boolean; error?: string }>;
  printA4: (printerName: string, pdfData: string) => Promise<{ success: boolean; error?: string }>;
  getMachineId: () => Promise<string>;
  getMachineName: () => Promise<string>;
  checkForUpdates: () => Promise<void>;
  unregisterDevice: (companyId: number, accessToken: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateStatus: (callback: (data: { status: string; version?: string; percent?: number; message?: string }) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}

