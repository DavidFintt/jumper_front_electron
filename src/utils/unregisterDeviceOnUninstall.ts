/**
 * Função helper para desvincular dispositivo antes de fechar o app
 * Deve ser chamada quando o usuário quiser desinstalar ou quando o app for fechado
 */
export async function unregisterDeviceOnUninstall(): Promise<void> {
  // Verificar se está rodando no Electron
  if (!window.electronAPI?.unregisterDevice) {
    console.warn('⚠️ Electron API não disponível - pulando desvinculação');
    return;
  }

  try {
    // Obter dados do localStorage
    const selectedCompany = localStorage.getItem('selectedCompany');
    const accessToken = localStorage.getItem('accessToken');

    if (!selectedCompany || !accessToken) {
      console.warn('⚠️ Dados de empresa ou token não encontrados - pulando desvinculação');
      return;
    }

    const companyId = parseInt(selectedCompany, 10);
    if (isNaN(companyId)) {
      console.warn('⚠️ Company ID inválido - pulando desvinculação');
      return;
    }

    console.log('🔧 Desvinculando dispositivo da empresa...', { companyId });

    const result = await window.electronAPI.unregisterDevice(companyId, accessToken);

    if (result.success) {
      console.log('✅ Dispositivo desvinculado com sucesso!');
    } else {
      console.error('❌ Erro ao desvincular dispositivo:', result.error);
    }
  } catch (error) {
    console.error('❌ Erro ao desvincular dispositivo:', error);
  }
}






















