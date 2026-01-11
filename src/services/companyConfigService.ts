import api from './api';
import type { ApiResponse, CompanyConfig } from './types';

class CompanyConfigService {
  /**
   * Busca configuração da empresa pelo ID
   */
  async getByCompanyId(companyId: number): Promise<ApiResponse<CompanyConfig>> {
    return api.get<ApiResponse<CompanyConfig>>(
      `/company-config/${companyId}/?company_id=${companyId}`
    );
  }

  /**
   * Busca configuração da empresa (sem ID específico)
   */
  async get(companyId?: number): Promise<ApiResponse<CompanyConfig>> {
    const url = companyId 
      ? `/company-config/?company_id=${companyId}`
      : '/company-config/';
    return api.get<ApiResponse<CompanyConfig>>(url);
  }

  /**
   * Cria nova configuração da empresa
   */
  async create(
    data: Partial<CompanyConfig>,
    companyId?: number
  ): Promise<ApiResponse<CompanyConfig>> {
    const url = companyId
      ? `/company-config/create/?company_id=${companyId}`
      : '/company-config/create/';
    return api.post<ApiResponse<CompanyConfig>>(url, data);
  }

  /**
   * Atualiza configuração da empresa
   */
  async update(
    companyId: number,
    data: Partial<CompanyConfig>
  ): Promise<ApiResponse<CompanyConfig>> {
    return api.put<ApiResponse<CompanyConfig>>(
      `/company-config/update/?company_id=${companyId}`,
      data
    );
  }

  /**
   * Atualiza parcialmente a configuração da empresa
   */
  async partialUpdate(
    companyId: number,
    data: Partial<CompanyConfig>
  ): Promise<ApiResponse<CompanyConfig>> {
    return api.patch<ApiResponse<CompanyConfig>>(
      `/company-config/update/?company_id=${companyId}`,
      data
    );
  }
}

export const companyConfigService = new CompanyConfigService();
export default companyConfigService;
