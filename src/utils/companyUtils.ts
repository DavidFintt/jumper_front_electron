import type { Company } from '../services/types';

/**
 * Formata o nome da empresa concatenando com o nome da unidade se existir
 * @param company - Objeto da empresa ou string com o nome
 * @param unitName - Nome da unidade (opcional, usado quando company é string)
 * @returns Nome formatado: "Nome da Empresa" ou "Nome da Empresa - Nome da Unidade"
 */
export const formatCompanyName = (
  company: Company | string | null | undefined,
  unitName?: string
): string => {
  if (!company) return '';
  
  // Se é string, usar diretamente
  if (typeof company === 'string') {
    if (unitName) {
      return `${company} - ${unitName}`;
    }
    return company;
  }
  
  // Se é objeto Company
  const baseName = company.name || '';
  const unit = company.unit_name || unitName;
  
  if (unit) {
    return `${baseName} - ${unit}`;
  }
  
  return baseName;
};

/**
 * Extrai apenas o nome da unidade de um nome formatado
 * @param fullName - Nome completo formatado
 * @returns Nome da unidade ou string vazia
 */
export const extractUnitName = (fullName: string): string => {
  const parts = fullName.split(' - ');
  return parts.length > 1 ? parts.slice(1).join(' - ') : '';
};

/**
 * Extrai apenas o nome base da empresa de um nome formatado
 * @param fullName - Nome completo formatado
 * @returns Nome base da empresa
 */
export const extractBaseName = (fullName: string): string => {
  const parts = fullName.split(' - ');
  return parts[0] || fullName;
};

