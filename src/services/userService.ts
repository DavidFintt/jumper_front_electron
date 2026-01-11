import api from './api';
import type { ApiResponse, User } from './types';

class UserService {
  /**
   * Lista todos os usuários
   */
  async list(companyId?: number): Promise<ApiResponse<User[]>> {
    const url = companyId 
      ? `/users/?company_id=${companyId}`
      : '/users/';
    return api.get<ApiResponse<User[]>>(url);
  }

  /**
   * Busca um usuário pelo ID
   */
  async getById(id: number, companyId?: number): Promise<ApiResponse<User>> {
    const url = companyId
      ? `/users/${id}/?company_id=${companyId}`
      : `/users/${id}/`;
    return api.get<ApiResponse<User>>(url);
  }

  /**
   * Cria um novo usuário
   */
  async create(data: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    is_admin?: boolean;
    company?: number | null;
    companies_managed?: number[];
  }, companyId?: number): Promise<ApiResponse<User>> {
    const url = companyId
      ? `/users/create/?company_id=${companyId}`
      : '/users/create/';
    return api.post<ApiResponse<User>>(url, data);
  }

  /**
   * Atualiza um usuário
   */
  async update(id: number, data: Partial<User> & {
    companies_managed?: number[];
  }, companyId?: number): Promise<ApiResponse<User>> {
    const url = companyId
      ? `/users/${id}/edit/?company_id=${companyId}`
      : `/users/${id}/edit/`;
    return api.put<ApiResponse<User>>(url, data);
  }

  /**
   * Atualiza parcialmente um usuário
   */
  async partialUpdate(id: number, data: Partial<User> & {
    companies_managed?: number[];
  }, companyId?: number): Promise<ApiResponse<User>> {
    const url = companyId
      ? `/users/${id}/edit/?company_id=${companyId}`
      : `/users/${id}/edit/`;
    return api.patch<ApiResponse<User>>(url, data);
  }

  /**
   * Deleta um usuário
   */
  async delete(id: number, companyId?: number): Promise<ApiResponse<void>> {
    const url = companyId
      ? `/users/${id}/delete/?company_id=${companyId}`
      : `/users/${id}/delete/`;
    return api.delete<ApiResponse<void>>(url);
  }

  /**
   * Altera senha do usuário
   */
  async changePassword(data: {
    old_password: string;
    new_password: string;
  }): Promise<ApiResponse<void>> {
    return api.post<ApiResponse<void>>('/users/change-password/', data);
  }
}

export const userService = new UserService();
export default userService;
