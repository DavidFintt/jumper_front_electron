import api from './api';
import type { ApiResponse, Customer, Dependente } from './types';

class CustomerService {
  /**
   * Lista todos os clientes
   */
  async list(companyId?: number): Promise<ApiResponse<Customer[]>> {
    const url = companyId 
      ? `/customers/?company_id=${companyId}`
      : '/customers/';
    return api.get<ApiResponse<Customer[]>>(url);
  }

  /**
   * Busca um cliente pelo ID
   */
  async getById(id: number, companyId?: number): Promise<ApiResponse<Customer>> {
    const url = companyId
      ? `/customers/${id}/?company_id=${companyId}`
      : `/customers/${id}/`;
    return api.get<ApiResponse<Customer>>(url);
  }

  /**
   * Cria um novo cliente
   */
  async create(data: Partial<Customer>, companyId?: number): Promise<ApiResponse<Customer>> {
    const url = companyId
      ? `/customers/create/?company_id=${companyId}`
      : '/customers/create/';
    return api.post<ApiResponse<Customer>>(url, data);
  }

  /**
   * Atualiza um cliente
   */
  async update(id: number, data: Partial<Customer>, companyId?: number): Promise<ApiResponse<Customer>> {
    const url = companyId
      ? `/customers/${id}/update/?company_id=${companyId}`
      : `/customers/${id}/update/`;
    return api.put<ApiResponse<Customer>>(url, data);
  }

  /**
   * Atualiza parcialmente um cliente
   */
  async partialUpdate(id: number, data: Partial<Customer>, companyId?: number): Promise<ApiResponse<Customer>> {
    const url = companyId
      ? `/customers/${id}/?company_id=${companyId}`
      : `/customers/${id}/`;
    return api.patch<ApiResponse<Customer>>(url, data);
  }

  /**
   * Deleta um cliente
   */
  async delete(id: number, companyId?: number): Promise<ApiResponse<void>> {
    const url = companyId
      ? `/customers/${id}/delete/?company_id=${companyId}`
      : `/customers/${id}/delete/`;
    return api.delete<ApiResponse<void>>(url);
  }

  // ========== Dependentes ==========

  /**
   * Lista todos os dependentes
   */
  async listDependentes(companyId?: number): Promise<ApiResponse<Dependente[]>> {
    const url = companyId
      ? `/dependentes/?company_id=${companyId}`
      : '/dependentes/';
    return api.get<ApiResponse<Dependente[]>>(url);
  }

  /**
   * Lista dependentes de um cliente específico
   */
  async getCustomerDependentes(customerId: number, companyId?: number): Promise<ApiResponse<Dependente[]>> {
    const url = companyId
      ? `/customers/${customerId}/dependentes/?company_id=${companyId}`
      : `/customers/${customerId}/dependentes/`;
    return api.get<ApiResponse<Dependente[]>>(url);
  }

  /**
   * Busca um dependente pelo ID
   */
  async getDependenteById(id: number, companyId?: number): Promise<ApiResponse<Dependente>> {
    const url = companyId
      ? `/dependentes/${id}/?company_id=${companyId}`
      : `/dependentes/${id}/`;
    return api.get<ApiResponse<Dependente>>(url);
  }

  /**
   * Cria um novo dependente
   */
  async createDependente(data: Partial<Dependente>, companyId?: number): Promise<ApiResponse<Dependente>> {
    const url = companyId
      ? `/dependentes/create/?company_id=${companyId}`
      : '/dependentes/create/';
    return api.post<ApiResponse<Dependente>>(url, data);
  }

  /**
   * Atualiza um dependente
   */
  async updateDependente(id: number, data: Partial<Dependente>, companyId?: number): Promise<ApiResponse<Dependente>> {
    const url = companyId
      ? `/dependentes/${id}/update/?company_id=${companyId}`
      : `/dependentes/${id}/update/`;
    return api.put<ApiResponse<Dependente>>(url, data);
  }

  /**
   * Deleta um dependente
   */
  async deleteDependente(id: number, companyId?: number): Promise<ApiResponse<void>> {
    const url = companyId
      ? `/dependentes/${id}/delete/?company_id=${companyId}`
      : `/dependentes/${id}/delete/`;
    return api.delete<ApiResponse<void>>(url);
  }

  // ========== Verificação de Idade ==========

  /**
   * Verifica se uma data de nascimento corresponde a menor de 18 anos
   */
  async verificarIdade(dataNascimento: string): Promise<ApiResponse<{ idade: number; menor_de_18: boolean; mensagem: string }>> {
    return api.post<ApiResponse<{ idade: number; menor_de_18: boolean; mensagem: string }>>(
      '/customers/verificar-idade/',
      { data_nascimento: dataNascimento }
    );
  }

  /**
   * Gera termo de responsabilidade em PDF para um dependente
   */
  async gerarTermo(dependenteId: number, companyId?: number): Promise<Blob> {
    const url = companyId
      ? `/dependentes/${dependenteId}/termo/?company_id=${companyId}`
      : `/dependentes/${dependenteId}/termo/`;
    
    // Fazemos a requisição direto da instância axios para obter o blob
    const axiosInstance = api.getAxiosInstance();
    const response = await axiosInstance.get(url, {
      responseType: 'blob',
    });
    
    return response.data;
  }
}

export const customerService = new CustomerService();
export default customerService;
