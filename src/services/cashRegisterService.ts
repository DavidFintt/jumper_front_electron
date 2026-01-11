import api from './api';
import type { CashRegisterCloseResponse } from './types';

export interface CashRegister {
  id: number;
  user: number;
  user_email: string;
  user_name: string;
  company: number;
  company_name: string;
  status: 'open' | 'closed';
  opening_amount: string;
  opened_at: string;
  closing_amount: string | null;
  closed_at: string | null;
  total_sales: string;
  total_orders: number;
  expected_closing_amount: string;
  difference: string | null;
  opening_notes: string;
  closing_notes: string;
  created_at: string;
  updated_at: string;
}

export interface OpenCashRegisterData {
  opening_amount: number;
  opening_notes?: string;
}

export interface CloseCashRegisterData {
  closing_amount: number;
  closing_notes?: string;
  transfer_to_user_id?: number;
}

export interface WithdrawalData {
  amount: number;
  notes?: string;
}

const cashRegisterService = {
  // Abrir caixa
  open: async (data: OpenCashRegisterData, companyId?: number) => {
    try {
      const params = companyId ? { company_id: companyId } : {};
      const response = await api.post('cash-register/open/', data, { params });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao abrir caixa'
      };
    }
  },

  // Fechar caixa
  close: async (cashRegisterId: number, data: CloseCashRegisterData) => {
    try {
      const response = await api.post(`cash-register/${cashRegisterId}/close/`, data);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao fechar caixa',
        pending_items: error.response?.data?.pending_items || null  // Preservar pending_items do erro
      };
    }
  },

  // Buscar caixa atual do usuário
  getCurrent: async (companyId?: number) => {
    try {
      const params = companyId ? { company_id: companyId } : {};
      const response = await api.get('cash-register/current/', { params });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao buscar caixa atual'
      };
    }
  },

  // Listar caixas
  list: async (params?: { company_id?: number; status?: string }) => {
    try {
      const response = await api.get('cash-register/', { params });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao listar caixas'
      };
    }
  },

  // Buscar detalhes de um caixa
  getById: async (cashRegisterId: number) => {
    try {
      const response = await api.get(`cash-register/${cashRegisterId}/`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao buscar caixa'
      };
    }
  },

  // Realizar sangria do caixa
  withdrawal: async (cashRegisterId: number, data: WithdrawalData) => {
    try {
      const response = await api.post(`cash-register/${cashRegisterId}/withdrawal/`, data);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao realizar sangria'
      };
    }
  },
};

export default cashRegisterService;
