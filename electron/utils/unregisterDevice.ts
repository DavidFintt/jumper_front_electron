import { getMachineId } from "./getMachineId";

interface UnregisterDeviceParams {
  companyId: number;
  accessToken: string;
}

/**
 * Desvincula o dispositivo da empresa durante o uninstall
 */
export async function unregisterDevice({ companyId, accessToken }: UnregisterDeviceParams): Promise<{ success: boolean; error?: string }> {
  try {
    const machineId = await getMachineId();
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:8000';
    
    const response = await fetch(`${apiUrl}/api/company-machines/unregister/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        company_id: companyId,
        machine_id: machineId
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Dispositivo desvinculado com sucesso da empresa ${companyId}`);
      return { success: true };
    } else {
      console.error(`❌ Erro ao desvincular dispositivo: ${data.error || 'Erro desconhecido'}`);
      return { success: false, error: data.error || 'Erro desconhecido' };
    }
  } catch (error: any) {
    console.error('❌ Erro ao desvincular dispositivo:', error);
    return { success: false, error: error.message || 'Erro de conexão' };
  }
}






















