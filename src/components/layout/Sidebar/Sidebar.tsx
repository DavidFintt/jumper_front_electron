import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiUsers, FiPackage, FiSettings, FiLogOut, FiRepeat, FiBarChart2, FiBriefcase, FiFileText, FiLink } from 'react-icons/fi';
import { companyService } from '../../../services';
import { formatCompanyName } from '../../../utils/companyUtils';
import './Sidebar.css';

interface UserData {
  is_admin: boolean;
  is_superuser: boolean;
  name: string;
  company?: number | null;
}

interface CompanyData {
  id: number;
  name: string;
  legal_name: string;
  cnpj: string;
  logo?: string;
  unit_name?: string;
}

interface MenuItem {
  path: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  adminOnly: boolean;
  superuserOnly?: boolean;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  const userStr = localStorage.getItem('userData');
  const companyStr = localStorage.getItem('companyData');
  const selectedCompanyStr = localStorage.getItem('selectedCompany');
  
  const user: UserData | null = userStr ? JSON.parse(userStr) : null;
  const selectedCompanyId = selectedCompanyStr ? parseInt(selectedCompanyStr) : null;

  const isAdmin = user?.is_admin || user?.is_superuser || false;
  const isSuperuser = user?.is_superuser || false;

  // Carregar dados da empresa se não estiverem no localStorage
  useEffect(() => {
    const loadCompanyData = async () => {
      // Se já tem companyData no localStorage, usar ele
      const currentCompanyStr = localStorage.getItem('companyData');
      if (currentCompanyStr) {
        try {
          const parsed = JSON.parse(currentCompanyStr);
          setCompanyData(parsed);
          return;
        } catch (e) {
          console.error('Erro ao parsear companyData:', e);
        }
      }

      // Se não tem companyData, tentar carregar
      let companyIdToLoad: number | null = null;

      // Buscar user atualizado do localStorage
      const currentUserStr = localStorage.getItem('userData');
      const currentUser: UserData | null = currentUserStr ? JSON.parse(currentUserStr) : null;

      const currentSelectedCompany = localStorage.getItem('selectedCompany');
      if (currentSelectedCompany) {
        // Se tem selectedCompany, usar ele (prioridade para admins)
        companyIdToLoad = parseInt(currentSelectedCompany);
      } else if (currentUser && currentUser.company) {
        // Se é usuário comum, usar o company do user (vem do login)
        companyIdToLoad = currentUser.company;
      }

      if (companyIdToLoad) {
        try {
          // Para usuários comuns, não precisa passar companyId como parâmetro
          const response = await companyService.getById(companyIdToLoad);
          if (response.success && response.data) {
            const company: CompanyData = {
              id: response.data.id,
              name: response.data.name,
              legal_name: response.data.legal_name,
              cnpj: response.data.cnpj,
              logo: response.data.logo, // Logo da Company
            };
            setCompanyData(company);
            localStorage.setItem('companyData', JSON.stringify(company));
          }
        } catch (error) {
          console.error('Erro ao carregar dados da empresa:', error);
        }
      }
    };

    loadCompanyData();
  }, [userStr, selectedCompanyStr, companyStr]);

  const menuItems: MenuItem[] = [
    { path: '/dashboard', name: 'Dashboard', icon: FiGrid, adminOnly: false },
    { path: '/customers', name: 'Clientes', icon: FiUsers, adminOnly: false },
    { path: '/companies', name: 'Empresas', icon: FiBriefcase, adminOnly: false, superuserOnly: true },
    { path: '/users-management', name: 'Gerenciar Usuários', icon: FiUsers, adminOnly: true },
    { path: '/products', name: 'Produtos', icon: FiPackage, adminOnly: true },
    { path: '/reports', name: 'Relatórios', icon: FiBarChart2, adminOnly: true },
    { path: '/fiscal-certificate', name: 'Fiscal / NFC-e', icon: FiFileText, adminOnly: true },
    { path: '/config', name: 'Configurações', icon: FiSettings, adminOnly: true },
    { path: '/activate-pdv', name: 'Ativar PDV', icon: FiLink, adminOnly: true },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleChangeCompany = () => {
    localStorage.removeItem('selectedCompany');
    localStorage.removeItem('companyData');
    navigate('/select-company');
  };

  // Constrói a URL completa do logo
  let logoUrl = '/default-logo.png';
  
  if (companyData?.logo) {
    logoUrl = companyData.logo.startsWith('http') 
      ? companyData.logo 
      : `http://localhost:8000${companyData.logo}`;
  }

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        {companyData?.logo && (
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="sidebar-logo"
          />
        )}
        <h1 className="sidebar-company-name">{formatCompanyName(companyData) || 'Empresa'}</h1>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => {
            if (item.superuserOnly && !isSuperuser) return null;
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  <Icon className="sidebar-icon" size={20} />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name || 'Usuário'}</span>
            <span className="user-role">{isAdmin ? 'Administrador' : 'Operador'}</span>
          </div>
        </div>
        <div className="sidebar-actions">
          <button onClick={handleLogout} className="sidebar-action-btn logout" title="Sair">
            <FiLogOut size={20} />
            <span>Sair</span>
          </button>
          {isAdmin && (
            <button onClick={handleChangeCompany} className="sidebar-action-btn" title="Trocar Empresa">
              <FiRepeat size={20} />
              <span>Trocar</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
