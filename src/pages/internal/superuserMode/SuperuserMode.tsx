import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../../../components/ui';
import { FiBriefcase, FiSettings } from 'react-icons/fi';
import './SuperuserMode.css';

const SuperuserMode: React.FC = () => {
  const navigate = useNavigate();

  // Get user data
  const userStr = localStorage.getItem('userData');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperuser = user?.is_superuser || false;

  useEffect(() => {
    // Redirect if not superuser
    if (!isSuperuser) {
      navigate('/dashboard');
    }
  }, [isSuperuser, navigate]);

  const handleManageCompany = () => {
    // Limpar empresa selecionada anteriormente para forçar nova seleção
    localStorage.removeItem('selectedCompany');
    localStorage.removeItem('companyData');
    // Vai para tela de seleção de empresa
    navigate('/select-company');
  };

  const handleAdminPanel = () => {
    // Define modo admin no localStorage
    localStorage.setItem('superuserMode', 'admin-panel');
    // Vai para painel administrativo
    navigate('/admin-panel');
  };

  if (!isSuperuser) {
    return null;
  }

  return (
    <div className="superuser-mode-container">
      <div className="superuser-mode-content">
        <div className="superuser-mode-header">
          <h1>Bem-vindo, Super Administrador</h1>
          <p>Escolha como deseja acessar o sistema:</p>
        </div>

        <div className="mode-options">
          <Card variant="elevated" padding="large" className="mode-card">
            <div className="mode-icon">
              <FiBriefcase size={48} />
            </div>
            <h2>Gerenciar Empresa</h2>
            <p>Escolha uma empresa para gerenciar operações, clientes, produtos e relatórios.</p>
            <Button
              variant="primary"
              size="large"
              fullWidth
              onClick={handleManageCompany}
            >
              Gerenciar Empresa
            </Button>
          </Card>

          <Card variant="elevated" padding="large" className="mode-card">
            <div className="mode-icon">
              <FiSettings size={48} />
            </div>
            <h2>Painel do Administrador</h2>
            <p>Acesse o painel para cadastrar empresas e gerenciar usuários administradores do sistema.</p>
            <Button
              variant="primary"
              size="large"
              fullWidth
              onClick={handleAdminPanel}
            >
              Painel do Administrador
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperuserMode;














