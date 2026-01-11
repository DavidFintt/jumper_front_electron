import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/layout';
import { Button, Alert, Input, DataTable } from '../../../components/ui';
import type { Column, Filter } from '../../../components/ui';
import { companyService, userService } from '../../../services';
import { api } from '../../../services/api';
import type { Company, User } from '../../../services/types';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiBriefcase, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { formatCompanyName } from '../../../utils/companyUtils';
import './Companies.css';

interface CompaniesProps {
  hideLayout?: boolean;
}

// Funções de máscara
const maskCNPJ = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return cleaned.replace(/(\d{2})(\d)/, '$1.$2');
  if (cleaned.length <= 8) return cleaned.replace(/(\d{2})(\d{3})(\d)/, '$1.$2.$3');
  if (cleaned.length <= 12) return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d)/, '$1.$2.$3/$4');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

const maskCEP = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 5) return cleaned;
  return cleaned.replace(/(\d{5})(\d{1,3})/, '$1-$2');
};

const maskPhone = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 6) return cleaned.replace(/(\d{2})(\d)/, '($1) $2');
  if (cleaned.length <= 10) return cleaned.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3');
  return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

const Companies: React.FC<CompaniesProps> = ({ hideLayout = false }) => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCompany, setPaymentCompany] = useState<Company | null>(null);
  const [paymentData, setPaymentData] = useState({
    paid_date: new Date().toISOString().split('T')[0], // Data de hoje
  });
  
  // Admin search state
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    is_active: true,
    due_date: '5',
    unit_name: '', // Nome da unidade (opcional)
    admin_user_ids: [] as number[], // Mudado para array de números
    number_machines: '1',
  });

  // Check if user is superuser
  const userStr = localStorage.getItem('userData');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperuser = user?.is_superuser || false;

  useEffect(() => {
    // Redirect if not superuser
    if (!isSuperuser) {
      toast.error('Acesso negado. Apenas superusuários podem acessar esta página.');
      navigate('/dashboard');
      return;
    }
    
    loadCompanies();
    loadUsers();
  }, [isSuperuser, navigate]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await companyService.list();
        
      if (response.success) {
        setCompanies(response.data || []);
      } else {
        setError(response.error || 'Erro ao carregar empresas');
      }
    } catch (err: any) {
      console.error('Error loading companies:', err);
      setError('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.list();
      if (response.success) {
        // Filtrar apenas usuários que são admins (is_admin=true, sem superuser)
        const adminUsers = (response.data || []).filter((u: User) => u.is_admin && !u.is_superuser);
        setUsers(adminUsers);
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
    }
  };

  const handleOpenModal = async (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      
      // Buscar número de dispositivos da empresa
      let numberMachines = '1';
      try {
        const response = await api.get(`/company-machines/number/${company.id}/`);
        if (response.success && response.data) {
          numberMachines = response.data.number_machines.toString();
        }
      } catch (error) {
        console.error('Erro ao buscar número de dispositivos:', error);
      }
      
      // Buscar admins vinculados à empresa
      let adminUserIds: number[] = [];
      try {
        const usersResponse = await userService.list();
        if (usersResponse.success && usersResponse.data) {
          const adminUsers = usersResponse.data.filter(
            (user: User) => 
              user.is_admin && 
              !user.is_superuser && 
              user.companies_managed_ids?.includes(company.id)
          );
          adminUserIds = adminUsers.map(u => u.id);
        }
      } catch (error) {
        console.error('Erro ao buscar admins da empresa:', error);
      }
      
      setFormData({
        name: company.name,
        legal_name: company.legal_name,
        cnpj: maskCNPJ(company.cnpj),
        phone: maskPhone(company.phone),
        email: company.email,
        address: company.address,
        city: company.city,
        state: company.state,
        zip_code: maskCEP(company.zip_code),
        is_active: company.is_active,
        due_date: company.due_date ? String(company.due_date) : '5',
        unit_name: company.unit_name || '',
        admin_user_ids: adminUserIds,
        number_machines: numberMachines,
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        legal_name: '',
        cnpj: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        is_active: true,
        due_date: '5',
        unit_name: '',
        admin_user_ids: [],
        number_machines: '1',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCompany(null);
    setAdminSearchTerm(''); // Limpar busca ao fechar modal
  };

  const handleOpenPaymentModal = (company: Company) => {
    setPaymentCompany(company);
    setPaymentData({
      paid_date: new Date().toISOString().split('T')[0],
    });
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentCompany(null);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentCompany) return;
    
    try {
      const response = await api.post('/subscription-info/', {
        company: paymentCompany.id,
        paid_date: paymentData.paid_date,
      });
      
      if (response.success) {
        toast.success('Pagamento registrado com sucesso!');
        handleClosePaymentModal();
        loadCompanies();
      } else {
        toast.error(response.error || 'Erro ao registrar pagamento');
      }
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    let maskedValue = value;
    
    // Aplicar máscaras
    if (name === 'cnpj') {
      maskedValue = maskCNPJ(value);
    } else if (name === 'zip_code') {
      maskedValue = maskCEP(value);
    } else if (name === 'phone') {
      maskedValue = maskPhone(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : maskedValue
    }));
  };

  const handleAdminToggle = (adminId: number) => {
    setFormData(prev => {
      const isSelected = prev.admin_user_ids.includes(adminId);
      return {
        ...prev,
        admin_user_ids: isSelected
          ? prev.admin_user_ids.filter(id => id !== adminId)
          : [...prev.admin_user_ids, adminId]
      };
    });
  };

  const handleSelectAllAdmins = () => {
    setFormData(prev => ({
      ...prev,
      admin_user_ids: users.map(u => u.id)
    }));
  };

  const handleDeselectAllAdmins = () => {
    setFormData(prev => ({
      ...prev,
      admin_user_ids: []
    }));
  };

  // Filtrar admins baseado no termo de busca
  const filteredUsers = users.filter(user => {
    if (!adminSearchTerm) return true;
    const searchLower = adminSearchTerm.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataToSend = {
        name: formData.name,
        legal_name: formData.legal_name,
        cnpj: formData.cnpj, // Mantém máscara
        phone: formData.phone, // Mantém máscara
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code, // Mantém máscara
        is_active: formData.is_active,
        due_date: parseInt(formData.due_date),
        unit_name: formData.unit_name || null, // Enviar null se vazio
      };

      let response;
      if (editingCompany) {
        response = await companyService.update(editingCompany.id, dataToSend);
      } else {
        response = await companyService.create(dataToSend);
      }
      
      if (response.success) {
        toast.success(editingCompany ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!');
        
        // Se foi criação
        if (!editingCompany && response.data) {
          // Vincular admins à empresa se selecionados
          if (formData.admin_user_ids.length > 0) {
            for (const adminId of formData.admin_user_ids) {
              await linkAdminToCompany(adminId, response.data.id);
            }
          }
          
          // Criar registro de número de dispositivos
          try {
            console.log('Criando número de dispositivos:', {
              company_id: response.data.id,
              number_machines: parseInt(formData.number_machines),
            });
            
            const machineNumberResponse = await api.post('/company-machines/number/', {
              company_id: response.data.id,
              number_machines: parseInt(formData.number_machines),
            });
            
            console.log('Resposta da criação:', machineNumberResponse);
          } catch (error: any) {
            console.error('Erro ao definir número de dispositivos:', error);
            console.error('URL tentada:', error.config?.url);
            console.error('Status:', error.response?.status);
            console.error('Resposta:', error.response?.data);
            toast.error('Empresa criada, mas falha ao definir limite de dispositivos');
          }
        }
        
        // Se foi edição, atualizar número de dispositivos e admins
        if (editingCompany) {
          try {
            const updateUrl = `/company-machines/number/${editingCompany.id}/`;
            console.log('Atualizando número de dispositivos:', updateUrl, {
              number_machines: parseInt(formData.number_machines),
            });
            
            const updateResponse = await api.put(updateUrl, {
              number_machines: parseInt(formData.number_machines),
            });
            
            console.log('Resposta da atualização:', updateResponse);
          } catch (error: any) {
            console.error('Erro ao atualizar número de dispositivos:', error);
            console.error('Detalhes do erro:', error.response?.data);
            toast.error('Empresa atualizada, mas falha ao atualizar limite de dispositivos');
          }
          
          // Atualizar vínculos de admins
          try {
            // Buscar admins atuais
            const usersResponse = await userService.list();
            if (usersResponse.success && usersResponse.data) {
              const allUsers = usersResponse.data;
              
              // Para cada admin, atualizar seus vínculos
              for (const user of allUsers) {
                if (user.is_admin && !user.is_superuser) {
                  const currentManagedIds = user.companies_managed_ids || [];
                  const shouldBeLinked = formData.admin_user_ids.includes(user.id);
                  const isCurrentlyLinked = currentManagedIds.includes(editingCompany.id);
                  
                  if (shouldBeLinked && !isCurrentlyLinked) {
                    // Adicionar empresa ao admin
                    await userService.update(user.id, {
                      companies_managed: [...currentManagedIds, editingCompany.id]
                    });
                  } else if (!shouldBeLinked && isCurrentlyLinked) {
                    // Remover empresa do admin
                    await userService.update(user.id, {
                      companies_managed: currentManagedIds.filter(id => id !== editingCompany.id)
                    });
                  }
                }
              }
              toast.success('Vínculos de administradores atualizados!');
            }
          } catch (error: any) {
            console.error('Erro ao atualizar vínculos de admins:', error);
            toast.error('Empresa atualizada, mas falha ao atualizar vínculos de admins');
          }
        }
        
        handleCloseModal();
        loadCompanies();
      } else {
        console.error('Erro ao salvar empresa:', response);
        
        // Mostrar detalhes do erro se disponível
        if (response.details) {
          console.error('Detalhes do erro:', response.details);
          
          // Verificar se é erro de CNPJ duplicado
          if (response.details.cnpj) {
            const cnpjErrors = Array.isArray(response.details.cnpj) 
              ? response.details.cnpj 
              : [response.details.cnpj];
            
            const isDuplicateError = cnpjErrors.some((error: string) => 
              error.toLowerCase().includes('already exists') || 
              error.toLowerCase().includes('já existe')
            );
            
            if (isDuplicateError) {
              toast.error(
                'O sistema permite múltiplas unidades com o mesmo CNPJ. ' +
                'Por favor, adicione um "Nome da Unidade" para diferenciar as filiais. ' +
                'Se o erro persistir, contate o administrador do sistema.',
                { autoClose: 8000 }
              );
              return;
            }
          }
          
          // Mostrar cada erro de campo
          Object.keys(response.details).forEach(field => {
            const errors = response.details[field];
            if (Array.isArray(errors)) {
              errors.forEach(error => {
                toast.error(`${field}: ${error}`);
              });
            } else {
              toast.error(`${field}: ${errors}`);
            }
          });
        } else {
          toast.error(response.error || 'Erro ao salvar empresa');
        }
      }
    } catch (err: any) {
      console.error('Error saving company:', err);
      console.error('Response data:', err.response?.data);
      
      // Mostrar detalhes do erro da API se disponível
      if (err.response?.data?.details) {
        Object.keys(err.response.data.details).forEach(field => {
          const errors = err.response.data.details[field];
          if (Array.isArray(errors)) {
            errors.forEach(error => {
              toast.error(`${field}: ${error}`);
            });
          }
        });
      } else {
        toast.error(err.response?.data?.error || 'Erro ao salvar empresa');
      }
    }
  };

  const linkAdminToCompany = async (userId: number, companyId: number) => {
    try {
      // Buscar usuário para obter as empresas já gerenciadas
      const userResponse = await userService.getById(userId);
      if (userResponse.success && userResponse.data) {
        const currentManagedIds = userResponse.data.companies_managed_ids || [];
        
        // Adicionar nova empresa à lista
        const updatedManagedIds = [...currentManagedIds, companyId];
        
        // Atualizar usuário com nova lista de empresas
        const updateResponse = await userService.update(userId, {
          companies_managed: updatedManagedIds
        });
        
        if (updateResponse.success) {
          toast.success('Admin vinculado à empresa com sucesso!');
        }
      }
    } catch (err: any) {
      console.error('Error linking admin to company:', err);
      toast.error('Erro ao vincular admin à empresa');
    }
  };

  const handleInactivate = async (company: Company) => {
    const action = company.is_active ? 'inativar' : 'ativar';
    if (!window.confirm(`Tem certeza que deseja ${action} a empresa "${company.name}"?`)) {
      return;
    }
    
    try {
      const response = await companyService.update(company.id, {
        is_active: !company.is_active
      });
      
      if (response.success) {
        toast.success(`Empresa ${company.is_active ? 'inativada' : 'ativada'} com sucesso!`);
        loadCompanies();
      } else {
        toast.error(response.error || `Erro ao ${action} empresa`);
      }
    } catch (err: any) {
      console.error('Error updating company:', err);
      toast.error(`Erro ao ${action} empresa`);
    }
  };

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Nome',
      render: (company) => formatCompanyName(company),
    },
    {
      key: 'legal_name',
      label: 'Razão Social',
    },
    {
      key: 'cnpj',
      label: 'CNPJ',
    },
    {
      key: 'email',
      label: 'E-mail',
    },
    {
      key: 'phone',
      label: 'Telefone',
    },
    {
      key: 'city',
      label: 'Cidade',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (company) => (
        <span className={`status-badge ${company.is_active ? 'active' : 'inactive'}`}>
          {company.is_active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (company) => (
        <div className="action-buttons">
          <Button
            variant="outline"
            size="small"
            onClick={() => handleOpenModal(company)}
            title="Editar"
          >
            <FiEdit2 />
          </Button>
          <Button
            variant="success"
            size="small"
            onClick={() => handleOpenPaymentModal(company)}
            style={{ backgroundColor: '#28a745', borderColor: '#28a745', color: 'white' }}
            title="Informar Pagamento"
          >
            <FiDollarSign />
          </Button>
          <Button
            variant={company.is_active ? "danger" : "primary"}
            size="small"
            onClick={() => handleInactivate(company)}
            title={company.is_active ? 'Inativar' : 'Ativar'}
          >
            <FiTrash2 />
          </Button>
        </div>
      ),
    },
  ];

  const filters: Filter[] = [
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Ativo' },
        { value: 'false', label: 'Inativo' }
      ],
      placeholder: 'Todos'
    }
  ];

  if (!isSuperuser) {
    return null;
  }

  const content = (
    <div className="companies-container">
        <div className="companies-header">
          <div>
            <h1><FiBriefcase /> Gerenciamento de Empresas</h1>
            <p className="companies-subtitle">
              Cadastre e gerencie empresas do sistema
            </p>
          </div>
          <Button
            variant="primary"
            size="large"
            onClick={() => handleOpenModal()}
          >
            <FiPlus /> Nova Empresa
          </Button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="companies-content">
          <DataTable
            columns={columns}
            data={companies}
            loading={loading}
            emptyMessage="Nenhuma empresa cadastrada"
            filters={filters}
            defaultFilters={{ is_active: 'true' }}
          />
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
                </h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-grid">
                    <Input
                      label="Nome Fantasia *"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />

                    <Input
                      label="Razão Social *"
                      name="legal_name"
                      value={formData.legal_name}
                      onChange={handleInputChange}
                      required
                    />

                    <Input
                      label="CNPJ *"
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleInputChange}
                      placeholder="00.000.000/0000-00"
                      required
                    />

                    <Input
                      label="E-mail *"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />

                    <Input
                      label="Telefone *"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(00) 00000-0000"
                      required
                    />

                    <Input
                      label="CEP *"
                      name="zip_code"
                      value={formData.zip_code}
                      onChange={handleInputChange}
                      placeholder="00000-000"
                      required
                    />

                    <Input
                      label="Endereço *"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />

                    <Input
                      label="Cidade *"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />

                    <Input
                      label="Nome da Unidade (Opcional)"
                      name="unit_name"
                      value={formData.unit_name}
                      onChange={handleInputChange}
                      placeholder="Ex: Filial Centro, Unidade 2, etc"
                    />

                    <div className="form-group">
                      <label htmlFor="state">Estado *</label>
                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Selecione...</option>
                        <option value="AC">Acre</option>
                        <option value="AL">Alagoas</option>
                        <option value="AP">Amapá</option>
                        <option value="AM">Amazonas</option>
                        <option value="BA">Bahia</option>
                        <option value="CE">Ceará</option>
                        <option value="DF">Distrito Federal</option>
                        <option value="ES">Espírito Santo</option>
                        <option value="GO">Goiás</option>
                        <option value="MA">Maranhão</option>
                        <option value="MT">Mato Grosso</option>
                        <option value="MS">Mato Grosso do Sul</option>
                        <option value="MG">Minas Gerais</option>
                        <option value="PA">Pará</option>
                        <option value="PB">Paraíba</option>
                        <option value="PR">Paraná</option>
                        <option value="PE">Pernambuco</option>
                        <option value="PI">Piauí</option>
                        <option value="RJ">Rio de Janeiro</option>
                        <option value="RN">Rio Grande do Norte</option>
                        <option value="RS">Rio Grande do Sul</option>
                        <option value="RO">Rondônia</option>
                        <option value="RR">Roraima</option>
                        <option value="SC">Santa Catarina</option>
                        <option value="SP">São Paulo</option>
                        <option value="SE">Sergipe</option>
                        <option value="TO">Tocantins</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>Usuários Administradores (Opcional)</span>
                          {formData.admin_user_ids.length > 0 && (
                            <span style={{ 
                              fontSize: '13px', 
                              fontWeight: 'normal',
                              color: '#3b82f6',
                              backgroundColor: '#dbeafe',
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              {formData.admin_user_ids.length} selecionado{formData.admin_user_ids.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </label>
                        {users.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={handleSelectAllAdmins}
                              style={{
                                fontSize: '12px',
                                padding: '4px 8px',
                                border: '1px solid #3b82f6',
                                backgroundColor: 'transparent',
                                color: '#3b82f6',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#3b82f6';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#3b82f6';
                              }}
                            >
                              Selecionar todos
                            </button>
                            <button
                              type="button"
                              onClick={handleDeselectAllAdmins}
                              style={{
                                fontSize: '12px',
                                padding: '4px 8px',
                                border: '1px solid #64748b',
                                backgroundColor: 'transparent',
                                color: '#64748b',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#64748b';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#64748b';
                              }}
                            >
                              Limpar seleção
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Campo de Busca */}
                      {users.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <Input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={adminSearchTerm}
                            onChange={(e) => setAdminSearchTerm(e.target.value)}
                            style={{ marginBottom: 0 }}
                          />
                        </div>
                      )}
                      
                      <div style={{ 
                        maxHeight: '200px', 
                        overflowY: 'auto', 
                        border: '1px solid #ddd', 
                        borderRadius: '8px', 
                        padding: '12px',
                        backgroundColor: '#f9fafb'
                      }}>
                        {users.length === 0 ? (
                          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                            Nenhum usuário admin disponível
                          </p>
                        ) : filteredUsers.length === 0 ? (
                          <p style={{ color: '#666', fontSize: '14px', margin: 0, textAlign: 'center' }}>
                            Nenhum administrador encontrado com "{adminSearchTerm}"
                          </p>
                        ) : (
                          filteredUsers.map(user => (
                            <label 
                              key={user.id} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                padding: '8px', 
                                marginBottom: '4px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                transition: 'background-color 0.2s',
                                backgroundColor: formData.admin_user_ids.includes(user.id) ? '#e0f2fe' : 'transparent'
                              }}
                              onMouseEnter={(e) => {
                                if (!formData.admin_user_ids.includes(user.id)) {
                                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!formData.admin_user_ids.includes(user.id)) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.admin_user_ids.includes(user.id)}
                                onChange={() => handleAdminToggle(user.id)}
                                style={{ marginRight: '10px', cursor: 'pointer' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500, color: '#1f2937' }}>
                                  {user.full_name}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                  {user.email}
                                </div>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                      <small style={{ color: '#666', fontSize: '12px', marginTop: '6px', display: 'block' }}>
                        Selecione um ou mais administradores para gerenciar esta empresa
                      </small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="number_machines">Número de Dispositivos *</label>
                      <input
                        type="number"
                        id="number_machines"
                        name="number_machines"
                        value={formData.number_machines}
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="due_date">Dia de Vencimento *</label>
                      <input
                        type="number"
                        id="due_date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleInputChange}
                        min="1"
                        max="31"
                        required
                        placeholder="Ex: 5 (todo dia 5)"
                      />
                      <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                        Dia do mês para vencimento (1-31)
                      </small>
                    </div>

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                        />
                        Empresa Ativa
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                  >
                    <FiX /> Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    <FiSave /> {editingCompany ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Informar Pagamento */}
        {showPaymentModal && paymentCompany && (
          <div className="modal-overlay" onClick={handleClosePaymentModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h2>
                  <FiDollarSign /> Informar Pagamento
                </h2>
                <button className="modal-close" onClick={handleClosePaymentModal}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit}>
                <div className="modal-body">
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#1e40af' }}>
                      <FiBriefcase style={{ marginRight: '8px' }} />
                      {formatCompanyName(paymentCompany)}
                    </h3>
                    <p style={{ margin: '0', fontSize: '0.9rem', color: '#64748b' }}>
                      CNPJ: {paymentCompany.cnpj}
                    </p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>
                      Dia de Vencimento: Todo dia <strong>{paymentCompany.due_date}</strong>
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="paid_date">Data do Pagamento *</label>
                    <input
                      type="date"
                      id="paid_date"
                      name="paid_date"
                      value={paymentData.paid_date}
                      onChange={(e) => setPaymentData({ paid_date: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                    <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                      Data em que o pagamento foi realizado
                    </small>
                  </div>
                </div>

                <div className="modal-footer">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClosePaymentModal}
                  >
                    <FiX /> Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="success"
                    style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
                  >
                    <FiSave /> Registrar Pagamento
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );

  return hideLayout ? content : <Layout>{content}</Layout>;
};

export default Companies;

