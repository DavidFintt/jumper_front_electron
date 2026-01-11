import api from './api';
import type { ApiResponse, LoginCredentials, LoginResponse } from './types';

class AuthService {
  /**
   * Faz login do usuário
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    return api.post<ApiResponse<LoginResponse>>('/login/', credentials);
  }

  /**
   * Faz refresh do token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ access: string }>> {
    return api.post<ApiResponse<{ access: string }>>('/refresh/', {
      refresh: refreshToken,
    });
  }

  /**
   * Faz logout do usuário
   */
  logout(): void {
    api.logoutUser();
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token;
  }

  /**
   * Retorna o token de acesso
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Retorna o token de refresh
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Retorna dados do usuário logado
   */
  getCurrentUser(): any | null {
    const userStr = localStorage.getItem('userData');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const authService = new AuthService();
export default authService;
