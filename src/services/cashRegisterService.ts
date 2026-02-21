import api from './api';
import type { CashRegisterCloseResponse } from './types';

export interface CashRegister {
  id: string;
  user: string;
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

// Cache para o caixa atual - evita delay ao navegar entre menus
interface CashRegisterCache {
  data: CashRegister | null;
  companyId: number;
  timestamp: number;
}

let currentCashRegisterCache: CashRegisterCache | null = null;
const CACHE_TTL = 30000; // 30 segundos de cache

export interface OpenCashRegisterData {
  opening_amount: number;
  opening_notes?: string;
}

export interface CloseCashRegisterData {
  closing_amount: number;
  closing_notes?: string;
  transfer_to_user_id?: string;
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
      // Invalidar cache após abrir caixa
      if (response.success) {
        currentCashRegisterCache = null;
      }
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao abrir caixa'
      };
    }
  },

  // Fechar caixa
  close: async (cashRegisterId: string, data: CloseCashRegisterData) => {
    try {
      const response = await api.post(`cash-register/${cashRegisterId}/close/`, data);
      // Invalidar cache após fechar caixa
      if (response.success) {
        currentCashRegisterCache = null;
      }
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao fechar caixa',
        pending_items: error.response?.data?.pending_items || null  // Preservar pending_items do erro
      };
    }
  },

  // Buscar caixa atual do usuário (com cache para evitar delay)
  getCurrent: async (companyId?: number, forceRefresh: boolean = false) => {
    try {
      const params = companyId ? { company_id: companyId } : {};
      
      // Verificar cache se não forçar refresh
      if (!forceRefresh && companyId && currentCashRegisterCache) {
        const now = Date.now();
        const cacheValid = 
          currentCashRegisterCache.companyId === companyId &&
          (now - currentCashRegisterCache.timestamp) < CACHE_TTL;
        
        if (cacheValid) {
          return {
            success: true,
            data: currentCashRegisterCache.data
          };
        }
      }
      
      const response = await api.get('cash-register/current/', { params });
      
      // Atualizar cache
      if (companyId && response.success) {
        currentCashRegisterCache = {
          data: response.data || null,
          companyId,
          timestamp: Date.now()
        };
      }
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao buscar caixa atual'
      };
    }
  },

  // Invalidar cache do caixa (chamar após abrir/fechar caixa)
  invalidateCache: () => {
    currentCashRegisterCache = null;
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
  getById: async (cashRegisterId: string) => {
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
  withdrawal: async (cashRegisterId: string, data: WithdrawalData) => {
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
