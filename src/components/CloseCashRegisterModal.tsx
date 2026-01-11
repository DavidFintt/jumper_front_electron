import React, { useState, useEffect } from 'react';
import { cashRegisterService, userService } from '../services';
import type { CashRegister } from '../services/cashRegisterService';
import { toast } from 'react-toastify';
import { FiX, FiDollarSign, FiUser, FiAlertTriangle } from 'react-icons/fi';
import './CloseCashRegisterModal.css';

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_admin?: boolean;
  is_superuser?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cashRegister: CashRegister | null;
  onSuccess?: () => void;
}

interface PendingItems {
  open_orders_count: number;
  active_jumps_count: number;
}

const CloseCashRegisterModal: React.FC<Props> = ({ isOpen, onClose, cashRegister, onSuccess }) => {
  const [closingAmount, setClosingAmount] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para transferência
  const [showTransferSection, setShowTransferSection] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingItems | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen && cashRegister) {
      // Reset form
      setClosingAmount(cashRegister.expected_closing_amount || '');
      setClosingNotes('');
      setError(null);
      setShowTransferSection(false);
      setPendingItems(null);
      setSelectedUserId(null);
    }
  }, [isOpen, cashRegister]);

  useEffect(() => {
    if (showTransferSection && cashRegister) {
      loadUsers();
    }
  }, [showTransferSection, cashRegister]);

  const loadUsers = async () => {
    if (!cashRegister) return;
    
    setLoadingUsers(true);
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const selectedCompany = localStorage.getItem('selectedCompany');
      const companyId = selectedCompany ? parseInt(selectedCompany) : userData.company;
      
      const response = await userService.list({ company_id: companyId });
      
      if (response.success && response.data) {
        // Filtra usuários da mesma empresa, excluindo o usuário atual
        const currentUserId = userData.id;
        const filteredUsers = response.data.filter((user: User) => 
          user.id !== currentUserId
        );
        setUsers(filteredUsers);
      } else {
        toast.error('Erro ao carregar lista de usuários');
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      toast.error('Erro ao carregar lista de usuários');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cashRegister) return;
    
    if (!closingAmount || parseFloat(closingAmount) < 0) {
      setError('Valor de fechamento é obrigatório e deve ser positivo');
      return;
    }

    // Se há itens pendentes e nenhum usuário foi selecionado, mostra erro
    if (showTransferSection && !selectedUserId) {
      setError('Por favor, selecione um usuário para transferir as comandas e jumps ativos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const closeData: any = {
        closing_amount: parseFloat(closingAmount),
        closing_notes: closingNotes || undefined,
      };

      // Adiciona transfer_to_user_id se houver
      if (showTransferSection && selectedUserId) {
        closeData.transfer_to_user_id = selectedUserId;
      }

      const response = await cashRegisterService.close(cashRegister.id, closeData);

      if (response.success) {
        toast.success(response.message || 'Caixa fechado com sucesso!');
        
        // Imprime comprovante fiscal se disponível
        if (response.comprovante_fiscal) {
          imprimirComprovante(response.comprovante_fiscal);
        }
        
        onSuccess?.();
        onClose();
      } else {
        // Verifica se o erro é sobre itens pendentes
        if (response.error && response.error.includes('comandas ou jumps ativos')) {
          setShowTransferSection(true);
          setPendingItems(response.pending_items || null);
          setError(response.error);
        } else {
          setError(response.error || 'Erro ao fechar caixa');
          toast.error(response.error || 'Erro ao fechar caixa');
        }
      }
    } catch (err: any) {
      console.error('Erro ao fechar caixa:', err);
      const errorMsg = err.response?.data?.error || 'Erro ao fechar caixa';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const imprimirComprovante = async (comprovanteTexto: string) => {
    try {
      // Verifica se tem Electron API disponível
      if (window.electronAPI?.printFiscal) {
        const result = await window.electronAPI.printFiscal(comprovanteTexto);
        if (result.success) {
          console.log('Comprovante impresso com sucesso');
        } else {
          console.error('Erro ao imprimir comprovante:', result.error);
          // Fallback: mostrar em nova janela
          mostrarComprovanteEmNovaJanela(comprovanteTexto);
        }
      } else {
        // Fallback: mostrar em nova janela
        mostrarComprovanteEmNovaJanela(comprovanteTexto);
      }
    } catch (error) {
      console.error('Erro ao imprimir comprovante:', error);
      mostrarComprovanteEmNovaJanela(comprovanteTexto);
    }
  };

  const mostrarComprovanteEmNovaJanela = (texto: string) => {
    const novaJanela = window.open('', '_blank');
    if (novaJanela) {
      novaJanela.document.write(`
        <html>
          <head>
            <title>Comprovante de Fechamento de Caixa</title>
            <style>
              body { font-family: monospace; white-space: pre; padding: 20px; }
            </style>
          </head>
          <body>${texto}</body>
        </html>
      `);
      novaJanela.document.close();
      novaJanela.print();
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    }
    return user.email;
  };

  if (!isOpen || !cashRegister) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content close-cash-register-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><FiDollarSign /> Fechar Caixa</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Informações do Caixa */}
          <div className="cash-info-section">
            <h3>Informações do Caixa</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">ID:</span>
                <span className="value">#{cashRegister.id}</span>
              </div>
              <div className="info-item">
                <span className="label">Operador:</span>
                <span className="value">{cashRegister.user_name}</span>
              </div>
              <div className="info-item">
                <span className="label">Valor Inicial:</span>
                <span className="value">R$ {parseFloat(cashRegister.opening_amount).toFixed(2)}</span>
              </div>
              <div className="info-item">
                <span className="label">Total de Vendas:</span>
                <span className="value">R$ {parseFloat(cashRegister.total_sales).toFixed(2)}</span>
              </div>
              <div className="info-item">
                <span className="label">Valor Esperado:</span>
                <span className="value">R$ {parseFloat(cashRegister.expected_closing_amount).toFixed(2)}</span>
              </div>
              <div className="info-item">
                <span className="label">Total de Comandas:</span>
                <span className="value">{cashRegister.total_orders}</span>
              </div>
            </div>
          </div>

          {/* Formulário de Fechamento */}
          <form onSubmit={handleSubmit} className="close-form">
            <div className="form-group">
              <label htmlFor="closingAmount">Valor Final no Caixa *</label>
              <input
                id="closingAmount"
                type="number"
                step="0.01"
                min="0"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                placeholder="0.00"
                required
                disabled={loading}
              />
              <small>Valor em dinheiro que está no caixa ao fechar</small>
            </div>

            <div className="form-group">
              <label htmlFor="closingNotes">Observações</label>
              <textarea
                id="closingNotes"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Observações sobre o fechamento (opcional)"
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Seção de Transferência (aparece se houver itens pendentes) */}
            {showTransferSection && (
              <div className="transfer-section">
                <div className="alert alert-warning">
                  <FiAlertTriangle />
                  <div>
                    <strong>Atenção: Existem itens ativos neste caixa!</strong>
                    {pendingItems && (
                      <p>
                        {pendingItems.open_orders_count > 0 && (
                          <span>{pendingItems.open_orders_count} comanda(s) aberta(s)</span>
                        )}
                        {pendingItems.open_orders_count > 0 && pendingItems.active_jumps_count > 0 && ' e '}
                        {pendingItems.active_jumps_count > 0 && (
                          <span>{pendingItems.active_jumps_count} jump(s) em uso</span>
                        )}
                      </p>
                    )}
                    <p>Selecione um usuário para transferir estes itens antes de fechar o caixa.</p>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="transferUser">
                    <FiUser /> Transferir para o usuário *
                  </label>
                  {loadingUsers ? (
                    <div className="loading-users">Carregando usuários...</div>
                  ) : (
                    <select
                      id="transferUser"
                      value={selectedUserId || ''}
                      onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
                      required
                      disabled={loading}
                    >
                      <option value="">Selecione um usuário</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {getUserDisplayName(user)}
                          {user.is_admin && ' (Admin)'}
                          {user.is_superuser && ' (Superuser)'}
                        </option>
                      ))}
                    </select>
                  )}
                  <small>
                    As comandas e jumps ativos serão transferidos para o caixa deste usuário.
                    {users.length === 0 && ' Nenhum outro usuário disponível.'}
                  </small>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || (showTransferSection && !selectedUserId)}
              >
                {loading ? 'Fechando...' : 'Fechar Caixa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CloseCashRegisterModal;









