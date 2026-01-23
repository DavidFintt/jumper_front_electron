import React, { useEffect } from 'react';
import { useNavigate, NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { FiBriefcase, FiUsers, FiLogOut, FiArrowLeft, FiFileText } from 'react-icons/fi';
import { Companies } from '../companies';
import { AdminUsers } from '../adminUsers';
import { Fiscal } from '../fiscal';
import './AdminPanel.css';

const AdminPanel: React.FC = () => {
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleBackToChoice = () => {
    localStorage.removeItem('superuserMode');
    navigate('/superuser-mode');
  };

  if (!isSuperuser) {
    return null;
  }

  return (
    <div className="admin-panel-container">
      <aside className="admin-panel-sidebar">
        {/* Header */}
        <div className="admin-panel-header">
          <h1>Painel Admin</h1>
          <p>Sistema Jump</p>
        </div>

        {/* Navigation */}
        <nav className="admin-panel-nav">
          <ul>
            <li>
              <NavLink 
                to="/admin-panel/companies" 
                className={({ isActive }) => `admin-panel-link${isActive ? ' active' : ''}`}
              >
                <FiBriefcase size={20} />
                <span>Empresas</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/admin-panel/admin-users" 
                className={({ isActive }) => `admin-panel-link${isActive ? ' active' : ''}`}
              >
                <FiUsers size={20} />
                <span>Usuários Admin</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/admin-panel/fiscal" 
                className={({ isActive }) => `admin-panel-link${isActive ? ' active' : ''}`}
              >
                <FiFileText size={20} />
                <span>Fiscal</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="admin-panel-footer" style={{ backgroundColor: 'transparent' }}>
          <div className="user-info" style={{ backgroundColor: 'transparent' }}>
            <div className="user-avatar" style={{ color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              {user?.first_name ? user.first_name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="user-details">
              <span className="user-name" style={{ color: 'white', fontWeight: '600' }}>{user?.full_name || 'Super Admin'}</span>
              <span className="user-role" style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.75rem' }}>Super Administrador</span>
            </div>
          </div>
          <div className="admin-panel-actions">
            <button onClick={handleBackToChoice} className="admin-panel-action-btn" title="Voltar">
              <FiArrowLeft size={20} />
              <span style={{ color: 'white' }}>Voltar</span>
            </button>
            <button onClick={handleLogout} className="admin-panel-action-btn" title="Sair">
              <FiLogOut size={20} />
              <span style={{ color: 'white' }}>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-panel-main">
        <Routes>
          <Route path="/" element={<Navigate to="/admin-panel/companies" replace />} />
          <Route path="/companies" element={<Companies hideLayout />} />
          <Route path="/admin-users" element={<AdminUsers />} />
          <Route path="/fiscal" element={<Fiscal />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminPanel;

