import axios, { 
  type AxiosInstance, 
  type AxiosRequestConfig, 
  type AxiosResponse, 
  type AxiosError 
} from 'axios';

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:8000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor - Adiciona token em todas as requisições
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor - Trata erros e refresh token
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Se o erro for 401 (Unauthorized) e não for uma retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Se não há refresh token, desloga imediatamente
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            this.logout();
            return Promise.reject(error);
          }

          if (this.isRefreshing) {
            // Se já está refreshing, adiciona na fila
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.api(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Tenta fazer refresh do token
            const response = await axios.post('http://localhost:8000/api/token/refresh/', {
              refresh: refreshToken,
            });

            if (response.data && response.data.access) {
              const newAccessToken = response.data.access;
              localStorage.setItem('accessToken', newAccessToken);

              // Atualiza o token na requisição original
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              }

              // Processa fila de requisições
              this.processQueue(null);

              return this.api(originalRequest);
            } else {
              this.logout();
              return Promise.reject(error);
            }
          } catch (refreshError) {
            this.processQueue(refreshError);
            this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Para outros erros, não desloga automaticamente
        // 403 pode ser erro de permissão, não necessariamente token inválido
        // Só desloga se for realmente um problema de autenticação que não pode ser resolvido
        
        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: unknown) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });

    this.failedQueue = [];
  }

  private logout() {
    localStorage.clear();
    // Força reload da página para limpar estado do React
    window.location.reload();
  }

  // Métodos HTTP
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, config);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data, config);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data, config);
    return response.data;
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url, config);
    return response.data;
  }

  // Método para fazer logout manual
  public logoutUser() {
    this.logout();
  }

  // Expõe a instância axios para casos especiais (como download de blobs)
  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

// Exporta instância única (Singleton)
export const api = new ApiService();
export default api;
