import api from './api';
import type { ApiResponse, Product, ProductType } from './types';

class ProductService {
  /**
   * Lista todos os tipos de produtos
   */
  async listTypes(companyId?: number): Promise<ApiResponse<ProductType[]>> {
    let url = '/product-types/';
    if (companyId) {
      url += `?company_id=${companyId}`;
    }
    return api.get<ApiResponse<ProductType[]>>(url);
  }

  /**
   * Cria um novo tipo de produto
   */
  async createType(data: { name: string; description?: string }): Promise<ApiResponse<ProductType>> {
    return api.post<ApiResponse<ProductType>>('/product-types/create/', data);
  }

  /**
   * Lista todos os produtos
   */
  async list(filters?: { product_type_id?: number; product_type_name?: string; is_active?: boolean; company_id?: number }): Promise<ApiResponse<Product[]>> {
    let url = '/products/';
    const params = new URLSearchParams();
    
    if (filters?.product_type_id) {
      params.append('product_type_id', filters.product_type_id.toString());
    }
    
    if (filters?.product_type_name) {
      params.append('product_type_name', filters.product_type_name);
    }
    
    if (filters?.is_active !== undefined) {
      params.append('is_active', filters.is_active.toString());
    }
    
    if (filters?.company_id) {
      params.append('company_id', filters.company_id.toString());
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return api.get<ApiResponse<Product[]>>(url);
  }

  /**
   * Busca um produto pelo ID
   */
  async getById(id: number): Promise<ApiResponse<Product>> {
    return api.get<ApiResponse<Product>>(`/products/${id}/`);
  }

  /**
   * Cria um novo produto
   */
  async create(data: Partial<Product>, companyId?: number): Promise<ApiResponse<Product>> {
    let url = '/products/create/';
    if (companyId) {
      url += `?company_id=${companyId}`;
    }
    return api.post<ApiResponse<Product>>(url, data);
  }

  /**
   * Atualiza um produto
   */
  async update(id: number, data: Partial<Product>, companyId?: number): Promise<ApiResponse<Product>> {
    let url = `/products/${id}/update/`;
    if (companyId) {
      url += `?company_id=${companyId}`;
    }
    return api.patch<ApiResponse<Product>>(url, data);
  }

  /**
   * Deleta um produto (soft delete)
   */
  async delete(id: number, companyId?: number): Promise<ApiResponse<void>> {
    let url = `/products/${id}/delete/`;
    if (companyId) {
      url += `?company_id=${companyId}`;
    }
    return api.delete<ApiResponse<void>>(url);
  }
}

export const productService = new ProductService();
export default productService;
