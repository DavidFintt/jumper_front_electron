import api from './api';
import type { ApiResponse } from './types';

export interface CompanyMachine {
  id: number;
  company: number;
  machine_id: string;
  created_at: string;
  updated_at: string;
}

interface VerifyMachineResponse {
  success: boolean;
  authorized: boolean;
  needs_registration: boolean;
  is_first_device?: boolean;
  message: string;
  max_machines?: number;
  registered_machines?: number;
  available_slots?: number;
}

class CompanyMachineService {
  /**
   * Lista todas as máquinas cadastradas de uma empresa
   */
  async listMachines(companyId: number): Promise<ApiResponse<CompanyMachine[]>> {
    return api.get<ApiResponse<CompanyMachine[]>>(
      `/company-machines/?company_id=${companyId}`
    );
  }

  /**
   * Registra uma nova máquina para a empresa
   */
  async registerMachine(companyId: number, machineId: string): Promise<ApiResponse<CompanyMachine>> {
    return api.post<ApiResponse<CompanyMachine>>(
      `/company-machines/register/`,
      {
        company_id: companyId,
        machine_id: machineId
      }
    );
  }

  /**
   * Verifica se a máquina está autorizada para a empresa
   */
  async verifyMachine(companyId: number, machineId: string): Promise<VerifyMachineResponse> {
    return api.post<VerifyMachineResponse>(
      `/company-machines/verify/`,
      {
        company_id: companyId,
        machine_id: machineId
      }
    );
  }

  /**
   * Desvincula um dispositivo da empresa
   */
  async unregisterMachine(companyId: number, machineId: string): Promise<ApiResponse<{ message: string }>> {
    return api.post<ApiResponse<{ message: string }>>(
      `/company-machines/unregister/`,
      {
        company_id: companyId,
        machine_id: machineId
      }
    );
  }
}

export const companyMachineService = new CompanyMachineService();
export default companyMachineService;

