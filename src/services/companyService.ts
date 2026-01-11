import api from './api';
import type { ApiResponse, Company } from './types';

class CompanyService {
  /**
   * Lista todas as empresas
   */
  async list(companyId?: number): Promise<ApiResponse<Company[]>> {
    const url = companyId 
      ? `/companies/?company_id=${companyId}`
      : '/companies/';
    return api.get<ApiResponse<Company[]>>(url);
  }

  /**
   * Busca uma empresa pelo ID
   */
  async getById(id: number, companyId?: number): Promise<ApiResponse<Company>> {
    const url = companyId
      ? `/companies/${id}/?company_id=${companyId}`
      : `/companies/${id}/`;
    return api.get<ApiResponse<Company>>(url);
  }

  /**
   * Cria uma nova empresa
   */
  async create(data: Partial<Company>): Promise<ApiResponse<Company>> {
    return api.post<ApiResponse<Company>>('/companies/', data);
  }

  /**
   * Atualiza uma empresa
   */
  async update(id: number, data: Partial<Company>, companyId?: number): Promise<ApiResponse<Company>> {
    const url = companyId
      ? `/companies/${id}/?company_id=${companyId}`
      : `/companies/${id}/`;
    return api.put<ApiResponse<Company>>(url, data);
  }

  /**
   * Atualiza parcialmente uma empresa
   */
  async partialUpdate(id: number, data: Partial<Company>, companyId?: number): Promise<ApiResponse<Company>> {
    const url = companyId
      ? `/companies/${id}/?company_id=${companyId}`
      : `/companies/${id}/`;
    return api.patch<ApiResponse<Company>>(url, data);
  }

  /**
   * Deleta uma empresa (soft delete)
   */
  async delete(id: number, companyId?: number): Promise<ApiResponse<void>> {
    const url = companyId
      ? `/companies/${id}/?company_id=${companyId}`
      : `/companies/${id}/`;
    return api.delete<ApiResponse<void>>(url);
  }
}

export const companyService = new CompanyService();
export default companyService;
