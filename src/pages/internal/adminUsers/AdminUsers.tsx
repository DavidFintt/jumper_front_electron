import React, { useState, useEffect } from 'react';
import { Button, Alert, Input, DataTable } from '../../../components/ui';
import type { Column, Filter } from '../../../components/ui';
import { userService } from '../../../services';
import type { User } from '../../../services/types';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiUser, FiUserCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './AdminUsers.css';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
    is_active: true,
  });

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar todos os usuários e filtrar apenas admins sem empresa
      const response = await userService.list();
        
      if (response.success) {
        // Filtrar apenas usuários is_admin=true e sem company
        const adminUsers = (response.data || []).filter(
          (u: User) => u.is_admin && !u.company
        );
        setUsers(adminUsers);
      } else {
        setError(response.error || 'Erro ao carregar usuários');
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        password: '',
        password_confirm: '',
        is_active: user.is_active,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        password_confirm: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de senha
    if (!editingUser) {
      if (!formData.password || formData.password.length < 8) {
        toast.error('A senha deve ter no mínimo 8 caracteres');
        return;
      }
      if (formData.password !== formData.password_confirm) {
        toast.error('As senhas não coincidem');
        return;
      }
    } else if (formData.password) {
      if (formData.password.length < 8) {
        toast.error('A senha deve ter no mínimo 8 caracteres');
        return;
      }
      if (formData.password !== formData.password_confirm) {
        toast.error('As senhas não coincidem');
        return;
      }
    }
    
    try {
      const dataToSend: any = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        is_active: formData.is_active,
        is_admin: true, // Sempre true para admin users
      };

      // Adicionar senha apenas se foi fornecida
      if (formData.password) {
        dataToSend.password = formData.password;
        dataToSend.password_confirm = formData.password_confirm;
      }

      let response;
      if (editingUser) {
        response = await userService.update(editingUser.id, dataToSend);
      } else {
        dataToSend.password = formData.password;
        dataToSend.password_confirm = formData.password_confirm;
        response = await userService.create(dataToSend);
      }
      
      if (response.success) {
        toast.success(editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!');
        handleCloseModal();
        loadAdminUsers();
      } else {
        toast.error(response.error || 'Erro ao salvar usuário');
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      toast.error('Erro ao salvar usuário');
    }
  };

  const handleInactivate = async (user: User) => {
    const action = user.is_active ? 'inativar' : 'ativar';
    if (!window.confirm(`Tem certeza que deseja ${action} o usuário "${user.username}"?`)) {
      return;
    }
    
    try {
      const dataToSend = {
        is_active: !user.is_active
      };
      
      console.log('Dados sendo enviados:', dataToSend);
      
      const response = await userService.update(user.id, dataToSend);
      
      console.log('Response:', response);
      
      if (response.success) {
        toast.success(`Usuário ${user.is_active ? 'inativado' : 'ativado'} com sucesso!`);
        loadAdminUsers();
      } else {
        console.error('Erro ao atualizar:', response);
        
        // Mostrar detalhes do erro
        if (response.details) {
          Object.keys(response.details).forEach(field => {
            const errors = response.details[field];
            if (Array.isArray(errors)) {
              errors.forEach(error => {
                toast.error(`${field}: ${error}`);
              });
            }
          });
        } else {
          toast.error(response.error || `Erro ao ${action} usuário`);
        }
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      console.error('Response data:', err.response?.data);
      
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
        toast.error(err.response?.data?.error || `Erro ao ${action} usuário`);
      }
    }
  };

  const columns: Column[] = [
    {
      key: 'username',
      label: 'Usuário',
    },
    {
      key: 'full_name',
      label: 'Nome',
    },
    {
      key: 'email',
      label: 'E-mail',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (user) => (
        <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
          {user.is_active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (user) => (
        <div className="action-buttons">
          <button
            className="icon-button edit"
            onClick={() => handleOpenModal(user)}
            title="Editar"
          >
            <FiEdit2 />
          </button>
          <button
            className={`icon-button ${user.is_active ? 'delete' : 'view'}`}
            onClick={() => handleInactivate(user)}
            title={user.is_active ? 'Inativar' : 'Ativar'}
          >
            {user.is_active ? <FiTrash2 /> : <FiUserCheck />}
          </button>
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

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <div>
          <h1><FiUser /> Usuários Administradores</h1>
          <p className="admin-users-subtitle">
            Cadastre usuários administradores que poderão gerenciar empresas
          </p>
        </div>
        <Button
          variant="primary"
          size="large"
          onClick={() => handleOpenModal()}
        >
          <FiPlus /> Novo Admin
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="admin-users-content">
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          emptyMessage="Nenhum usuário administrador cadastrado"
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
                {editingUser ? 'Editar Usuário Admin' : 'Novo Usuário Admin'}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <Input
                    label="Usuário *"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingUser}
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
                    label="Nome *"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />

                  <Input
                    label="Sobrenome *"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />

                  <Input
                    label={editingUser ? 'Nova Senha (opcional)' : 'Senha *'}
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    placeholder={editingUser ? 'Deixe em branco para manter' : ''}
                  />

                  <Input
                    label={editingUser ? 'Confirmar Nova Senha' : 'Confirmar Senha *'}
                    type="password"
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleInputChange}
                    required={!editingUser || !!formData.password}
                  />

                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                      />
                      Usuário Ativo
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
                  <FiSave /> {editingUser ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

