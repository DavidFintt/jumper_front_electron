import api from './api';
import type { ApiResponse } from './types';

export interface CompanyPrinter {
  id: number;
  company: number;
  fiscal_printer: string | null;
  a4_printer: string | null;
  created_at: string;
  updated_at: string;
}

class CompanyPrinterService {
  /**
   * Busca configuração de impressoras da empresa pelo ID
   */
  async getByCompanyId(companyId: number): Promise<ApiResponse<CompanyPrinter>> {
    return api.get<ApiResponse<CompanyPrinter>>(
      `/company-printer/?company_id=${companyId}`
    );
  }

  /**
   * Atualiza ou cria configuração de impressoras da empresa
   */
  async update(
    companyId: number,
    data: Partial<CompanyPrinter>
  ): Promise<ApiResponse<CompanyPrinter>> {
    return api.post<ApiResponse<CompanyPrinter>>(
      `/company-printer/update/?company_id=${companyId}`,
      data
    );
  }

  /**
   * Busca apenas o nome da impressora fiscal
   */
  async getFiscalPrinterName(companyId: number): Promise<{ success: boolean; fiscal_printer: string | null; error?: string }> {
    return api.get<{ success: boolean; fiscal_printer: string | null; error?: string }>(
      `/company-printer/fiscal-name/?company_id=${companyId}`
    );
  }

  /**
   * Busca apenas o nome da impressora A4
   */
  async getA4PrinterName(companyId: number): Promise<{ success: boolean; a4_printer: string | null; error?: string }> {
    return api.get<{ success: boolean; a4_printer: string | null; error?: string }>(
      `/company-printer/a4-name/?company_id=${companyId}`
    );
  }
}

export const companyPrinterService = new CompanyPrinterService();
export default companyPrinterService;

