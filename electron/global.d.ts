export interface IElectronAPI {
  getPrinters: () => Promise<string[]>;
  printFiscal: (printerName: string, content: string) => Promise<{ success: boolean; error?: string }>;
  printA4: (printerName: string, pdfData: string) => Promise<{ success: boolean; error?: string }>;
  getMachineId: () => Promise<string>;
  getMachineName: () => Promise<string>;
  unregisterDevice: (companyId: number, accessToken: string) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}

