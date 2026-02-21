/// <reference types="../../../global" />
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiLogOut, FiCheckCircle, FiArrowRight, FiMonitor, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import { companyMachineService } from '../../../services';
import { api } from '../../../services/api';
import { toast } from 'react-toastify';
import { formatCompanyName } from '../../../utils/companyUtils';
import './SelectCompany.css';

interface Company {
  id: number;
  name: string;
  legal_name: string;
  cnpj: string;
}

interface UserData {
  is_admin: boolean;
  is_superuser: boolean;
  companies_managed_ids: number[];
  first_name: string;
  full_name: string;
}

function SelectCompany() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [verifyingMachine, setVerifyingMachine] = useState(false);
  const [showMachineDialog, setShowMachineDialog] = useState(false);
  const [machineId, setMachineId] = useState<string | null>(null);
  const [machineVerificationData, setMachineVerificationData] = useState<{
    isFirstDevice: boolean;
    availableSlots: number;
    maxMachines: number;
    registeredMachines: number;
  } | null>(null);

  useEffect(() => {
    console.log('SelectCompany - useEffect montado');
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('userData');
      
      console.log('SelectCompany - loadCompanies iniciado');
      console.log('User data:', userStr);
      
      if (!accessToken || !userStr) {
        console.log('Sem token ou user, redirecionando para login');
        navigate('/');
        return;
      }

      const user: UserData = JSON.parse(userStr);
      console.log('User parsed:', user);
      console.log('is_admin:', user.is_admin, 'is_superuser:', user.is_superuser);

      // Se não for admin nem superuser, redirecionar
      if (!user.is_admin && !user.is_superuser) {
        console.log('Usuário não é admin nem superuser, redirecionando');
        navigate('/dashboard');
        return;
      }

      // Se for superuser, buscar todas as empresas
      let url = 'http://localhost:8000/api/companies/';
      
      // Se for admin (não superuser), buscar apenas empresas gerenciadas
      if (!user.is_superuser) {
        // A API já filtra baseado no usuário autenticado
        url = 'http://localhost:8000/api/companies/';
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Response de empresas:', data);
        
        if (data.success && data.data) {
          // Filtrar apenas empresas ativas
          const activeCompanies = data.data.filter((company: any) => company.is_active === true);
          console.log('Empresas ativas carregadas:', activeCompanies.length);
          setCompanies(activeCompanies);
          
          if (activeCompanies.length === 0) {
            setError('Nenhuma empresa ativa disponível');
          }
        } else {
          console.log('Nenhuma empresa disponível');
          setError('Nenhuma empresa disponível');
        }
      } else if (response.status === 401) {
        // Token expirado
        localStorage.clear();
        navigate('/');
      } else {
        setError('Erro ao carregar empresas');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error('Load companies error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = (companyId: number) => {
    console.log('handleSelectCompany chamado com:', companyId);
    setSelectedCompany(companyId);
  };

  const handleConfirm = async () => {
    console.log('handleConfirm chamado, selectedCompany:', selectedCompany);
    if (!selectedCompany) return;

    setVerifyingMachine(true);

    try {
      // Verificar se está rodando no Electron
      if (!window.electronAPI?.getMachineId) {
        console.warn('⚠️ Electron API não disponível - pulando verificação de máquina');
        proceedToLogin();
        return;
      }

      // Obter o machine ID
      const currentMachineId = await window.electronAPI.getMachineId();
      setMachineId(currentMachineId);
      console.log('🔑 Machine ID obtido:', currentMachineId);

      // Verificar se a máquina está autorizada
      const verification = await companyMachineService.verifyMachine(
        selectedCompany,
        currentMachineId
      );

      console.log('🔍 Resultado da verificação:', verification);

      if (verification.authorized) {
        // Máquina autorizada, prosseguir com login
        // toast.success('Dispositivo autorizado!'); // Removido para não poluir a UI
        proceedToLogin();
      } else if (verification.needs_registration) {
        // Há vagas disponíveis, perguntar se deseja cadastrar
        setMachineVerificationData({
          isFirstDevice: verification.is_first_device || false,
          availableSlots: verification.available_slots || 0,
          maxMachines: verification.max_machines || 1,
          registeredMachines: verification.registered_machines || 0
        });
        setShowMachineDialog(true);
      } else {
        // Máquina não autorizada e sem vagas disponíveis
        toast.error('Este dispositivo não está autorizado e o limite de dispositivos foi atingido.');
        setError(`Limite de ${verification.max_machines || 1} dispositivo(s) atingido. Entre em contato com o administrador.`);
      }
    } catch (error) {
      console.error('Erro ao verificar máquina:', error);
      toast.error('Erro ao verificar dispositivo. Tente novamente.');
    } finally {
      setVerifyingMachine(false);
    }
  };

  const handleRegisterMachine = async () => {
    if (!selectedCompany || !machineId) return;

    try {
      setVerifyingMachine(true);
      
      console.log('Registrando dispositivo:', {
        companyId: selectedCompany,
        machineId: machineId
      });
      
      const response = await companyMachineService.registerMachine(
        selectedCompany,
        machineId
      );

      console.log('Resposta do registro:', response);

      if (response.success) {
        toast.success('Dispositivo cadastrado com sucesso!');
        setShowMachineDialog(false);
        proceedToLogin();
      } else {
        console.error('Erro na resposta:', response);
        toast.error('Erro ao cadastrar dispositivo: ' + response.error);
      }
    } catch (error: any) {
      console.error('Erro ao cadastrar máquina:', error);
      console.error('Status:', error.response?.status);
      console.error('Dados do erro:', error.response?.data);
      console.error('Mensagem:', error.message);
      
      // Verificar se é erro de limite atingido
      if (error.response?.status === 403) {
        toast.error('Limite de dispositivos atingido para esta empresa.');
        setError('Limite de dispositivos atingido. Entre em contato com o administrador.');
      } else if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error || 'Dados inválidos';
        toast.error('Erro ao cadastrar dispositivo: ' + errorMsg);
        setError(errorMsg);
      } else {
        toast.error('Erro ao cadastrar dispositivo. Tente novamente.');
      }
    } finally {
      setVerifyingMachine(false);
    }
  };

  const handleCancelRegister = () => {
    setShowMachineDialog(false);
    setSelectedCompany(null);
    setMachineId(null);
    setMachineVerificationData(null);
  };

  const proceedToLogin = async () => {
    console.log('proceedToLogin chamado, selectedCompany:', selectedCompany);
    if (!selectedCompany) return;

    try {
      // Verificar assinatura da empresa selecionada
      const subscriptionCheck = await api.get('/check-subscription/');
      
      if (subscriptionCheck.success && subscriptionCheck.data) {
        // Encontrar status da empresa selecionada
        const companyStatus = subscriptionCheck.data.companies?.find(
          (c: any) => c.company_id === selectedCompany
        );
        
        if (companyStatus) {
          // Se venceu, bloquear acesso
          if (companyStatus.is_expired) {
            toast.error(companyStatus.message || 'Assinatura vencida! Entre em contato com o suporte.', {
              autoClose: 10000,
              closeOnClick: true,
            });
            setError(companyStatus.message || 'Assinatura desta empresa está vencida.');
            setSelectedCompany(null);
            return;
          }
          
          // NÃO mostrar aviso aqui - será mostrado pelo Dashboard
          // Apenas limpar avisos anteriores para garantir que o Dashboard mostre
        }
      }
      
      // Limpar avisos de assinatura da sessão anterior
      const oldSessionKey = `subscription_warning_shown_`;
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(oldSessionKey)) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Salvar empresa selecionada
      localStorage.setItem('selectedCompany', selectedCompany.toString());
      
      // Buscar dados da empresa selecionada para salvar cores
      const company = companies.find(c => c.id === selectedCompany);
      if (company) {
        localStorage.setItem('companyData', JSON.stringify(company));
      }
      
      console.log('Redirecionando para dashboard...');
      // Redirecionar para dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      // Em caso de erro na verificação, permite acesso
      
      // Salvar empresa selecionada
      localStorage.setItem('selectedCompany', selectedCompany.toString());
      
      // Buscar dados da empresa selecionada para salvar cores
      const company = companies.find(c => c.id === selectedCompany);
      if (company) {
        localStorage.setItem('companyData', JSON.stringify(company));
      }
      
      console.log('Redirecionando para dashboard...');
      // Redirecionar para dashboard
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleGoBack = () => {
    navigate('/superuser-mode');
  };

  if (loading) {
    return (
      <div className="select-company-container">
        <div className="loading-box">
          <div className="spinner"></div>
          <p>Carregando empresas...</p>
        </div>
      </div>
    );
  }

  const userStr = localStorage.getItem('userData');
  const user: UserData | null = userStr ? JSON.parse(userStr) : null;

  return (
    <div className="select-company-container">
      <div className="select-company-box">
        <div className="select-company-header">
          <div className="welcome-message">
            <h1>Bem-vindo, {user?.full_name || user?.first_name || 'Usuário'}!</h1>
            <p>Escolha a empresa que deseja gerenciar hoje.</p>
          </div>
          <div className="header-actions">
            {user?.is_superuser && (
              <button onClick={handleGoBack} className="back-button-icon" title="Voltar">
                <FiArrowLeft />
                <span>Voltar</span>
              </button>
            )}
            <button onClick={handleLogout} className="logout-button-icon" title="Fazer Logout">
              <FiLogOut />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {companies.length === 0 && !error ? (
          <div className="no-companies">
            <p>Você não tem empresas para gerenciar.</p>
            <button onClick={handleLogout} className="logout-button">
              <FiLogOut /> Fazer Logout
            </button>
          </div>
        ) : (
          <>
            <div className="companies-grid">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className={`company-card ${selectedCompany === company.id ? 'selected' : ''}`}
                  onClick={() => handleSelectCompany(company.id)}
                  onDoubleClick={handleConfirm}
                >
                  {company.logo ? (
                    <div className="company-logo-container">
                      <img 
                        src={company.logo.startsWith('http') ? company.logo : `http://localhost:8000${company.logo}`} 
                        alt={company.name}
                        className="company-logo"
                        onError={(e) => {
                          // Se erro ao carregar, mostra ícone padrão
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<svg class="company-icon" style="width: 48px; height: 48px; color: var(--primary-color);"><use href="#briefcase-icon"></use></svg>';
                        }}
                      />
                    </div>
                  ) : (
                    <FiBriefcase className="company-icon" />
                  )}
                  <div className="company-info">
                    <h3>{formatCompanyName(company)}</h3>
                    <p className="company-legal-name">{company.legal_name}</p>
                    <p className="company-cnpj">CNPJ: {company.cnpj}</p>
                  </div>
                  {selectedCompany === company.id && (
                    <div className="selected-indicator">
                      <FiCheckCircle />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="actions">
              <button
                onClick={handleConfirm}
                disabled={!selectedCompany || verifyingMachine}
                className="confirm-button"
              >
                <span>{verifyingMachine ? 'Verificando dispositivo...' : 'Acessar Empresa'}</span>
                <FiArrowRight />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Dialog para cadastrar máquina */}
      {showMachineDialog && machineVerificationData && (
        <div className="modal-overlay">
          <div className="modal-content machine-dialog simple-modern">
            <div className="modal-icon-wrapper">
              {machineVerificationData.isFirstDevice ? <FiMonitor /> : <FiAlertCircle />}
            </div>

            <h2 className="modal-title">
              {machineVerificationData.isFirstDevice 
                ? 'Configurar Dispositivo' 
                : 'Novo Dispositivo Detectado'}
            </h2>
            
            <div className="modal-body">
              {machineVerificationData.isFirstDevice ? (
                <p className="modal-description">
                  Deseja vincular este computador como o dispositivo principal para esta empresa?
                </p>
              ) : (
                <>
                  <p className="modal-description">
                    Deseja cadastrar este computador como um novo dispositivo?
                  </p>
                  <div className="device-info-simple">
                    <span>
                      {machineVerificationData.availableSlots} de {machineVerificationData.maxMachines} licenças disponíveis
                    </span>
                  </div>
                </>
              )}
            </div>
            
            <div className="modal-actions">
              <button
                onClick={handleCancelRegister}
                className="button-secondary"
                disabled={verifyingMachine}
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterMachine}
                className="button-primary"
                disabled={verifyingMachine}
              >
                {verifyingMachine ? 'Cadastrando...' : 'Sim, cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectCompany;
