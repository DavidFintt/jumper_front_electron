/**
 * Serviço de ativação de PDV
 * 
 * Fluxo:
 * 1. Admin gera código no jump_web (nuvem)
 * 2. Operador insere código no electron (PDV)
 * 3. Electron envia código para backend LOCAL (8000)
 * 4. Backend local valida com nuvem usando CLOUD_API_TOKEN
 * 5. Backend local salva dados no SQLite
 */

export interface ActivationResponse {
  success: boolean;
  message?: string;
  error?: string;
  company_id?: number;
  data?: {
    company: number;
    users: number;
    products: number;
    customers: number;
    product_types: number;
    payment_types: number;
    equipment_units: number;
    dependentes: number;
    company_config: boolean;
  };
}

export const activationService = {
  /**
   * Ativa o PDV enviando o codigo para o backend LOCAL.
   * O backend local se encarrega de:
   * 1. Validar o codigo na nuvem
   * 2. Baixar os dados da empresa
   * 3. Salvar no banco SQLite local
   */
  activate: async (code: string): Promise<ActivationResponse> => {
    const LOCAL_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    let machineId = 'unknown';
    let machineName = 'unknown';

    try {
      if (window.electronAPI?.getMachineId) {
        machineId = await window.electronAPI.getMachineId();
      }
      if (window.electronAPI?.getMachineName) {
        machineName = await window.electronAPI.getMachineName();
      }
    } catch (err) {
      console.error('Erro ao obter identificacao da maquina:', err);
    }

    const url = `${LOCAL_API_URL}/api/sync/activate-pdv/`;
    console.log('🔍 Enviando codigo para backend local:', url);
    console.log('📝 Dados:', { code: code.toUpperCase().trim(), machine_id: machineId, machine_name: machineName });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: code.toUpperCase().trim(),
        machine_id: machineId,
        machine_name: machineName
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📡 Response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Response data:', data);
    return data;
  },

  isBootstrapped: async (): Promise<boolean> => {
    try {
      const LOCAL_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${LOCAL_API_URL}/api/companies/check-bootstrapped/`);
      const data = await response.json();
      
      return data.bootstrapped || false;
    } catch (error) {
      console.error('Erro ao verificar bootstrap:', error);
      return false;
    }
  },

  clearBootstrap: (): void => {
    localStorage.removeItem('bootstrapped_company');
    localStorage.removeItem('selectedCompany');
  }
};

export default activationService;
