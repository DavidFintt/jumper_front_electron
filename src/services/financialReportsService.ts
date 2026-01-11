import api from './api';

export interface FinancialSummary {
  total_orders: number;
  total_revenue: number;
  average_ticket: number;
}

export interface SalesByPeriod {
  period: string;
  total_orders: number;
  total_revenue: number;
}

export interface SalesByCashRegister {
  id: number;
  user: string;
  user_name: string;
  opened_at: string;
  closed_at: string | null;
  status: string;
  opening_amount: number;
  closing_amount: number | null;
  total_sales: number;
  total_orders: number;
  expected_closing_amount: number;
  difference: number | null;
}

export interface SalesByUser {
  user_email: string;
  user_name: string;
  total_cash_registers: number;
  total_orders: number;
  total_revenue: number;
}

const financialReportsService = {
  // Resumo financeiro geral
  getSummary: async (params: {
    company_id?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      console.log('🌐 [Service] GET reports/financial-summary/ com params:', params);
      const response = await api.get<{ success: boolean; data: FinancialSummary }>('reports/financial-summary/', { params });
      console.log('🌐 [Service] Resposta recebida:', response);
      return response; // api.get() já retorna response.data
    } catch (error: any) {
      console.error('🌐 [Service] Erro na requisição:', error);
      console.error('🌐 [Service] Erro response:', error.response);
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao buscar resumo financeiro'
      };
    }
  },

  // Vendas por período
  getSalesByPeriod: async (params: {
    company_id?: number;
    period?: 'day' | 'month' | 'year';
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const response = await api.get<{ success: boolean; data: SalesByPeriod[] }>('reports/sales-by-period/', { params });
      return response; // api.get() já retorna response.data
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao buscar vendas por período'
      };
    }
  },

  // Vendas por caixa
  getSalesByCashRegister: async (params: {
    company_id?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const response = await api.get<{ success: boolean; data: SalesByCashRegister[] }>('reports/sales-by-cash-register/', { params });
      return response; // api.get() já retorna response.data
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao buscar vendas por caixa'
      };
    }
  },

  // Vendas por usuário
  getSalesByUser: async (params: {
    company_id?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const response = await api.get<{ success: boolean; data: SalesByUser[] }>('reports/sales-by-user/', { params });
      return response; // api.get() já retorna response.data
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao buscar vendas por usuário'
      };
    }
  },

  // Detalhes de um caixa específico
  getCashRegisterDetail: async (cashRegisterId: number, companyId: number) => {
    try {
      const response = await api.get<{ success: boolean; data: any }>(
        `reports/cash-register/${cashRegisterId}/`,
        { params: { company_id: companyId } }
      );
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao buscar detalhes do caixa'
      };
    }
  },

  // Detalhes das vendas de um usuário específico
  getUserSalesDetail: async (userId: number, params: {
    company_id?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const response = await api.get<{ success: boolean; data: any }>(
        `reports/user/${userId}/sales-detail/`,
        { params }
      );
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao buscar detalhes das vendas do usuário'
      };
    }
  }
};

export default financialReportsService;

