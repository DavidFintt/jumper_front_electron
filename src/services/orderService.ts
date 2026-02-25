import api from './api';
import type { Order, OrderItem } from './types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class OrderService {

  // Listar pedidos
  async list(companyId?: number, status?: string, opts?: { dateFrom?: string; dateTo?: string; expired?: boolean; cashRegisterId?: string | number }): Promise<ApiResponse<Order[]>> {
    try {
      const params: any = {};
      if (companyId) params.company_id = companyId;
      if (status) params.status = status;
      if (opts?.dateFrom) params.date_from = opts.dateFrom;
      if (opts?.dateTo) params.date_to = opts.dateTo;
      if (typeof opts?.expired === 'boolean') params.expired = opts.expired;
      if (opts?.cashRegisterId != null) params.cash_register_id = String(opts.cashRegisterId);

      const response = await api.get<ApiResponse<Order[]>>('/orders/', { params });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao listar pedidos'
      };
    }
  }

  // Buscar pedido por ID
  async getById(orderId: string, companyId?: number): Promise<ApiResponse<Order>> {
    try {
      const params: any = {};
      if (companyId) params.company_id = companyId;

      const response = await api.get<ApiResponse<Order>>(`/orders/${orderId}/`, { params });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao buscar pedido'
      };
    }
  }

  // Buscar pedido por jump_usage_id
  async getByJumpUsage(jumpUsageId: string, companyId?: number): Promise<ApiResponse<Order>> {
    try {
      const params: any = {};
      if (companyId) params.company_id = companyId;

      const response = await api.get<ApiResponse<Order>>(`/orders/by-jump/${jumpUsageId}/`, { params });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao buscar pedido'
      };
    }
  }

  // Criar pedido
  async create(orderData: {
    jump_usage: string;
    company: number;
    customer: string;
    dependente?: string | null;
  }): Promise<ApiResponse<Order>> {
    try {
      const response = await api.post<ApiResponse<Order>>('/orders/create/', orderData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao criar pedido'
      };
    }
  }

  // Fechar pedido
  async close(
    orderId: string, 
    companyId?: number, 
    adjustments?: { [jumpId: string]: number } | { dryRun?: boolean },
    paymentDetails?: {payment_type: string, amount: string}[]
  ): Promise<ApiResponse<Order> & { cupom_fiscal?: string; preview?: any }> {
    try {
      const params: any = {};
      if (companyId) params.company_id = companyId;
      
      let isDryRun = false;
      let actualAdjustments = undefined;
      
      if (adjustments) {
        if ('dryRun' in adjustments) {
          isDryRun = adjustments.dryRun || false;
        } else {
          actualAdjustments = adjustments;
        }
      }
      
      if (isDryRun) params.dry_run = true;

      const body: any = actualAdjustments ? { additional_time_adjustments: actualAdjustments } : {};
      if (paymentDetails && paymentDetails.length > 0) {
        body.payment_details = paymentDetails;
      }
      
      const response = await api.post<ApiResponse<Order> & { cupom_fiscal?: string; preview?: any }>(`/orders/${orderId}/close/`, body, { params });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao fechar pedido'
      };
    }
  }

  // Adicionar item ao pedido
  async addItem(itemData: {
    order: string;
    product: string;
    item_type: 'jump_time' | 'consumable' | 'additional_time';
    quantity: number;
    unit_price?: string;
    description?: string;
    equipment_unit?: string;
  }): Promise<ApiResponse<OrderItem>> {
    try {
      const response = await api.post<ApiResponse<OrderItem>>('/orders/items/create/', itemData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao adicionar item ao pedido'
      };
    }
  }

  // Remover item do pedido
  async removeItem(itemId: string, companyId?: number): Promise<ApiResponse<void>> {
    try {
      const params: any = {};
      if (companyId) params.company_id = companyId;

      const response = await api.delete<ApiResponse<void>>(`/orders/items/${itemId}/delete/`, { params });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao remover item do pedido'
      };
    }
  }

  // Alternar estado de pago de um item
  async toggleItemPago(itemId: string, companyId?: number): Promise<ApiResponse<OrderItem>> {
    try {
      const params: any = {};
      if (companyId) params.company_id = companyId;

      const response = await api.patch<ApiResponse<OrderItem>>(`/orders/items/${itemId}/toggle-pago/`, {}, { params });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao atualizar item'
      };
    }
  }

  // Obter cupom fiscal de um pedido fechado
  async getCupomFiscal(orderId: string, companyId?: number): Promise<{ success: boolean; data?: { order_id: string; cupom_fiscal: string }; error?: string }> {
    try {
      const params: any = {};
      if (companyId) params.company_id = companyId;
      const response = await api.get<{ success: boolean; data: { order_id: string; cupom_fiscal: string } }>(`/orders/${orderId}/cupom-fiscal/`, { params });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao obter cupom fiscal'
      };
    }
  }
}

export const orderService = new OrderService();

