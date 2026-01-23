import { api } from './api';

export interface FiscalEstablishment {
  id: number;
  cnpj: string;
  nfce_csc_id: string;
  nfce_csc_token: string;
  crt?: string;
  crt_display?: string;
  environment?: string;
  environment_display?: string;
  is_active: boolean;
  has_active_certificate: boolean;
  companies_count: number;
  created_at: string;
  updated_at: string;
}

export interface FiscalCertificate {
  id: number;
  establishment: number;
  establishment_cnpj: string;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  is_valid: boolean;
  days_until_expiration: number;
  created_at: string;
  updated_at: string;
}

export interface FiscalNumbering {
  id: number;
  establishment: number;
  establishment_cnpj: string;
  environment: string;
  environment_display: string;
  series: number;
  next_number: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export const fiscalService = {
  async listEstablishments(): Promise<ApiResponse<FiscalEstablishment[]>> {
    try {
      const response = await api.get('/fiscal/establishments/');
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao carregar estabelecimentos fiscais',
        details: error.response?.data?.details
      };
    }
  },

  async getEstablishment(id: number): Promise<ApiResponse<FiscalEstablishment>> {
    try {
      const response = await api.get(`/fiscal/establishments/${id}/`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao carregar estabelecimento fiscal',
        details: error.response?.data?.details
      };
    }
  },

  async createEstablishment(data: {
    cnpj: string;
    nfce_csc_id?: string;
    nfce_csc_token?: string;
    is_active: boolean;
  }): Promise<ApiResponse<FiscalEstablishment>> {
    try {
      const response = await api.post('/fiscal/establishments/create/', data);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao criar estabelecimento fiscal',
        details: error.response?.data?.details
      };
    }
  },

  async updateEstablishment(id: number, data: {
    nfce_csc_id?: string;
    nfce_csc_token?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<FiscalEstablishment>> {
    try {
      const response = await api.patch(`/fiscal/establishments/${id}/update/`, data);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao atualizar estabelecimento fiscal',
        details: error.response?.data?.details
      };
    }
  },

  async listCertificates(establishmentId?: number): Promise<ApiResponse<FiscalCertificate[]>> {
    try {
      const url = establishmentId 
        ? `/fiscal/certificates/?establishment_id=${establishmentId}`
        : '/fiscal/certificates/';
      const response = await api.get(url);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao carregar certificados',
        details: error.response?.data?.details
      };
    }
  },

  async uploadCertificate(data: {
    establishment: number;
    pfx_base64: string;
    pfx_password: string;
  }): Promise<ApiResponse<FiscalCertificate>> {
    try {
      const response = await api.post('/fiscal/certificates/upload/', data);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao enviar certificado',
        details: error.response?.data?.details
      };
    }
  },

  async deleteCertificate(id: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`/fiscal/certificates/${id}/delete/`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao deletar certificado',
        details: error.response?.data?.details
      };
    }
  },

  async listNumberings(establishmentId?: number): Promise<ApiResponse<FiscalNumbering[]>> {
    try {
      const url = establishmentId 
        ? `/fiscal/numberings/?establishment_id=${establishmentId}`
        : '/fiscal/numberings/';
      const response = await api.get(url);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao carregar numerações',
        details: error.response?.data?.details
      };
    }
  },

  async createNumbering(data: {
    establishment: number;
    environment: string;
    series: number;
    next_number: number;
  }): Promise<ApiResponse<FiscalNumbering>> {
    try {
      const response = await api.post('/fiscal/numberings/create/', data);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao criar numeração',
        details: error.response?.data?.details
      };
    }
  },

  async updateNumbering(id: number, data: {
    next_number: number;
  }): Promise<ApiResponse<FiscalNumbering>> {
    try {
      const response = await api.patch(`/fiscal/numberings/${id}/update/`, data);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao atualizar numeração',
        details: error.response?.data?.details
      };
    }
  },
};

export default fiscalService;
