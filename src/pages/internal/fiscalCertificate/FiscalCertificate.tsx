import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/layout';
import { Button, Alert, Input } from '../../../components/ui';
import { fiscalService } from '../../../services';
import { api } from '../../../services/api';
import { toast } from 'react-toastify';
import { FiFileText, FiKey, FiShield, FiAlertTriangle } from 'react-icons/fi';
import './FiscalCertificate.css';

interface FiscalEstablishment {
  id: number;
  cnpj: string;
  nfce_csc_id?: string;
  nfce_csc_token?: string;
  crt?: string;
  crt_display?: string;
  environment?: string;
  environment_display?: string;
  has_active_certificate?: boolean;
}

interface CertificateStatus {
  installed: boolean;
  valid?: boolean;
  expired?: boolean;
  valid_from?: string;
  valid_to?: string;
  days_remaining?: number;
  common_name?: string;
  subject?: string;
  issuer?: string;
  path?: string;
  reason?: string;
}

interface Company {
  id: number;
  cnpj: string;
  name: string;
  legal_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  is_matriz: boolean;
  matriz: number | null;
}

export const FiscalCertificate: React.FC = () => {
  const [establishment, setEstablishment] = useState<FiscalEstablishment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [certStatus, setCertStatus] = useState<CertificateStatus | null>(null);

  const [cscToken, setCscToken] = useState('');
  const [cscId, setCscId] = useState('');
  const [crt, setCrt] = useState('');
  const [environment, setEnvironment] = useState('HOMOLOG');

  const [matrizData, setMatrizData] = useState<Company | null>(null);
  const [isUnidade, setIsUnidade] = useState(false);

  const companyStr = localStorage.getItem('companyData');
  const company: Company | null = companyStr ? JSON.parse(companyStr) : null;

  useEffect(() => {
    loadEstablishment();
    loadCertificateStatus();
  }, []);

  const loadCertificateStatus = async () => {
    try {
      const response = await api.get('/fiscal/certificate-status/');
      if (response.success) {
        setCertStatus(response.data);
      }
    } catch {
      setCertStatus(null);
    }
  };

  const loadEstablishment = async () => {
    if (!company) {
      toast.error('Empresa não identificada');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Verificar se é unidade e buscar dados da matriz
      if (!company.is_matriz && company.matriz) {
        setIsUnidade(true);
        
        // Buscar dados da matriz
        const { api } = await import('../../../services/api');
        const matrizResponse = await api.get(`/companies/${company.matriz}/`);
        
        if (matrizResponse.success && matrizResponse.data) {
          setMatrizData(matrizResponse.data);
        }
      } else {
        setIsUnidade(false);
        setMatrizData(null);
      }
      
      const response = await fiscalService.listEstablishments();

      if (response.success && response.data) {
        const companyCnpjClean = company.cnpj.replace(/[.\-/]/g, '');

        const companyEstablishment = response.data.find(
          (est: FiscalEstablishment) => {
            const estCnpjClean = est.cnpj.replace(/[.\-/]/g, '');
            return estCnpjClean === companyCnpjClean;
          }
        );

        if (companyEstablishment) {
          setEstablishment(companyEstablishment);
          setCscToken(companyEstablishment.nfce_csc_token || '');
          setCscId(companyEstablishment.nfce_csc_id || '');
          setCrt(companyEstablishment.crt || '');
          setEnvironment(companyEstablishment.environment || 'HOMOLOG');
        } else {
          toast.warning('Estabelecimento fiscal não encontrado. Entre em contato com o suporte.');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estabelecimento:', error);
      toast.error('Erro ao carregar dados fiscais');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!establishment) {
      toast.error('Estabelecimento fiscal não encontrado');
      return;
    }

    try {
      setSaving(true);

      const data: any = {};
      if (cscToken) data.nfce_csc_token = cscToken;
      if (cscId) data.nfce_csc_id = cscId;
      if (crt) data.crt = crt;
      if (environment) data.environment = environment;

      const response = await fiscalService.updateEstablishment(establishment.id, data);

      if (response.success) {
        toast.success('Configurações fiscais salvas com sucesso!');
        loadEstablishment();
      } else {
        toast.error(response.error || 'Erro ao atualizar dados fiscais');
      }
    } catch (error) {
      toast.error('Erro ao salvar dados fiscais');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="fiscal-certificate-container">
          <div className="loading">Carregando...</div>
        </div>
      </Layout>
    );
  }

  if (!establishment) {
    return (
      <Layout>
        <div className="fiscal-certificate-container">
          <Alert variant="warning">
            <strong>Estabelecimento Fiscal não encontrado</strong>
            <p>O estabelecimento fiscal para sua empresa ainda não foi cadastrado. Entre em contato com o suporte para configurar.</p>
          </Alert>
        </div>
      </Layout>
    );
  }

  // Determinar qual empresa exibir (matriz se for unidade, ou a própria se for matriz)
  const displayCompany = isUnidade && matrizData ? matrizData : company;

  return (
    <Layout>
      <div className="fiscal-certificate-container">
        <div className="fiscal-certificate-header">
          <h1><FiFileText /> Dados Fiscais</h1>
          <p>Configure os dados fiscais para emissão de NFC-e</p>
        </div>

        {isUnidade && matrizData && (
          <Alert variant="info" style={{ marginBottom: '20px' }}>
            <strong>Você está logado em uma unidade/filial</strong>
            <p>Os dados fiscais abaixo são da <strong>Matriz: {matrizData.name}</strong>. Todas as notas fiscais desta unidade serão emitidas com os dados da matriz.</p>
          </Alert>
        )}

        <div className="establishment-info">
          <h3>
            <FiFileText /> 
            Informações da Empresa {isUnidade ? '(Matriz)' : ''}
            {isUnidade && <span className="matriz-badge">Matriz</span>}
          </h3>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">CNPJ</span>
              <span className="info-value">{displayCompany?.cnpj}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Razão Social</span>
              <span className="info-value">{displayCompany?.legal_name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Nome Fantasia</span>
              <span className="info-value">{displayCompany?.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Endereço</span>
              <span className="info-value">{displayCompany?.address}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Cidade</span>
              <span className="info-value">{displayCompany?.city}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Estado (UF)</span>
              <span className="info-value">{displayCompany?.state}</span>
            </div>
            <div className="info-row">
              <span className="info-label">CEP</span>
              <span className="info-value">{displayCompany?.zip_code}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Telefone</span>
              <span className="info-value">{displayCompany?.phone}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{displayCompany?.email}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="fiscal-certificate-form">
          <div className="form-section">
            <h3><FiKey /> Certificado Digital (PFX/A1)</h3>
            <p className="form-section-description">
              O certificado digital deve ser instalado diretamente no servidor local. Configure o caminho no arquivo .env do backend.
            </p>

            {certStatus?.installed ? (
              <div style={{
                padding: '16px 20px',
                borderRadius: '8px',
                backgroundColor: certStatus.expired ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${certStatus.expired ? '#fecaca' : '#bbf7d0'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {certStatus.expired ? (
                    <FiAlertTriangle size={20} style={{ color: '#dc2626' }} />
                  ) : (
                    <FiShield size={20} style={{ color: '#16a34a' }} />
                  )}
                  <strong style={{ color: certStatus.expired ? '#dc2626' : '#16a34a', fontSize: '15px' }}>
                    {certStatus.expired ? 'Certificado expirado' : 'Certificado instalado e válido'}
                  </strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px', color: '#475569' }}>
                  {certStatus.common_name && (
                    <div><strong>Titular:</strong> {certStatus.common_name}</div>
                  )}
                  {certStatus.valid_from && (
                    <div><strong>Válido de:</strong> {new Date(certStatus.valid_from).toLocaleDateString('pt-BR')}</div>
                  )}
                  {certStatus.valid_to && (
                    <div><strong>Válido até:</strong> {new Date(certStatus.valid_to).toLocaleDateString('pt-BR')}</div>
                  )}
                  {certStatus.days_remaining !== undefined && !certStatus.expired && (
                    <div>
                      <strong>Dias restantes:</strong>{' '}
                      <span style={{ color: certStatus.days_remaining < 30 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                        {certStatus.days_remaining}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                padding: '16px 20px',
                borderRadius: '8px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiAlertTriangle size={20} style={{ color: '#d97706' }} />
                  <strong style={{ color: '#92400e', fontSize: '15px' }}>Certificado não instalado</strong>
                </div>
                <p style={{ color: '#92400e', fontSize: '14px', margin: 0 }}>
                  {certStatus?.reason || 'Configure CERT_PFX_PATH e CERT_PFX_PASSWORD no arquivo .env do backend local e reinicie o servidor.'}
                </p>
              </div>
            )}
          </div>

          {/* Seção de Configurações Fiscais */}
          <div className="form-section">
            <h3><FiFileText /> Configurações do Regime</h3>
            <p className="form-section-description">
              Defina o regime tributário da sua empresa e o ambiente de emissão (Homologação para testes, Produção para valer).
            </p>
            
            <div className="form-row">
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Regime Tributário (CRT)
                  <i 
                    className="info-circle"
                    title="Código de Regime Tributário: identifica o regime de tributação da empresa. Opção 1 para empresas do Simples Nacional, 2 para Simples com receita bruta acima do sublimite, e 3 para Lucro Presumido ou Lucro Real."
                    style={{ 
                      cursor: 'help',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  >i</i>
                </label>
                <select
                  value={crt}
                  onChange={(e) => setCrt(e.target.value)}
                  className="select-input"
                >
                  <option value="">Selecione o regime...</option>
                  <option value="1">1 - Simples Nacional</option>
                  <option value="2">2 - Simples Nacional - excesso</option>
                  <option value="3">3 - Regime Normal</option>
                </select>
              </div>
              
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Ambiente de Emissão
                  <i 
                    className="info-circle"
                    title="Homologação é usado para testes (notas sem validade fiscal). Produção é o ambiente oficial onde as notas têm validade jurídica. Sempre teste no ambiente de Homologação antes de ir para Produção."
                    style={{ 
                      cursor: 'help',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  >i</i>
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="select-input"
                >
                  <option value="HOMOLOG">Homologação (Testes)</option>
                  <option value="PROD">Produção (Validade Jurídica)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção de CSC */}
          <div className="form-section">
            <h3><FiKey /> CSC (Cód. Segurança do Contribuinte)</h3>
            <p className="form-section-description">
              O CSC e o ID do Token são necessários para gerar o QR Code da sua NFC-e. Obtenha-os no portal da SEFAZ.
            </p>
            
            <div className="form-row">
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ID do CSC
                  <i 
                    className="info-circle"
                    title="Identificador do Código de Segurança do Contribuinte (geralmente um número sequencial como 000001). É gerado no portal da SEFAZ do seu estado e usado para criar o QR Code da NFC-e."
                    style={{ 
                      cursor: 'help',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  >i</i>
                </label>
                <Input
                  type="text"
                  value={cscId}
                  onChange={(e) => setCscId(e.target.value)}
                  placeholder="Ex: 000001"
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Token do CSC
                  <i 
                    className="info-circle"
                    title="Código de Segurança do Contribuinte (uma string alfanumérica longa). Fornecido pela SEFAZ e usado junto com o ID para gerar a assinatura do QR Code da NFC-e. Mantenha este código em sigilo."
                    style={{ 
                      cursor: 'help',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  >i</i>
                </label>
                <Input
                  type="password"
                  value={cscToken}
                  onChange={(e) => setCscToken(e.target.value)}
                  placeholder="Ex: ABC123..."
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Button type="submit" variant="primary" disabled={saving} style={{ padding: '12px 32px', fontSize: '16px' }}>
              {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default FiscalCertificate;
