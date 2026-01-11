import { ReactNode } from 'react';
import Sidebar from '../Sidebar';
import { useCompanyConfig } from '../../../hooks/useCompanyConfig';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  // Carrega e aplica as cores da empresa
  useCompanyConfig();

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
