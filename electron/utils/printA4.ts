import { BrowserWindow } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface PrintA4Params {
  printerName: string;
  pdfData: string; // Base64 encoded PDF
}

interface PrintA4Result {
  success: boolean;
  error?: string;
}

export async function printA4({ printerName, pdfData }: PrintA4Params): Promise<PrintA4Result> {
  try {
    // Criar arquivo temporário com o PDF
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `termo_${Date.now()}.pdf`);
    
    // Decodificar base64 e salvar arquivo
    const buffer = Buffer.from(pdfData, 'base64');
    fs.writeFileSync(tempFilePath, buffer);

    // Criar uma janela invisível para impressão
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // Carregar o PDF
    await printWindow.loadFile(tempFilePath);

    // Aguardar o carregamento completo
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Configurações de impressão silenciosa para A4
    const printOptions = {
      silent: true,
      printBackground: true,
      deviceName: printerName,
      margins: {
        marginType: 'none' as const
      },
      pageSize: 'A4'
    };

    // Retornar uma Promise para lidar com o callback
    return new Promise((resolve) => {
      printWindow.webContents.print(printOptions, (success, failureReason) => {
        // Limpar arquivo temporário
        try {
          fs.unlinkSync(tempFilePath);
        } catch (err) {
          console.error("Erro ao deletar arquivo temporário:", err);
        }

        printWindow.close();

        if (!success) {
          console.error("Erro ao imprimir PDF:", failureReason);
          resolve({ success: false, error: failureReason || "Erro desconhecido na impressão" });
        } else {
          resolve({ success: true });
        }
      });
    });
  } catch (error: any) {
    console.error("Erro na impressão A4:", error);
    return { success: false, error: error.message };
  }
}






















