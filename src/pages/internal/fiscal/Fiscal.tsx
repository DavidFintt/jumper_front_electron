import React, { useState, useEffect } from 'react';
import { Alert, DataTable, Button } from '../../../components/ui';
import type { Column } from '../../../components/ui';
import { fiscalService } from '../../../services/fiscalService';
import type { FiscalEstablishment } from '../../../services/fiscalService';
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './Fiscal.css';

const maskCNPJ = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return cleaned.replace(/(\d{2})(\d)/, '$1.$2');
  if (cleaned.length <= 8) return cleaned.replace(/(\d{2})(\d{3})(\d)/, '$1.$2.$3');
  if (cleaned.length <= 12) return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d)/, '$1.$2.$3/$4');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

const Fiscal: React.FC = () => {
  const navigate = useNavigate();
  const [establishments, setEstablishments] = useState<FiscalEstablishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userStr = localStorage.getItem('userData');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperuser = user?.is_superuser || false;

  useEffect(() => {
    if (!isSuperuser) {
      toast.error('Acesso negado. Apenas superusuários podem acessar esta página.');
      navigate('/customers');
      return;
    }
    
    loadEstablishments();
  }, [isSuperuser, navigate]);

  const loadEstablishments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fiscalService.listEstablishments();
        
      if (response.success) {
        setEstablishments(response.data || []);
      } else {
        setError(response.error || 'Erro ao carregar estabelecimentos fiscais');
      }
    } catch (err: any) {
      console.error('Error loading establishments:', err);
      setError('Erro ao carregar estabelecimentos fiscais');
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon: React.FC<{ value: boolean }> = ({ value }) => {
    if (value) {
      return <FiCheckCircle size={20} style={{ color: '#10b981' }} title="Configurado" />;
    }
    return <FiXCircle size={20} style={{ color: '#ef4444' }} title="Não configurado" />;
  };

  const getCompletionStatus = (establishment: FiscalEstablishment) => {
    const hasCertificate = establishment.has_active_certificate || false;
    const hasCscToken = !!establishment.nfce_csc_token;
    const hasCscId = !!establishment.nfce_csc_id;
    const hasCrt = !!establishment.crt;

    const completed = [hasCertificate, hasCscToken, hasCscId, hasCrt].filter(Boolean).length;
    const total = 4;
    const percentage = (completed / total) * 100;

    if (percentage === 100) {
      return { icon: <FiCheckCircle size={18} />, text: 'Completo', color: '#10b981' };
    } else if (percentage > 0) {
      return { icon: <FiAlertCircle size={18} />, text: `${completed}/${total} itens`, color: '#f59e0b' };
    }
    return { icon: <FiXCircle size={18} />, text: 'Pendente', color: '#ef4444' };
  };

  const columns: Column<FiscalEstablishment>[] = [
    {
      key: 'cnpj',
      label: 'CNPJ',
      sortable: true,
      render: (establishment) => maskCNPJ(establishment.cnpj),
    },
    {
      key: 'companies_count',
      label: 'Empresas',
      sortable: true,
      render: (establishment) => (
        <span style={{ 
          fontWeight: 600, 
          color: '#3b82f6',
          backgroundColor: '#e0f2fe',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '13px'
        }}>
          {establishment.companies_count || 0}
        </span>
      ),
    },
    {
      key: 'certificate',
      label: 'Certificado Digital',
      sortable: false,
      render: (establishment) => <StatusIcon value={establishment.has_active_certificate || false} />,
    },
    {
      key: 'csc',
      label: 'CSC NFC-e',
      sortable: false,
      render: (establishment) => (
        <StatusIcon value={!!(establishment.nfce_csc_token && establishment.nfce_csc_id)} />
      ),
    },
    {
      key: 'crt',
      label: 'CRT',
      sortable: false,
      render: (establishment) => <StatusIcon value={!!establishment.crt} />,
    },
    {
      key: 'status',
      label: 'Status Geral',
      sortable: false,
      render: (establishment) => {
        const status = getCompletionStatus(establishment);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: status.color, fontWeight: 600 }}>
            {status.icon}
            <span>{status.text}</span>
          </div>
        );
      },
    },
    {
      key: 'environment',
      label: 'Ambiente',
      sortable: true,
      render: (establishment) => {
        const isProd = establishment.environment === 'PROD';
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: isProd ? '#dcfce7' : '#fef3c7',
            color: isProd ? '#166534' : '#92400e'
          }}>
            {establishment.environment_display || (isProd ? 'Produção' : 'Homologação')}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="fiscal-container">
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="fiscal-container">
      <div className="fiscal-header">
        <div>
          <h1>Monitoramento Fiscal</h1>
          <p>Visualize o status de configuração dos estabelecimentos fiscais</p>
        </div>
        <Button 
          onClick={loadEstablishments}
          variant="secondary"
          disabled={loading}
        >
          <FiRefreshCw /> {loading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <div className="fiscal-info-card">
        <h3>Legenda e Informações</h3>
        <div className="legend-grid">
          <div className="legend-item">
            <FiCheckCircle size={20} style={{ color: '#10b981' }} />
            <span>Configurado</span>
          </div>
          <div className="legend-item">
            <FiXCircle size={20} style={{ color: '#ef4444' }} />
            <span>Não configurado</span>
          </div>
          <div className="legend-item">
            <FiAlertCircle size={20} style={{ color: '#f59e0b' }} />
            <span>Parcialmente configurado</span>
          </div>
        </div>
        <p style={{ marginTop: '12px', fontSize: '14px', color: '#64748b' }}>
          Os estabelecimentos fiscais são criados automaticamente quando uma empresa é cadastrada. 
          O administrador de cada empresa deve acessar o menu "Dados Fiscais" para configurar 
          o certificado digital, CSC, CRT e ambiente de emissão. Clique em "Atualizar" para ver as últimas mudanças.
        </p>
      </div>

      <div className="fiscal-content">
        <DataTable
          data={establishments}
          columns={columns}
          emptyMessage="Nenhum estabelecimento fiscal encontrado"
        />
      </div>
    </div>
  );
};

export { Fiscal };
export default Fiscal;
