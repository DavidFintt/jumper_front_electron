import { api } from './api';
import type { EquipmentUnit } from './types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | Record<string, string[]>;
  count?: number;
  message?: string;
  details?: Record<string, string[]>;
}

export const equipmentUnitService = {
  async list(productId: number, status?: string): Promise<ApiResponse<EquipmentUnit[]>> {
    try {
      let url = `/equipment-units/?product_id=${productId}`;
      if (status) {
        url += `&status=${status}`;
      }
      const response = await api.get(url);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao listar unidades',
      };
    }
  },

  async create(data: {
    product: number;
    number: string;
    status?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<EquipmentUnit>> {
    try {
      const response = await api.post('/equipment-units/', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao criar unidade',
        details: error.response?.data?.details,
      };
    }
  },

  async get(unitId: number): Promise<ApiResponse<EquipmentUnit>> {
    try {
      const response = await api.get(`/equipment-units/${unitId}/`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao buscar unidade',
      };
    }
  },

  async update(
    unitId: number,
    data: {
      number?: string;
      status?: string;
      is_active?: boolean;
    }
  ): Promise<ApiResponse<EquipmentUnit>> {
    try {
      const response = await api.patch(`/equipment-units/${unitId}/`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao atualizar unidade',
        details: error.response?.data?.details,
      };
    }
  },

  async delete(unitId: number): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`/equipment-units/${unitId}/`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao deletar unidade',
      };
    }
  },
};

export default equipmentUnitService;
