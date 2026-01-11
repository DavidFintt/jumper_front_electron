import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../components/layout';
import { Card, Input, Button, Alert } from '../../../components/ui';
import { companyConfigService, companyPrinterService } from '../../../services';
import { api } from '../../../services/api';
import type { CompanyConfig } from '../../../services';
import type { CompanyPrinter } from '../../../services/companyPrinterService';
import './Config.css';

function Config() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [printerConfig, setPrinterConfig] = useState<CompanyPrinter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [primaryColor, setPrimaryColor] = useState('#001166');
  const [secondaryColor, setSecondaryColor] = useState('#FFFFFF');
  const [backgroundColor, setBackgroundColor] = useState('#F8F9FA');
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [additionalMinutePrice, setAdditionalMinutePrice] = useState('');
  const [sendNotifications, setSendNotifications] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [fiscalPrinter, setFiscalPrinter] = useState('');
  const [a4Printer, setA4Printer] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const userStr = localStorage.getItem('userData');
      const selectedCompanyId = localStorage.getItem('selectedCompany');

      if (!userStr) {
        navigate('/');
        return;
      }

      const user = JSON.parse(userStr);

      // Apenas admins e superusers podem acessar
      if (!user.is_admin && !user.is_superuser) {
        navigate('/dashboard');
        return;
      }

      // Determinar company_id
      let companyId: number | null = null;
      if (user.is_admin || user.is_superuser) {
        companyId = selectedCompanyId ? parseInt(selectedCompanyId) : null;
      } else {
        companyId = user.company;
      }

      if (!companyId) {
        setError('Nenhuma empresa selecionada');
        setLoading(false);
        return;
      }

      // Buscar configuração
      const response = await companyConfigService.getByCompanyId(companyId);

      if (response.success && response.data) {
        setConfig(response.data);
        // Preencher formulário
        setPrimaryColor(response.data.primary_color);
        setSecondaryColor(response.data.secondary_color);
        setBackgroundColor(response.data.background_color);
        setBusinessName(response.data.business_name || '');
        setBusinessDescription(response.data.business_description || '');
        setWhatsappNumber(response.data.whatsapp_number || '');
        setInstagramHandle(response.data.instagram_handle || '');
        setAdditionalMinutePrice(response.data.additional_minute_price);
        setSendNotifications(response.data.send_notifications);
        setNotificationEmail(response.data.notification_email || '');
      } else {
        // Configuração não existe, usar valores padrão
        console.log('Configuração não existe, criando com valores padrão');
        setAdditionalMinutePrice('5.00');
        // Não exibir erro, apenas usar valores padrão
      }

      // Buscar configuração de impressoras
      try {
        const printerResponse = await companyPrinterService.getByCompanyId(companyId);
        if (printerResponse.success && printerResponse.data) {
          setPrinterConfig(printerResponse.data);
          setFiscalPrinter(printerResponse.data.fiscal_printer || '');
          setA4Printer(printerResponse.data.a4_printer || '');
        }
      } catch (err) {
        console.log('Configuração de impressoras não existe ainda');
      }
    } catch (err: any) {
      console.error('Error loading config:', err);
      
      // Se o erro for "configuração não encontrada", não exibir erro
      // Apenas usar valores padrão
      if (err?.response?.data?.error?.includes('No CompanyConfig matches')) {
        console.log('Configuração não existe ainda, usando valores padrão');
        setAdditionalMinutePrice('5.00');
      } else {
        setError('Erro ao carregar configurações');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const selectedCompanyId = localStorage.getItem('selectedCompany');
      const companyId = selectedCompanyId ? parseInt(selectedCompanyId) : null;

      if (!companyId) {
        setError('Nenhuma empresa selecionada');
        setSaving(false);
        return;
      }

      const data = {
        company: companyId,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        background_color: backgroundColor,
        business_name: businessName || null,
        business_description: businessDescription || null,
        whatsapp_number: whatsappNumber || null,
        instagram_handle: instagramHandle || null,
        additional_minute_price: additionalMinutePrice,
        send_notifications: sendNotifications,
        notification_email: notificationEmail || null,
      };

      let response;

      // Se config existe, atualiza. Senão, cria
      if (config) {
        response = await companyConfigService.update(companyId, data);
      } else {
        response = await companyConfigService.create(data, companyId);
      }

      if (response.success) {
        // Atualizar estado local
        if (response.data) {
          setConfig(response.data);
        }
        
        // Atualizar cores no CSS
        document.documentElement.style.setProperty('--primary-color', primaryColor);
        document.documentElement.style.setProperty('--secondary-color', secondaryColor);
        
        // Recalcular variáveis derivadas da cor primária
        const primaryRgb = hexToRgb(primaryColor);
        if (primaryRgb) {
          const lightColor = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`;
          document.documentElement.style.setProperty('--primary-color-light', lightColor);
          
          const darkColor = darkenColor(primaryColor, 20);
          document.documentElement.style.setProperty('--primary-color-dark', darkColor);
        }
        
        // Atualizar cache
        if (response.data) {
          localStorage.setItem('companyConfig', JSON.stringify(response.data));
        }

        // Salvar configurações de impressoras
        try {
          const printerData = {
            fiscal_printer: fiscalPrinter || null,
            a4_printer: a4Printer || null,
          };
          
          const printerResponse = await companyPrinterService.update(companyId, printerData);
          
          if (printerResponse.success && printerResponse.data) {
            setPrinterConfig(printerResponse.data);
          }
        } catch (err) {
          console.error('Erro ao salvar configurações de impressoras:', err);
        }

        // Salvar logo da empresa (se foi enviado)
        if (logo) {
          try {
            const formData = new FormData();
            formData.append('logo', logo);
            
            const logoResponse = await api.patch(`/companies/${companyId}/`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            
            if (logoResponse.success && logoResponse.data) {
              console.log('Logo salvo com sucesso!', logoResponse.data);
              
              // Atualizar o logo no companyData do localStorage
              const currentCompanyDataStr = localStorage.getItem('companyData');
              if (currentCompanyDataStr) {
                const currentCompanyData = JSON.parse(currentCompanyDataStr);
                const updatedCompanyData = {
                  ...currentCompanyData,
                  logo: logoResponse.data.logo,
                };
                localStorage.setItem('companyData', JSON.stringify(updatedCompanyData));
                console.log('CompanyData atualizado no localStorage:', updatedCompanyData);
              }
              
              // Recarregar a página para atualizar a Sidebar
              setSuccess('Configurações salvas com sucesso! Recarregando...');
              setTimeout(() => {
                window.location.reload();
              }, 1000);
              return;
            }
          } catch (err) {
            console.error('Erro ao fazer upload do logo:', err);
            setError('Configurações salvas, mas houve erro ao salvar o logo.');
          }
        }

        setSuccess('Configurações salvas com sucesso!');
        
        // Scroll to top para ver mensagem de sucesso
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(response.error || 'Erro ao salvar configurações');
      }
    } catch (err) {
      console.error('Error saving config:', err);
      setError('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const lightenColor = (hex: string, percent: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    
    const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * (percent / 100)));
    const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * (percent / 100)));
    const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * (percent / 100)));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const darkenColor = (hex: string, percent: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    
    const r = Math.floor(rgb.r * (1 - percent / 100));
    const g = Math.floor(rgb.g * (1 - percent / 100));
    const b = Math.floor(rgb.b * (1 - percent / 100));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const handleColorPreview = (color: string, type: 'primary' | 'secondary' | 'background') => {
    // Preview temporário da cor
    if (type === 'primary') {
      document.documentElement.style.setProperty('--primary-color', color);
      
      // Recalcular variáveis derivadas para o degradê
      const primaryRgb = hexToRgb(color);
      if (primaryRgb) {
        // Cor clara (10% de opacidade)
        const lightColor = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`;
        document.documentElement.style.setProperty('--primary-color-light', lightColor);
        
        // Cor escura (20% mais escura)
        const darkColor = darkenColor(color, 20);
        document.documentElement.style.setProperty('--primary-color-dark', darkColor);
      }
    } else if (type === 'secondary') {
      document.documentElement.style.setProperty('--secondary-color', color);
    } else if (type === 'background') {
      document.documentElement.style.setProperty('--background-color', color);
      // Também atualizar a cor da sidebar (60% mais clara)
      const backgroundRgb = hexToRgb(color);
      if (backgroundRgb) {
        const sidebarColor = lightenColor(color, 60);
        document.documentElement.style.setProperty('--sidebar-background', sidebarColor);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="config-loading">Carregando configurações...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="config-container">
        <div className="config-header">
          <h1>Configurações da Empresa</h1>
          <p className="config-subtitle">Personalize a aparência e configurações do sistema</p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        {!config && !error && !loading && (
          <Alert variant="info">
            Esta é a primeira vez configurando esta empresa. Defina as cores e configurações abaixo.
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="config-form">
          {/* Cores */}
          <Card className="config-section">
            <h2 className="section-title">🎨 Cores do Sistema</h2>
            <p className="section-description">
              Personalize as cores da sua marca que serão aplicadas em todo o sistema
            </p>

            <div className="color-inputs">
              <div className="color-input-group">
                <Input
                  type="color"
                  label="Cor Primária (Componentes)"
                  value={primaryColor}
                  onChange={(e) => {
                    setPrimaryColor(e.target.value);
                    handleColorPreview(e.target.value, 'primary');
                  }}
                  className="color-picker"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#001166"
                  className="color-text"
                />
              </div>

              <div className="color-input-group">
                <Input
                  type="color"
                  label="Cor Secundária (Fontes)"
                  value={secondaryColor}
                  onChange={(e) => {
                    setSecondaryColor(e.target.value);
                    handleColorPreview(e.target.value, 'secondary');
                  }}
                  className="color-picker"
                />
                <Input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="color-text"
                />
              </div>

              <div className="color-input-group">
                <Input
                  type="color"
                  label="Cor de Fundo"
                  value={backgroundColor}
                  onChange={(e) => {
                    setBackgroundColor(e.target.value);
                    handleColorPreview(e.target.value, 'background');
                  }}
                  className="color-picker"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  placeholder="#F8F9FA"
                  className="color-text"
                />
              </div>
            </div>

            <div className="color-preview">
              <div className="preview-card" style={{ 
                backgroundColor: backgroundColor,
                padding: '24px',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: secondaryColor, marginBottom: '16px' }}>Preview das Cores</h3>
                <p style={{ color: secondaryColor, marginBottom: '16px' }}>
                  Este é um exemplo de texto usando a cor secundária (fontes)
                </p>
                <button 
                  className="preview-example-button"
                  style={{ 
                    backgroundColor: primaryColor, 
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                  Botão de Exemplo
                </button>
                <p style={{ 
                  color: secondaryColor, 
                  marginTop: '16px',
                  fontSize: '12px',
                  opacity: 0.7
                }}>
                  Cor de fundo do botão: Primária | Cor do texto: Secundária | Cor de fundo: Background
                </p>
              </div>
            </div>
          </Card>

          {/* Informações do Negócio */}
          <Card className="config-section">
            <h2 className="section-title">🏢 Informações do Negócio</h2>
            <p className="section-description">
              Informações adicionais sobre sua empresa
            </p>

            <div className="form-grid">
            <Input
              label="Nome Fantasia *"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Jump Park São Paulo"
              required
            />

              <Input
                label="WhatsApp"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+55 11 99999-9999"
              />
            </div>

            <div className="form-group-full">
              <label htmlFor="logo">Logotipo da Empresa</label>
              <p className="field-description">
                Imagem que aparecerá no cabeçalho da sidebar (formatos: PNG, JPG - máx: 2MB)
              </p>
              <div className="logo-upload-container">
                {logoPreview && (
                  <div className="logo-preview">
                    <img src={logoPreview} alt="Logo preview" />
                  </div>
                )}
                <input
                  type="file"
                  id="logo"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        setError('Imagem muito grande. Máximo: 2MB');
                        return;
                      }
                      setLogo(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setLogoPreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="file-input"
                />
              </div>
            </div>

            <Input
              label="Instagram"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@jumppark"
            />

            <div className="form-group-full">
              <label htmlFor="description">Descrição do Negócio</label>
              <textarea
                id="description"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Descreva seu negócio..."
                rows={4}
                className="textarea-field"
              />
            </div>
          </Card>

          {/* Configurações de Impressoras */}
          <Card className="config-section">
            <h2 className="section-title">🖨️ Impressoras</h2>
            <p className="section-description">
              Configure as impressoras padrão da empresa
            </p>

            <div className="form-grid">
              <Input
                label="Impressora Fiscal"
                value={fiscalPrinter}
                onChange={(e) => setFiscalPrinter(e.target.value)}
                placeholder="Nome da impressora fiscal"
              />

              <Input
                label="Impressora A4"
                value={a4Printer}
                onChange={(e) => setA4Printer(e.target.value)}
                placeholder="Nome da impressora A4"
              />
            </div>
          </Card>

          {/* Configurações de Preço */}
          <Card className="config-section">
            <h2 className="section-title">💰 Precificação</h2>
            <p className="section-description">
              Configure os valores cobrados
            </p>

            <Input
              type="number"
              label="Preço por Minuto Adicional (R$)"
              value={additionalMinutePrice}
              onChange={(e) => setAdditionalMinutePrice(e.target.value)}
              placeholder="5.00"
              step="0.01"
              min="0"
              required
            />
          </Card>

          {/* Notificações */}
          <Card className="config-section">
            <h2 className="section-title">🔔 Notificações</h2>
            <p className="section-description">
              Configure como deseja receber notificações
            </p>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={sendNotifications}
                  onChange={(e) => setSendNotifications(e.target.checked)}
                />
                <span>Enviar notificações por email</span>
              </label>
            </div>

            {sendNotifications && (
              <Input
                type="email"
                label="Email para Notificações"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="contato@empresa.com"
              />
            )}
          </Card>

          {/* Botões */}
          <div className="config-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dashboard')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              size="large"
            >
              Salvar Configurações
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default Config;
