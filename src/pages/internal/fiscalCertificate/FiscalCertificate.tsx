import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/layout';
import { Button, Alert, Input } from '../../../components/ui';
import { fiscalService } from '../../../services';
import { toast } from 'react-toastify';
import { FiFileText, FiKey } from 'react-icons/fi';
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
  
  const [cscToken, setCscToken] = useState('');
  const [cscId, setCscId] = useState('');
  const [crt, setCrt] = useState('');
  const [environment, setEnvironment] = useState('HOMOLOG');
  
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [certificateFileError, setCertificateFileError] = useState<string | null>(null);
  
  const [matrizData, setMatrizData] = useState<Company | null>(null);
  const [isUnidade, setIsUnidade] = useState(false);

  const companyStr = localStorage.getItem('companyData');
  const company: Company | null = companyStr ? JSON.parse(companyStr) : null;

  useEffect(() => {
    loadEstablishment();
  }, []);

  const handleCertificateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCertificateFileError(null);
    
    if (!file) {
      setCertificateFile(null);
      return;
    }
    
    // Validar extensão do arquivo
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.pfx', '.p12'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      setCertificateFileError(
        'Formato de arquivo inválido. Por favor, selecione um certificado digital no formato .pfx ou .p12'
      );
      setCertificateFile(null);
      e.target.value = ''; // Limpa o input
      toast.error('Formato de arquivo inválido. Selecione um arquivo .pfx ou .p12');
      return;
    }
    
    // Validar tamanho (certificados geralmente têm entre 1KB e 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const minSize = 100; // 100 bytes
    
    if (file.size > maxSize) {
      setCertificateFileError('O arquivo é muito grande. Certificados digitais geralmente têm menos de 10MB.');
      setCertificateFile(null);
      e.target.value = '';
      toast.error('Arquivo muito grande');
      return;
    }
    
    if (file.size < minSize) {
      setCertificateFileError('O arquivo é muito pequeno para ser um certificado válido.');
      setCertificateFile(null);
      e.target.value = '';
      toast.error('Arquivo muito pequeno');
      return;
    }
    
    setCertificateFile(file);
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
        // Limpar CNPJ da empresa para comparação (remove formatação)
        const companyCnpjClean = company.cnpj.replace(/[.\-/]/g, '');
        
        const companyEstablishment = response.data.find(
          (est: FiscalEstablishment) => {
            // Limpar CNPJ do establishment também para garantir
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

  const uploadCertificate = async (): Promise<boolean> => {
    if (!certificateFile || !certificatePassword) {
      return true; // Não há certificado para enviar, continuar
    }

    if (!establishment) {
      toast.error('Estabelecimento fiscal não encontrado');
      return false;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const base64Data = base64.split(',')[1];

          const response = await fiscalService.uploadCertificate({
            establishment: establishment.id,
            pfx_base64: base64Data,
            pfx_password: certificatePassword,
          });

          if (response.success) {
            setCertificateFile(null);
            setCertificatePassword('');
            resolve(true);
          } else {
            // Tentar extrair mensagem mais específica dos detalhes
            let errorMessage = 'Erro ao enviar certificado';
            
            if (response.details) {
              if (response.details.pfx_base64) {
                errorMessage = Array.isArray(response.details.pfx_base64) 
                  ? response.details.pfx_base64[0] 
                  : response.details.pfx_base64;
              } else if (response.details.pfx_password) {
                errorMessage = Array.isArray(response.details.pfx_password) 
                  ? response.details.pfx_password[0] 
                  : response.details.pfx_password;
              }
            } else if (response.error) {
              errorMessage = response.error;
            }
            
            toast.error(errorMessage);
            resolve(false);
          }
        } catch (error) {
          console.error('Erro ao enviar certificado:', error);
          toast.error('Erro ao enviar certificado');
          resolve(false);
        }
      };

      reader.onerror = () => {
        toast.error('Erro ao ler o arquivo');
        resolve(false);
      };

      reader.readAsDataURL(certificateFile);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!establishment) {
      toast.error('Estabelecimento fiscal não encontrado');
      return;
    }

    try {
      setSaving(true);
      
      // 1. Primeiro fazer upload do certificado se houver
      if (certificateFile || certificatePassword) {
        if (!certificateFile || !certificatePassword) {
          toast.error('Para enviar o certificado, é necessário selecionar o arquivo e informar a senha');
          setSaving(false);
          return;
        }
        
        const certUploaded = await uploadCertificate();
        if (!certUploaded) {
          setSaving(false);
          return;
        }
      }
      
      // 2. Atualizar dados fiscais (CSC, CRT, ambiente)
      const data: any = {};
      
      if (cscToken) {
        data.nfce_csc_token = cscToken;
      }
      
      if (cscId) {
        data.nfce_csc_id = cscId;
      }

      if (crt) {
        data.crt = crt;
      }

      if (environment) {
        data.environment = environment;
      }

      const response = await fiscalService.updateEstablishment(establishment.id, data);
      
      if (response.success) {
        toast.success('Configurações fiscais salvas com sucesso!');
        loadEstablishment();
      } else {
        toast.error(response.error || 'Erro ao atualizar dados fiscais');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
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
          {/* Seção de Certificado Digital */}
          <div className="form-section">
            <h3><FiKey /> Certificado Digital (PFX/A1)</h3>
            <p className="form-section-description">
              O certificado digital é essencial para assinar digitalmente suas notas fiscais com validade jurídica.
            </p>
            
            {establishment?.has_active_certificate && (
              <div className="certificate-alert">
                <span>Certificado ativo e válido configurado no sistema.</span>
              </div>
            )}
            
            <div className="form-row">
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Arquivo do Certificado (.pfx)
                  <i 
                    className="info-circle"
                    title="Certificado digital A1 no formato PFX ou P12, emitido por uma Autoridade Certificadora credenciada (ex: Serasa, Certisign). É obrigatório para assinar digitalmente suas notas fiscais."
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
                <input
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleCertificateFileChange}
                  className="select-input"
                />
                {certificateFileError && (
                  <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                    {certificateFileError}
                  </small>
                )}
                {certificateFile && !certificateFileError && (
                  <small style={{ color: '#10b981', marginTop: '4px', display: 'block' }}>
                    Arquivo selecionado: {certificateFile.name}
                  </small>
                )}
              </div>
              
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Senha do Certificado
                  <i 
                    className="info-circle"
                    title="Senha definida no momento da compra/emissão do certificado digital. É necessária para descriptografar e utilizar o certificado."
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
                  value={certificatePassword}
                  onChange={(e) => setCertificatePassword(e.target.value)}
                  placeholder="Senha do arquivo"
                />
              </div>
            </div>
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
