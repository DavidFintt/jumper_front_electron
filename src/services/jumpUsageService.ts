import api from './api';
import type { ApiResponse, JumpUsage, JumpFinishResponse } from './types';

class JumpUsageService {
  /**
   * Lista todos os usos do jump
   */
  async list(companyId?: number): Promise<ApiResponse<JumpUsage[]>> {
    const url = companyId 
      ? `/jump-usage/?company_id=${companyId}`
      : '/jump-usage/';
    return api.get<ApiResponse<JumpUsage[]>>(url);
  }

  /**
   * Lista apenas usos ativos (em andamento)
   */
  async listActive(companyId?: number): Promise<ApiResponse<JumpUsage[]>> {
    const url = companyId
      ? `/jump-usage/active/?company_id=${companyId}`
      : '/jump-usage/active/';
    return api.get<ApiResponse<JumpUsage[]>>(url);
  }

  /**
   * Lista todos os usos ativos para modo TV
   * Superusers veem tudo, admins precisam passar company_id
   */
  async listTV(companyId?: number): Promise<ApiResponse<JumpUsage[]>> {
    const url = companyId
      ? `/jump-usage/tv/?company_id=${companyId}`
      : '/jump-usage/tv/';
    return api.get<ApiResponse<JumpUsage[]>>(url);
  }

  /**
   * Busca um uso pelo ID
   */
  async getById(id: string, companyId?: number): Promise<ApiResponse<JumpUsage>> {
    const url = companyId
      ? `/jump-usage/${id}/?company_id=${companyId}`
      : `/jump-usage/${id}/`;
    return api.get<ApiResponse<JumpUsage>>(url);
  }

  /**
   * Inicia um novo uso
   */
  async create(data: {
    customer: string;
    dependente?: string | null;
  }, companyId?: number): Promise<ApiResponse<JumpUsage>> {
    const url = companyId
      ? `/jump-usage/create/?company_id=${companyId}`
      : '/jump-usage/create/';
    return api.post<ApiResponse<JumpUsage>>(url, data);
  }

  /**
   * Inicia múltiplos usos no mesmo pedido
   */
  async createMultiple(jumpsData: any[], companyId?: number): Promise<ApiResponse<JumpUsage[]>> {
    const url = companyId
      ? `/jump-usage/create-multiple/?company_id=${companyId}`
      : '/jump-usage/create-multiple/';
    return api.post<ApiResponse<JumpUsage[]>>(url, { jumps: jumpsData });
  }

  /**
   * Finaliza um uso
   * Nota: company_id não é mais necessário, o backend busca automaticamente do jump
   */
  async finish(id: string, data?: any, companyId?: number): Promise<JumpFinishResponse> {
    return api.patch<JumpFinishResponse>(`/jump-usage/${id}/finish/`, data || {});
  }

  /**
   * Atualiza um uso (ex: adicionar horas contratadas)
   * Nota: company_id não é mais necessário, o backend busca automaticamente do jump
   */
  async update(id: string, data: Partial<JumpUsage>, companyId?: number): Promise<ApiResponse<JumpUsage>> {
    return api.patch<ApiResponse<JumpUsage>>(`/jump-usage/${id}/update/`, data);
  }

  /**
   * Pausa um uso do jump
   * Nota: company_id não é mais necessário, o backend busca automaticamente do jump
   */
  async pause(id: string, companyId?: number): Promise<ApiResponse<JumpUsage>> {
    return api.post<ApiResponse<JumpUsage>>(`/jump-usage/${id}/pause/`, {});
  }

  /**
   * Retoma um uso do jump pausado
   * Nota: company_id não é mais necessário, o backend busca automaticamente do jump
   */
  async resume(id: string, companyId?: number): Promise<ApiResponse<JumpUsage>> {
    return api.post<ApiResponse<JumpUsage>>(`/jump-usage/${id}/resume/`, {});
  }
}

export const jumpUsageService = new JumpUsageService();
export default jumpUsageService;
