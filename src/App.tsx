import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Login, TVMode } from './pages/external';
import { SelectCompany, Dashboard, Config, Customers, Products, FinancialReports, UsersManagement, SuperuserMode, AdminPanel, FiscalCertificate, ActivatePdv } from './pages/internal';
import { ActivationScreen } from './pages/activation';
import { ToastContainer } from 'react-toastify';
import { activationService } from './services';
import 'react-toastify/dist/ReactToastify.css';
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const accessToken = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('userData');
  
  if (!accessToken) {
    return <Navigate to="/" replace />;
  }
  
  if (userStr) {
    const user = JSON.parse(userStr);
    // Permite acesso para admins OU superusers
    if (!user.is_admin && !user.is_superuser) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return <>{children}</>;
}

function App() {
  const [isBootstrapped, setIsBootstrapped] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkBootstrap();
  }, []);

  const checkBootstrap = async () => {
    try {
      const bootstrapped = await activationService.isBootstrapped();
      setIsBootstrapped(bootstrapped);
    } catch (error) {
      console.error('Erro ao verificar bootstrap:', error);
      setIsBootstrapped(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivationSuccess = () => {
    setIsBootstrapped(true);
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isBootstrapped) {
    return <ActivationScreen onActivationSuccess={handleActivationSuccess} />;
  }

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 99999 }}
      />
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/tv" element={<TVMode />} />

        {/* Rotas Protegidas */}
        <Route 
          path="/superuser-mode" 
          element={
            <ProtectedRoute>
              <SuperuserMode />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin-panel/*" 
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/select-company" 
          element={
            <AdminRoute>
              <SelectCompany />
            </AdminRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/config" 
          element={
            <AdminRoute>
              <Config />
            </AdminRoute>
          } 
        />
        <Route 
          path="/customers" 
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users-management" 
          element={
            <AdminRoute>
              <UsersManagement />
            </AdminRoute>
          } 
        />
        <Route 
          path="/products" 
          element={
            <AdminRoute>
              <Products />
            </AdminRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <AdminRoute>
              <FinancialReports />
            </AdminRoute>
          } 
        />
        <Route 
          path="/fiscal-certificate" 
          element={
            <AdminRoute>
              <FiscalCertificate />
            </AdminRoute>
          } 
        />
        <Route 
          path="/activate-pdv" 
          element={
            <AdminRoute>
              <ActivatePdv />
            </AdminRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
