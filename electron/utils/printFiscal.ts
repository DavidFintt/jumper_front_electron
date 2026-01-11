import { BrowserWindow } from "electron";

interface PrintFiscalParams {
  printerName: string;
  content: string;
}

interface PrintFiscalResult {
  success: boolean;
  error?: string;
}

export async function printFiscal({ printerName, content }: PrintFiscalParams): Promise<PrintFiscalResult> {
  try {
    // Criar uma janela invisível para impressão
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // HTML formatado para impressão térmica (80mm)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Cupom Fiscal</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 10px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              white-space: pre-wrap;
              max-width: 80mm;
            }
            pre {
              margin: 0;
              font-family: 'Courier New', monospace;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <pre>${content.replace(/\n/g, '<br>')}</pre>
        </body>
      </html>
    `;

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    // Aguardar o carregamento completo
    await new Promise(resolve => setTimeout(resolve, 500));

    // Configurações de impressão silenciosa
    const printOptions = {
      silent: true,
      printBackground: true,
      deviceName: printerName,
      margins: {
        marginType: 'none' as const
      }
    };

    // Retornar uma Promise para lidar com o callback
    return new Promise((resolve) => {
      printWindow.webContents.print(printOptions, (success, failureReason) => {
        if (!success) {
          console.error("Erro ao imprimir:", failureReason);
          printWindow.close();
          resolve({ success: false, error: failureReason || "Erro desconhecido na impressão" });
        } else {
          printWindow.close();
          resolve({ success: true });
        }
      });
    });
  } catch (error: any) {
    console.error("Erro na impressão fiscal:", error);
    return { success: false, error: error.message };
  }
}






















