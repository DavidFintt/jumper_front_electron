import React, { useState, useEffect } from 'react';
import { Layout } from '../../../components/layout';
import { Button, Alert, DataTable, Input } from '../../../components/ui';
import type { Column, Filter } from '../../../components/ui';
import { userService, companyService } from '../../../services';
import type { User, Company } from '../../../services/types';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiUser, FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { formatCompanyName } from '../../../utils/companyUtils';
import './UsersManagement.css';

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    company: '',
    is_admin: false,
    is_superuser: false,
    is_active: true,
  });

  // Get user data
  const userStr = localStorage.getItem('userData');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperuser = user?.is_superuser || false;
  const isAdmin = user?.is_admin || false;
  
  // Get company ID - usar estado para detectar mudanças
  const [companyId, setCompanyId] = useState<number | undefined>(() => {
    const selectedCompany = localStorage.getItem('selectedCompany');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    return selectedCompany ? parseInt(selectedCompany) : userData.company;
  });

  // Atualizar companyId quando selectedCompany mudar no localStorage
  useEffect(() => {
    const checkCompanyChange = () => {
      const selectedCompany = localStorage.getItem('selectedCompany');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const currentCompanyId = selectedCompany ? parseInt(selectedCompany) : userData.company;
      
      // Só atualiza se realmente mudou
      setCompanyId(prev => {
        if (prev !== currentCompanyId) {
          return currentCompanyId;
        }
        return prev;
      });
    };

    // Escutar mudanças no localStorage (de outras abas/janelas)
    window.addEventListener('storage', checkCompanyChange);
    
    // Verificar mudanças periodicamente (para mesma aba)
    const interval = setInterval(checkCompanyChange, 500);

    return () => {
      window.removeEventListener('storage', checkCompanyChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (companyId) {
      loadUsers();
      loadCompanies();
    }
  }, [companyId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Superuser: se tem companyId, filtra por empresa; senão vê todos
      // Admin: sempre passa companyId para filtrar pela empresa selecionada
      const response = await userService.list(companyId);
        
      if (response.success) {
        setUsers(response.data || []);
      } else {
        setError(response.error || 'Erro ao carregar usuários');
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.response?.data?.error || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await companyService.list();
      if (response.success) {
        setCompanies(response.data || []);
      }
    } catch (err: any) {
      console.error('Error loading companies:', err);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      password_confirm: '',
      company: isSuperuser ? '' : (companyId?.toString() || ''),
      is_admin: false,
      is_superuser: false,
      is_active: true,
    });
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      password_confirm: '',
      company: '',
      is_admin: false,
      is_superuser: false,
      is_active: true,
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    // Se for admin, usa a empresa do usuário logado; senão usa a empresa do usuário editado
    const userCompany = user.is_admin && !isSuperuser 
      ? (companyId?.toString() || '')
      : (user.company?.toString() || '');
    
    setFormData({
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      password: '',
      password_confirm: '',
      company: userCompany,
      is_admin: user.is_admin || false,
      is_superuser: user.is_superuser || false,
      is_active: user.is_active ?? true,
    });
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Tem certeza que deseja desativar o usuário "${user.username}"?`)) {
      return;
    }

    try {
      const response = isSuperuser
        ? await userService.delete(user.id)
        : await userService.delete(user.id, companyId);
        
      if (response.success) {
        toast.success('Usuário desativado com sucesso!');
        loadUsers();
      } else {
        toast.error(response.error || 'Erro ao desativar usuário');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao conectar ao servidor');
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Validações básicas
      if (!formData.username.trim()) {
        toast.error('Nome de usuário é obrigatório');
        return;
      }

      if (!formData.email.trim()) {
        toast.error('E-mail é obrigatório');
        return;
      }

      if (!formData.first_name.trim()) {
        toast.error('Nome é obrigatório');
        return;
      }

      if (!formData.last_name.trim()) {
        toast.error('Sobrenome é obrigatório');
        return;
      }

      // Validação de senha para criação
      if (!editingUser) {
        if (!formData.password) {
          toast.error('Senha é obrigatória para novos usuários');
          return;
        }
        if (formData.password.length < 8) {
          toast.error('Senha deve ter pelo menos 8 caracteres');
          return;
        }
        if (formData.password !== formData.password_confirm) {
          toast.error('As senhas não coincidem');
          return;
        }
      } else {
        // Na edição, senha é opcional
        if (formData.password && formData.password.length < 8) {
          toast.error('Senha deve ter pelo menos 8 caracteres');
          return;
        }
        if (formData.password && formData.password !== formData.password_confirm) {
          toast.error('As senhas não coincidem');
          return;
        }
      }

      // Validações de permissões
      if (formData.is_superuser) {
        // Superuser não pode ter empresa
        if (formData.company) {
          toast.error('Superusers não devem estar vinculados a uma empresa');
          return;
        }
        if (formData.is_admin) {
          toast.error('Superusers não devem ser marcados como admin');
          return;
        }
      } else if (formData.is_admin) {
        // Admin usa a empresa do usuário logado
        if (!companyId && !isSuperuser) {
          toast.error('Empresa não selecionada');
          return;
        }
      } else {
        // Usuário comum deve ter empresa
        // Se for admin criando, usa a empresa logada; se for superuser, usa a selecionada
        if (!formData.company && !companyId) {
          toast.error('Usuários comuns devem estar vinculados a uma empresa');
          return;
        }
      }

      const data: any = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        is_admin: formData.is_admin,
        is_superuser: formData.is_superuser,
        is_active: formData.is_active,
      };

      // Adiciona senha se fornecida
      if (formData.password) {
        data.password = formData.password;
        data.password_confirm = formData.password_confirm;
      }

      // Adiciona company conforme o tipo de usuário
      if (formData.is_superuser) {
        // Superuser não tem company
        data.company = null;
      } else if (formData.is_admin) {
        // Admin usa a empresa do usuário logado (companies_managed com apenas essa empresa)
        if (isSuperuser && formData.company) {
          // Se for superuser criando/editando admin, usa a empresa selecionada
          data.companies_managed = [parseInt(formData.company)];
        } else {
          // Se for admin criando/editando, usa a empresa que ele está logado
          data.companies_managed = companyId ? [companyId] : [];
        }
        data.company = null;
      } else {
        // Usuário comum tem company
        // Se for admin criando, usa a empresa logada; se for superuser, usa a selecionada
        if (isSuperuser) {
          data.company = parseInt(formData.company);
        } else {
          // Admin sempre usa a empresa que está logado
          data.company = companyId;
        }
      }

      let response;
      if (editingUser) {
        response = isSuperuser
          ? await userService.update(editingUser.id, data)
          : await userService.update(editingUser.id, data, companyId);
      } else {
        response = isSuperuser
          ? await userService.create(data)
          : await userService.create(data, companyId);
      }

      if (response.success) {
        toast.success(editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!');
        loadUsers();
        handleCloseModal();
      } else {
        const errorMsg = response.error || response.details 
          ? typeof response.details === 'object' 
            ? Object.values(response.details).flat().join(', ')
            : response.details || response.error
          : 'Erro ao salvar usuário';
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.details
        ? typeof err.response.data.details === 'object'
          ? Object.values(err.response.data.details).flat().join(', ')
          : err.response.data.details || err.response.data.error
        : 'Erro ao conectar ao servidor';
      toast.error(errorMsg);
    }
  };

  // Configuração das colunas da tabela
  const columns: Column<User>[] = [
    {
      key: 'username',
      label: 'Usuário',
      sortable: true,
    },
    {
      key: 'full_name',
      label: 'Nome Completo',
      sortable: true,
    },
    {
      key: 'email',
      label: 'E-mail',
      sortable: true,
    },
    {
      key: 'company_name',
      label: 'Empresa',
      sortable: true,
      render: (user) => user.company_name || '-',
    },
    {
      key: 'user_type',
      label: 'Tipo',
      sortable: true,
      render: (user) => {
        if (user.is_superuser) {
          return <span className="status-badge status-superuser">Superuser</span>;
        } else if (user.is_admin) {
          return <span className="status-badge status-admin">Admin</span>;
        } else {
          return <span className="status-badge status-normal">Usuário</span>;
        }
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (user) => (
        <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
          {user.is_active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'last_login',
      label: 'Último Login',
      sortable: true,
      render: (user) => formatDate(user.last_login),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (user) => (
        <div className="action-buttons">
          <button onClick={() => handleEdit(user)} className="action-btn action-btn-edit" title="Editar">
            <FiEdit2 />
          </button>
          <button onClick={() => handleDelete(user)} className="action-btn action-btn-delete" title="Desativar">
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  // Filtrar dados com lógica customizada para tipo de usuário
  const filteredUsers = React.useMemo(() => {
    return users.map(user => ({
      ...user,
      // Adiciona campo virtual para facilitar filtragem
      user_type_display: user.is_superuser ? 'superuser' : (user.is_admin ? 'admin' : 'user'),
    }));
  }, [users]);

  // Configuração dos filtros
  const filters: Filter[] = [
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'Todos' },
        { value: 'true', label: 'Ativo' },
        { value: 'false', label: 'Inativo' },
      ],
    },
    {
      key: 'user_type_display',
      label: 'Tipo',
      type: 'select',
      options: [
        { value: '', label: 'Todos' },
        { value: 'superuser', label: 'Superuser' },
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'Usuário' },
      ],
    },
    ...(isSuperuser ? [{
      key: 'company_name',
      label: 'Empresa',
      type: 'select',
      options: [
        { value: '', label: 'Todas' },
        ...companies.map(company => ({ value: formatCompanyName(company), label: formatCompanyName(company) })),
      ],
    } as Filter] : []),
  ];

  return (
    <Layout>
      <div className="users-management-page">
        <div className="users-management-header">
          <div>
            <h1>Gerenciamento de Usuários</h1>
            <p className="users-management-subtitle">Cadastre e gerencie usuários do sistema</p>
          </div>
          <Button onClick={handleOpenModal} leftIcon={<FiPlus />}>
            Novo Usuário
          </Button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

        {loading ? (
          <div className="users-management-loading">Carregando usuários...</div>
        ) : (
          <DataTable
            data={filteredUsers}
            columns={columns}
            filters={filters}
            emptyMessage="Nenhum usuário cadastrado"
            loading={loading}
          />
        )}

        {/* Modal de Cadastro/Edição */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content users-management-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                <button className="modal-close" onClick={handleCloseModal}><FiX /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-body user-form">
                <div className="form-grid">
                  <div className="form-group">
                    <Input
                      label="Nome de Usuário *"
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Ex: joao.silva"
                      required
                      disabled={!!editingUser}
                    />
                    {editingUser && <small className="form-hint">Nome de usuário não pode ser alterado</small>}
                  </div>

                  <div className="form-group">
                    <Input
                      label="E-mail *"
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="exemplo@email.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <Input
                      label="Nome *"
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Ex: João"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <Input
                      label="Sobrenome *"
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Ex: Silva"
                      required
                    />
                  </div>

                  {!editingUser && (
                    <>
                      <div className="form-group">
                        <Input
                          label="Senha *"
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Mínimo 8 caracteres"
                          required
                          leftIcon={<FiLock />}
                        />
                      </div>

                      <div className="form-group">
                        <Input
                          label="Confirmar Senha *"
                          id="password_confirm"
                          type="password"
                          value={formData.password_confirm}
                          onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                          placeholder="Digite a senha novamente"
                          required
                          leftIcon={<FiLock />}
                        />
                      </div>
                    </>
                  )}

                  {editingUser && (
                    <>
                      <div className="form-group">
                        <Input
                          label="Nova Senha (opcional)"
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Deixe em branco para manter a senha atual"
                          leftIcon={<FiLock />}
                        />
                      </div>

                      <div className="form-group">
                        <Input
                          label="Confirmar Nova Senha"
                          id="password_confirm"
                          type="password"
                          value={formData.password_confirm}
                          onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                          placeholder="Digite a senha novamente"
                          leftIcon={<FiLock />}
                        />
                      </div>
                    </>
                  )}

                  {isSuperuser && (
                    <div className="form-group full-width">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          id="is_superuser"
                          checked={formData.is_superuser}
                          onChange={(e) => {
                            const isSuper = e.target.checked;
                            setFormData({
                              ...formData,
                              is_superuser: isSuper,
                              is_admin: isSuper ? false : formData.is_admin,
                              company: isSuper ? '' : formData.company,
                            });
                          }}
                        />
                        <span>Superuser (acesso total ao sistema)</span>
                      </label>
                    </div>
                  )}

                  {isSuperuser && !formData.is_superuser && (
                    <div className="form-group full-width">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          id="is_admin"
                          checked={formData.is_admin}
                          onChange={(e) => {
                            const isAdmin = e.target.checked;
                            setFormData({
                              ...formData,
                              is_admin: isAdmin,
                              company: isAdmin ? (companyId?.toString() || '') : formData.company,
                            });
                          }}
                        />
                        <span>Administrador (gerencia a empresa atual)</span>
                      </label>
                      {formData.is_admin && (
                        <small className="form-hint">O admin será vinculado à empresa que você está logado</small>
                      )}
                    </div>
                  )}

                  {!formData.is_admin && !formData.is_superuser && (
                    <>
                      {isSuperuser ? (
                        <div className="form-group">
                          <label htmlFor="company">Empresa *</label>
                          <select
                            id="company"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            required
                          >
                            <option value="" disabled>Selecione uma empresa</option>
                            {companies.map((company) => (
                              <option key={company.id} value={company.id}>
                                {formatCompanyName(company)}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="form-group">
                          <label htmlFor="company_info">Empresa</label>
                          <input
                            type="text"
                            id="company_info"
                            value={companies.find(c => c.id === companyId)?.name || ''}
                            disabled
                            style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                          />
                          <small className="form-hint">Usuário será vinculado à empresa que você está logado</small>
                        </div>
                      )}
                    </>
                  )}

                  {formData.is_admin && !formData.is_superuser && !isSuperuser && (
                    <div className="form-group">
                      <label htmlFor="company_info">Empresa</label>
                      <input
                        type="text"
                        id="company_info"
                        value={companies.find(c => c.id === companyId)?.name || ''}
                        disabled
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                      />
                      <small className="form-hint">Admin será vinculado a esta empresa</small>
                    </div>
                  )}

                  <div className="form-group full-width">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                      <span>Usuário ativo</span>
                    </label>
                  </div>
                </div>

                <div className="modal-actions">
                  <Button type="button" variant="outline" onClick={handleCloseModal}>
                    <FiX /> Cancelar
                  </Button>
                  <Button type="submit" variant="primary">
                    <FiSave /> {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UsersManagement;

