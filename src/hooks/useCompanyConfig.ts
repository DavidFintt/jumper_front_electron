import { useState, useEffect } from 'react';
import { companyConfigService } from '../services';
import type { CompanyConfig } from '../services';

export const useCompanyConfig = () => {
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompanyConfig();
  }, []);

  const loadCompanyConfig = async () => {
    try {
      const userStr = localStorage.getItem('userData');
      const selectedCompanyId = localStorage.getItem('selectedCompany');

      if (!userStr) {
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      
      // Determinar qual company_id usar
      // SEMPRE verifica selectedCompany primeiro (funciona para todos os tipos de usuário)
      let companyId: number | null = null;
      
      if (selectedCompanyId) {
        // Se tem selectedCompany, usa ele (para qualquer tipo de usuário)
        companyId = parseInt(selectedCompanyId);
      } else if (user.company) {
        // Fallback: usa a empresa vinculada ao usuário
        companyId = typeof user.company === 'number' ? user.company : parseInt(user.company.toString());
      }

      if (!companyId) {
        setLoading(false);
        return;
      }
      
      // Buscar configuração da empresa usando o service
      const response = await companyConfigService.getByCompanyId(companyId);

      if (response.success && response.data) {
        setConfig(response.data);
        
        // Aplicar cores no CSS root
        applyColors(
          response.data.primary_color,
          response.data.secondary_color,
          response.data.background_color
        );
        
        // Salvar no localStorage para uso offline
        localStorage.setItem('companyConfig', JSON.stringify(response.data));
      } else {
        // Tentar carregar do localStorage
        const cachedConfig = localStorage.getItem('companyConfig');
        if (cachedConfig) {
          const parsedConfig = JSON.parse(cachedConfig);
          setConfig(parsedConfig);
          applyColors(
            parsedConfig.primary_color,
            parsedConfig.secondary_color,
            parsedConfig.background_color
          );
        }
      }
    } catch (err) {
      console.error('Error loading company config:', err);
      setError('Erro ao carregar configurações');
      
      // Tentar carregar do localStorage
      const cachedConfig = localStorage.getItem('companyConfig');
      if (cachedConfig) {
        const parsedConfig = JSON.parse(cachedConfig);
        setConfig(parsedConfig);
        applyColors(
          parsedConfig.primary_color,
          parsedConfig.secondary_color,
          parsedConfig.background_color
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const applyColors = (primaryColor: string, secondaryColor: string, backgroundColor: string) => {
    // Aplicar cores como variáveis CSS
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);
    document.documentElement.style.setProperty('--background-color', backgroundColor);
    
    // Calcular cor com opacidade para hover/active
    const primaryRgb = hexToRgb(primaryColor);
    if (primaryRgb) {
      document.documentElement.style.setProperty(
        '--primary-color-light',
        `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`
      );
      document.documentElement.style.setProperty(
        '--primary-color-dark',
        darkenColor(primaryColor, 20)
      );
      
      // Calcular cor de texto ideal para botões (branca ou preta baseado no fundo)
      const buttonTextColor = getContrastColor(primaryRgb);
      document.documentElement.style.setProperty('--button-text-color', buttonTextColor);
    }
    
    // Calcular cor de fundo mais clara para a sidebar
    const backgroundRgb = hexToRgb(backgroundColor);
    if (backgroundRgb) {
      document.documentElement.style.setProperty(
        '--sidebar-background',
        lightenColor(backgroundColor, 60)
      );
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

  const darkenColor = (hex: string, percent: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    
    const r = Math.floor(rgb.r * (1 - percent / 100));
    const g = Math.floor(rgb.g * (1 - percent / 100));
    const b = Math.floor(rgb.b * (1 - percent / 100));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const lightenColor = (hex: string, percent: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    
    const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * (percent / 100)));
    const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * (percent / 100)));
    const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * (percent / 100)));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const getContrastColor = (rgb: { r: number; g: number; b: number }) => {
    // Calcula a luminância relativa (WCAG)
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    
    // Se a cor for escura (luminância < 0.5), usa texto branco
    // Se a cor for clara (luminância >= 0.5), usa texto preto
    return luminance < 0.5 ? '#FFFFFF' : '#000000';
  };

  return { config, loading, error, refresh: loadCompanyConfig };
};

export default useCompanyConfig;
