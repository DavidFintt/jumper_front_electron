import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../../../components/layout';
import { DataTable } from '../../../components/ui/DataTable';
import { Button, Card } from '../../../components/ui';
import { financialReportsService } from '../../../services';
import { toast } from 'react-toastify';
import { FiCalendar, FiDollarSign, FiUsers, FiTrendingUp, FiFilter, FiBarChart2, FiChevronsRight, FiX, FiHash, FiFileText, FiShoppingCart, FiUser, FiClock, FiDownload, FiAlertCircle } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './FinancialReports.css';

// --- Componente Modal de Vendas do Usuário ---
const UserSalesDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  companyId: number | undefined;
  startDate?: string;
  endDate?: string;
}> = ({ isOpen, onClose, userId, companyId, startDate, endDate }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (isOpen && userId && companyId) {
      fetchDetails();
    } else {
      setDetails(null);
    }
  }, [isOpen, userId, companyId, startDate, endDate]);

  const fetchDetails = async () => {
    if (!userId || !companyId) return;
    setLoading(true);
    try {
      const response = await financialReportsService.getUserSalesDetail(userId, {
        company_id: companyId,
        start_date: startDate,
        end_date: endDate
      });
      if (response.success) {
        setDetails(response.data);
      } else {
        toast.error(response.error || 'Erro ao carregar detalhes');
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-sales-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><FiUser /> Vendas do Operador</h2>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading-details">Carregando...</div>
          ) : details ? (
            <>
              <div className="modal-section">
                <h3><FiHash /> Informações do Operador</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label"><FiUser /> Nome</span>
                    <span className="value">{details.user_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Email</span>
                    <span className="value">{details.user_email}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Total de Comandas</span>
                    <span className="value">{details.total_orders}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Receita Total</span>
                    <span className="value" style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                      {formatCurrency(details.total_revenue)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3><FiShoppingCart /> Comandas ({details.orders?.length || 0})</h3>
                <div className="orders-list">
                  {details.orders?.length > 0 ? (
                    details.orders.map((order: any) => (
                      <div key={order.id} className="order-card-detailed">
                        <div className="order-header-detailed">
                          <div className="order-id">
                            <FiHash />
                            <span>Comanda #{order.order_number || order.id}</span>
                          </div>
                          <div className="order-total">
                            <span>{formatCurrency(order.total_amount)}</span>
                          </div>
                        </div>
                        <div className="order-info">
                          <div className="order-info-item">
                            <FiUser />
                            <span>{order.customer_name || order.dependente_name || 'Cliente não especificado'}</span>
                          </div>
                          <div className="order-info-item">
                            <FiClock />
                            <span>{formatDate(order.created_at)}</span>
                          </div>
                        </div>
                        {order.payment_details && order.payment_details.length > 0 && (
                          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 600, color: '#64748b', marginBottom: '4px', fontSize: '0.8rem' }}>FORMAS DE PAGAMENTO:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {order.payment_details.map((pd: any) => (
                                <div key={pd.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                  <span style={{ color: '#64748b' }}>{pd.payment_type_name}:</span>
                                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{formatCurrency(pd.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {order.items && order.items.length > 0 && (
                          <div className="order-items">
                            <div className="items-header">Itens da Comanda:</div>
                            <table className="items-table">
                              <thead>
                                <tr>
                                  <th>Descrição</th>
                                  <th>Tipo</th>
                                  <th>Qtd</th>
                                  <th>Valor Unit.</th>
                                  <th>Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item: any) => (
                                  <tr key={item.id}>
                                    <td>{item.description || item.product_name || '-'}</td>
                                    <td>
                                      <span className={`item-type-badge ${item.item_type}`}>
                                        {item.item_type === 'jump_time' ? 'Tempo Jump' : 
                                         item.item_type === 'additional_time' ? 'Tempo Extra' : 
                                         item.item_type === 'product' ? 'Produto' : 
                                         'Outro'}
                                      </span>
                                    </td>
                                    <td>{item.quantity}</td>
                                    <td>{formatCurrency(parseFloat(item.unit_price))}</td>
                                    <td>{formatCurrency(parseFloat(item.subtotal))}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        {/* Ajustes de Tempo Adicional */}
                        {order.time_adjustments && order.time_adjustments.length > 0 && (
                          <div className="time-adjustments-section" style={{
                            marginTop: '16px',
                            padding: '16px',
                            backgroundColor: '#fff3cd',
                            border: '2px solid #ffc107',
                            borderRadius: '8px'
                          }}>
                            <div style={{ 
                              fontSize: '14px', 
                              fontWeight: 700, 
                              color: '#856404',
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              ⏱️ Ajustes de Tempo Adicional
                            </div>
                            {order.time_adjustments.map((adjustment: any) => (
                              <div key={adjustment.id} style={{
                                padding: '12px',
                                backgroundColor: 'white',
                                border: '1px solid #ffc107',
                                borderRadius: '6px',
                                marginBottom: '8px'
                              }}>
                                <div style={{ fontSize: '13px', marginBottom: '6px' }}>
                                  <strong>Jump #{adjustment.jump_number}</strong> - {adjustment.customer_name}
                                </div>
                                <div style={{ fontSize: '13px', color: '#856404', marginBottom: '4px' }}>
                                  Tempo original: <strong>{adjustment.original_minutes} minutos</strong>
                                  {' → '}
                                  Tempo ajustado: <strong>{adjustment.adjusted_minutes} minutos</strong>
                                </div>
                                <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600, marginBottom: '6px' }}>
                                  Economia: {adjustment.difference} minutos
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                  <strong>Motivo:</strong> {adjustment.reason}
                                </div>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                  Ajustado por: {adjustment.adjusted_by_name} em {new Date(adjustment.adjusted_at).toLocaleString('pt-BR')}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="no-orders">Nenhuma comanda encontrada</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div>Nenhum dado disponível</div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Componente do Modal movido para dentro do arquivo ---
const CashRegisterDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cashRegisterId: string | null;
  companyId: number | undefined;
  onCashRegisterClosed?: () => void;
}> = ({ isOpen, onClose, cashRegisterId, companyId, onCashRegisterClosed }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
  const [closingAmount, setClosingAmount] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [pendingItems, setPendingItems] = useState<any>(null);
  const [selectedTransferUser, setSelectedTransferUser] = useState<any>(null);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && cashRegisterId && companyId) {
      fetchDetails();
      fetchWithdrawals();
      setExpandedOrders(new Set()); // Reseta ao abrir
    } else {
      setDetails(null);
      setWithdrawals([]);
    }
  }, [isOpen, cashRegisterId, companyId]);

  const fetchDetails = async () => {
    if (!cashRegisterId || !companyId) return;
    setLoading(true);
    try {
      const response = await financialReportsService.getCashRegisterDetail(cashRegisterId, companyId);
      if (response.success) {
        setDetails(response.data);
      } else {
        toast.error(response.error || 'Erro ao carregar detalhes');
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    if (!cashRegisterId) return;

    try {
      const response = await fetch(`http://localhost:8000/api/cash-register/${cashRegisterId}/withdrawals/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setWithdrawals(data.data);
      } else {
        setWithdrawals([]);
      }
    } catch (error) {
      console.error('Erro ao buscar sangrias:', error);
      setWithdrawals([]);
    }
  };

  const handleExportPDF = async () => {
    if (!cashRegisterId) return;

    try {
      toast.info('Gerando PDF... Aguarde!');
      
      const response = await fetch(`http://localhost:8000/api/cash-register/${cashRegisterId}/export-pdf/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_caixa_${cashRegisterId}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success('PDF gerado com sucesso!');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao gerar PDF' }));
        toast.error(errorData.error || 'Erro ao gerar PDF');
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const loadCompanyUsers = async () => {
    if (!companyId) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/users/?company_id=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setCompanyUsers(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleCloseCashRegister = async () => {
    if (!cashRegisterId || !closingAmount) {
      toast.error('Informe o valor final do caixa');
      return;
    }

    if (!details) return;

    // Verifica se há diferença no valor e se a observação é obrigatória
    const expectedAmount = parseFloat(details.expected_closing_amount);
    const actualAmount = parseFloat(closingAmount);
    const hasDifference = Math.abs(expectedAmount - actualAmount) > 0.01; // Tolerância de 1 centavo

    if (hasDifference && (!closingNotes || closingNotes.trim() === '')) {
      toast.error('Há diferença no valor do caixa. Por favor, informe o motivo nas observações.');
      return;
    }

    // Se há itens pendentes e nenhum usuário de transferência selecionado, impede o fechamento
    if (pendingItems && (pendingItems.open_orders_count > 0 || pendingItems.active_jumps_count > 0) && !selectedTransferUser) {
      toast.error('Selecione um usuário para transferir os itens pendentes ou finalize-os.');
      return;
    }

    setIsClosing(true);
    try {
      const response = await fetch(`http://localhost:8000/api/cash-register/${cashRegisterId}/close/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          closing_amount: parseFloat(closingAmount),
          closing_notes: closingNotes || '',
          transfer_to_user_id: selectedTransferUser?.id || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Caixa fechado com sucesso!');
        setShowCloseCashModal(false);
        setClosingAmount('');
        setClosingNotes('');
        setPendingItems(null);
        setSelectedTransferUser(null);
        
        // Recarregar detalhes
        await fetchDetails();
        
        // Notificar componente pai
        if (onCashRegisterClosed) {
          onCashRegisterClosed();
        }
      } else {
        // Se retornou pending_items, mostra no modal sem toast de erro
        if (data.pending_items) {
          setPendingItems(data.pending_items);
          // Carregar usuários para permitir transferência
          await loadCompanyUsers();
        } else {
          toast.error(data.error || 'Erro ao fechar caixa');
        }
      }
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      toast.error('Erro ao fechar caixa');
    } finally {
      setIsClosing(false);
    }
  };

  const openCloseCashModal = async () => {
    // Pre-preencher com o valor esperado
    if (details?.expected_closing_amount) {
      setClosingAmount(details.expected_closing_amount.toFixed(2));
    }
    
    // Resetar estados
    setPendingItems(null);
    setSelectedTransferUser(null);
    setClosingNotes('');
    
    // Carregar usuários da empresa
    await loadCompanyUsers();
    
    setShowCloseCashModal(true);
  };

  const toggleOrder = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cash-register-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><FiDollarSign /> Detalhes do Caixa</h2>
          <div className="modal-header-actions">
            {/* Botão Fechar Caixa - só aparece se o caixa estiver aberto */}
            {details && !details.closed_at && (
              <button 
                className="btn-modal-action green" 
                onClick={openCloseCashModal}
                title="Fechar Caixa"
              >
                <FiDollarSign /> Fechar Caixa
              </button>
            )}
            <button 
              className="btn-modal-action red" 
              onClick={handleExportPDF}
              title="Exportar PDF"
            >
              <FiDownload /> Exportar PDF
            </button>
            <button className="modal-close" onClick={onClose}><FiX /></button>
          </div>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading-details">Carregando...</div>
          ) : details ? (
            <>
              <div className="modal-section">
                <h3><FiHash /> Informações Gerais</h3>
                <div className="info-grid">
                  <div className="info-item"><span className="label">Nº do Caixa</span><span className="value">#{details.register_number || details.id}</span></div>
                  <div className="info-item"><span className="label"><FiUser /> Operador</span><span className="value">{details.user_name}</span></div>
                  <div className="info-item"><span className="label"><FiClock /> Abertura</span><span className="value">{formatDate(details.opened_at)}</span></div>
                  <div className="info-item"><span className="label"><FiClock /> Fechamento</span><span className="value">{formatDate(details.closed_at)}</span></div>
                </div>
              </div>
              <div className="modal-section">
                <h3><FiTrendingUp /> Resumo Financeiro</h3>
                <div className="values-grid">
                  <div className="value-card"><span className="label">Valor Inicial</span><span className="value neutral">{formatCurrency(details.opening_amount)}</span></div>
                  <div className="value-card"><span className="label">Vendas em Dinheiro</span><span className="value neutral">{formatCurrency(details.total_sales)}</span></div>
                  <div className="value-card"><span className="label">Valor Esperado</span><span className="value neutral">{formatCurrency(details.expected_closing_amount)}</span></div>
                  <div className="value-card"><span className="label">Valor Final</span><span className="value neutral">{formatCurrency(details.closing_amount)}</span></div>
                  <div className="value-card"><span className="label">Diferença</span><span className={`value ${details.difference > 0 ? 'positive' : details.difference < 0 ? 'negative' : 'neutral'}`}>{formatCurrency(details.difference)}</span></div>
                </div>
                
                {details.payment_breakdown && Object.keys(details.payment_breakdown).length > 0 && (
                  <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#64748b', fontWeight: 600 }}>FORMAS DE PAGAMENTO</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                      {Object.entries(details.payment_breakdown).map(([type, value]: [string, any]) => (
                        value > 0 && (
                          <div key={type} style={{ padding: '8px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>{type}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{formatCurrency(value)}</div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Seção de Sangrias */}
              {withdrawals.length > 0 && (
                <div className="modal-section withdrawals-section">
                  <h3 className="modal-section-title">
                    <FiDollarSign /> Sangrias Realizadas ({withdrawals.length})
                  </h3>
                  <div className="withdrawals-list">
                    {withdrawals.map((withdrawal: any) => (
                      <div key={withdrawal.id} className="withdrawal-item">
                        <div className="withdrawal-header">
                          <span className="withdrawal-amount">{formatCurrency(parseFloat(withdrawal.amount))}</span>
                          <span className="withdrawal-date">{formatDate(withdrawal.performed_at)}</span>
                        </div>
                        <div className="withdrawal-performer">
                          <FiUser /> {withdrawal.performed_by_name}
                        </div>
                        {withdrawal.notes && (
                          <div className="withdrawal-notes">
                            <strong>Motivo:</strong> {withdrawal.notes}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="withdrawal-total">
                      <span>Total de Sangrias:</span>
                      <span>{formatCurrency(withdrawals.reduce((sum: number, w: any) => sum + parseFloat(w.amount), 0))}</span>
                    </div>
                  </div>
                </div>
              )}

              {(details.opening_notes || details.closing_notes) && (
                <div className="modal-section">
                  <h3><FiFileText /> Observações</h3>
                  {details.opening_notes && <div className="notes-item"><span className="label">Abertura:</span><span className="value">{details.opening_notes}</span></div>}
                  {details.closing_notes && <div className="notes-item"><span className="label">Fechamento:</span><span className="value">{details.closing_notes}</span></div>}
                </div>
              )}
              <div className="modal-section">
                <h3><FiShoppingCart /> Comandas ({details.orders?.length || 0})</h3>
                <div className="orders-list">
                  {details.orders?.length > 0 ? (
                    details.orders.map((order: any) => {
                      const isExpanded = expandedOrders.has(order.id);
                      return (
                        <div key={order.id} className="order-card">
                          <div 
                            className="order-header-clickable" 
                            onClick={() => toggleOrder(order.id)}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                          >
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              transition: 'transform 0.2s',
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                            }}>
                              <FiChevronsRight size={18} />
                            </div>
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span className="order-id" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                  Comanda #{order.order_number || order.id}
                                </span>
                                <span className="order-customer" style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                  {order.dependente_name ? `${order.dependente_name} (Resp: ${order.customer_name})` : order.customer_name}
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <strong className="order-total" style={{ fontSize: '1.1rem', color: '#1f2937', fontWeight: 700 }}>
                                  {formatCurrency(order.total_amount)}
                                </strong>
                                <span className="order-date" style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                  {formatDate(order.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="order-items-expanded" style={{ 
                              marginTop: '12px', 
                              paddingTop: '12px', 
                              borderTop: '1px solid #e5e7eb',
                              animation: 'slideDown 0.2s ease-out'
                            }}>
                              <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem', color: '#374151' }}>
                                Itens da Comanda:
                              </div>
                              <ul className="order-items-list" style={{ 
                                listStyle: 'none', 
                                padding: 0, 
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}>
                                {order.items.map((item: any) => (
                                  <li key={item.id} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '6px',
                                    fontSize: '0.9rem'
                                  }}>
                                    <span style={{ color: '#374151' }}>
                                      <strong>{item.quantity}x</strong> {item.description || item.product_name || 'Produto'}
                                    </span>
                                    <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                                      {formatCurrency(item.subtotal)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              
                              {/* Formas de Pagamento */}
                              {order.payment_details && order.payment_details.length > 0 && (
                                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                                  <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                                    FORMAS DE PAGAMENTO:
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {order.payment_details.map((pd: any) => (
                                      <div key={pd.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                                        <span style={{ color: '#64748b', fontWeight: 500 }}>{pd.payment_type_name}:</span>
                                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{formatCurrency(pd.amount)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Ajustes de Tempo Adicional */}
                              {order.time_adjustments && order.time_adjustments.length > 0 && (
                                <div className="time-adjustments-section-report">
                                  <div className="time-adjustments-section-report-header">
                                    ⏱️ Ajustes de Tempo Adicional ({order.time_adjustments.length})
                                  </div>
                                  <div className="time-adjustments-list">
                                    {order.time_adjustments.map((adjustment: any) => (
                                      <div key={adjustment.id} className="time-adjustment-item-report">
                                        <div className="adjustment-main">
                                          <span className="adjustment-jump">Jump #{adjustment.jump_number} - {adjustment.customer_name}</span>
                                          <span className="adjustment-change">
                                            {adjustment.original_minutes} → {adjustment.adjusted_minutes} min
                                            <span className={`adjustment-diff ${adjustment.difference > 0 ? 'positive' : 'negative'}`}>
                                              ({adjustment.difference > 0 ? '-' : '+'}{Math.abs(adjustment.difference)} min)
                                            </span>
                                          </span>
                                        </div>
                                        <div className="adjustment-reason">
                                          {adjustment.reason}
                                        </div>
                                        <div className="adjustment-meta">
                                          {adjustment.adjusted_by_name} • {new Date(adjustment.adjusted_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : <p className="no-orders">Nenhuma comanda encontrada.</p>}
                </div>
              </div>
            </>
          ) : <div className="error-details">Não foi possível carregar os detalhes.</div>}
        </div>
      </div>

      {/* Modal de Fechar Caixa */}
      {showCloseCashModal && details && (
        <div className="modal-overlay" onClick={() => setShowCloseCashModal(false)} style={{ zIndex: 10000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', backgroundColor: 'white' }}>
            <div className="modal-header">
              <h2><FiDollarSign /> Fechar Caixa</h2>
              <button className="modal-close" onClick={() => setShowCloseCashModal(false)}><FiX /></button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              {/* Resumo Financeiro */}
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '20px'
              }}>
                <h4 style={{ marginBottom: '10px', fontSize: '0.95rem', fontWeight: '600' }}>Resumo do Caixa:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Valor Inicial:</span>
                    <strong>{formatCurrency(details.opening_amount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Vendas Totais:</span>
                    <strong>{formatCurrency(details.total_sales)}</strong>
                  </div>
                  {withdrawals.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                      <span>Sangrias:</span>
                      <strong>- {formatCurrency(withdrawals.reduce((sum: number, w: any) => sum + parseFloat(w.amount), 0))}</strong>
                    </div>
                  )}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    paddingTop: '8px', 
                    borderTop: '2px solid #ddd',
                    marginTop: '5px'
                  }}>
                    <span>Valor Esperado:</span>
                    <strong style={{ fontSize: '18px', color: 'var(--primary-color)' }}>
                      {formatCurrency(details.expected_closing_amount)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Valor Final do Caixa */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>
                  Valor Final do Caixa *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                  autoFocus
                />
                {closingAmount && (() => {
                  const expectedAmount = parseFloat(details.expected_closing_amount);
                  const actualAmount = parseFloat(closingAmount);
                  const difference = actualAmount - expectedAmount;
                  const hasDifference = Math.abs(difference) > 0.01;
                  
                  return (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px',
                      borderRadius: '6px',
                      backgroundColor: !hasDifference 
                        ? '#d4edda'
                        : difference > 0 
                          ? '#d4edda' 
                          : '#fff3cd',
                      color: !hasDifference
                        ? '#155724'
                        : difference > 0
                          ? '#155724'
                          : '#856404'
                    }}>
                      <strong>Diferença: </strong>
                      R$ {difference.toFixed(2)}
                      {hasDifference && (
                        <div style={{ marginTop: '5px', fontSize: '12px', fontStyle: 'italic' }}>
                          ⚠️ Observação será obrigatória
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Observações */}
              <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>
                  Observações sobre o Fechamento
                  {closingAmount && Math.abs(parseFloat(closingAmount) - parseFloat(details.expected_closing_amount)) > 0.01 && (
                    <span style={{ color: 'red', marginLeft: '5px' }}>*</span>
                  )}
                </label>
                <textarea
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder={
                    closingAmount && Math.abs(parseFloat(closingAmount) - parseFloat(details.expected_closing_amount)) > 0.01
                      ? "Obrigatório: explique o motivo da diferença no valor"
                      : "Observações sobre o fechamento do caixa (opcional)"
                  }
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: closingAmount && Math.abs(parseFloat(closingAmount) - parseFloat(details.expected_closing_amount)) > 0.01
                      ? '2px solid #ffc107'
                      : '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Itens Pendentes */}
              {pendingItems && (pendingItems.open_orders_count > 0 || pendingItems.active_jumps_count > 0) && (
                <div style={{ 
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  color: '#856404',
                  padding: '15px',
                  borderRadius: '8px',
                  marginTop: '20px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ marginBottom: '10px', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                    <FiAlertCircle style={{ marginRight: '8px' }} />
                    Itens Pendentes
                  </h3>
                  <p>Existem itens abertos neste caixa que precisam ser transferidos antes do fechamento:</p>
                  {pendingItems.open_orders_count > 0 && (
                    <p>- {pendingItems.open_orders_count} Comanda(s) Aberta(s)</p>
                  )}
                  {pendingItems.active_jumps_count > 0 && (
                    <p>- {pendingItems.active_jumps_count} Jump(s) Ativo(s)</p>
                  )}
                  <div style={{ marginTop: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Transferir para outro Usuário:
                    </label>
                    <select
                      value={selectedTransferUser?.id || ''}
                      onChange={(e) => {
                        const userId = parseInt(e.target.value);
                        const user = companyUsers.find(u => u.id === userId);
                        setSelectedTransferUser(user || null);
                      }}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
                    >
                      <option value="">Selecione um usuário para transferir</option>
                      {companyUsers.map((user: any) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                <button
                  onClick={() => setShowCloseCashModal(false)}
                  disabled={isClosing}
                  className="btn-modal-action gray"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCloseCashRegister}
                  disabled={isClosing || !closingAmount || !!(pendingItems && (pendingItems.open_orders_count > 0 || pendingItems.active_jumps_count > 0) && !selectedTransferUser)}
                  className="btn-modal-action green"
                >
                  {isClosing ? 'Fechando...' : pendingItems && (pendingItems.open_orders_count > 0 || pendingItems.active_jumps_count > 0) && selectedTransferUser ? 'Fechar e Transferir' : 'Fechar Caixa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// --- Fim do Componente do Modal ---

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const FinancialReports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<number | undefined>();
  
  // Função para obter o dia de hoje
  const getTodayRange = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    return {
      start: today,
      end: today
    };
  };
  
  const todayRange = getTodayRange();
  
  // Filtros (começa com hoje por padrão)
  const [startDate, setStartDate] = useState(todayRange.start);
  const [endDate, setEndDate] = useState(todayRange.end);
  const [selectedOperator, setSelectedOperator] = useState<string>('all'); // Novo filtro de operador
  
  // Dados
  const [salesByCashRegister, setSalesByCashRegister] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); // Lista de operadores para o filtro

  // State do Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCashRegisterId, setSelectedCashRegisterId] = useState<string | null>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const selectedCompany = localStorage.getItem('selectedCompany');
    const companyId = selectedCompany ? parseInt(selectedCompany) : userData.company;
    
    console.log('🏢 CompanyId detectado:', companyId);
    console.log('👤 UserData:', userData);
    console.log('🏢 SelectedCompany:', selectedCompany);
    
    if (companyId) {
      setCompanyId(companyId);
      loadAllData({ companyId, startDate: todayRange.start, endDate: todayRange.end });
    }
  }, []);

  const loadAllData = async (params: { companyId: number, startDate?: string, endDate?: string }) => {
    setLoading(true);
    try {
      const { companyId, startDate, endDate } = params;
      const requestParams = {
        company_id: companyId,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      console.log('🔄 Carregando caixas:', requestParams);

      // Carrega apenas os caixas
      const cashRegRes = await financialReportsService.getSalesByCashRegister(requestParams);

      if (cashRegRes.success) {
        console.log('✅ Caixas carregados:', cashRegRes.data);
        setSalesByCashRegister(cashRegRes.data || []);
        
        // Extrai lista única de operadores para o filtro
        const users = cashRegRes.data?.reduce((acc: any[], cr: any) => {
          if (!acc.find((u: any) => u.email === cr.user)) {
            acc.push({
              email: cr.user,
              name: cr.user_name
            });
          }
          return acc;
        }, []) || [];
        setAllUsers(users);
        console.log('👥 Operadores encontrados:', users);
      } else {
        console.error('❌ Erro ao carregar caixas:', cashRegRes.error);
        toast.error(cashRegRes.error || "Erro ao carregar caixas");
      }

    } catch (error) {
      toast.error("Ocorreu um erro ao carregar os caixas.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    if (companyId) {
      loadAllData({ companyId, startDate, endDate });
    }
  };

  const handleClearFilter = () => {
    const today = getTodayRange();
    setStartDate(today.start);
    setEndDate(today.end);
    setSelectedOperator('all');
    if (companyId) {
      loadAllData({ companyId, startDate: today.start, endDate: today.end });
    }
  };

  const handleOpenDetailModal = (id: number) => {
    setSelectedCashRegisterId(id);
    setIsDetailModalOpen(true);
  };
  
  // Filtra os caixas pelo operador selecionado
  const filteredCashRegisters = useMemo(() => {
    if (selectedOperator === 'all') {
      return salesByCashRegister;
    }
    return salesByCashRegister.filter((cr: any) => cr.user === selectedOperator);
  }, [salesByCashRegister, selectedOperator]);

  // Função helper para formatar valores monetários
  const formatMoney = (value: number | string) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = typeof payload[0].value === 'number' ? payload[0].value : parseFloat(payload[0].value) || 0;
      return (
        <div className="custom-tooltip">
          <p className="label">{`Período: ${label}`}</p>
          <p className="intro">{`Receita: R$ ${value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="reports-page">
        <header className="reports-page-header">
          <h1><FiBarChart2 /> Relatórios Financeiros</h1>
          <p>Análise de vendas, caixas e desempenho da sua operação.</p>
        </header>

        <Card className="filters-card-new">
          <div className="filter-group">
            <label><FiCalendar /> Período</label>
            <div className="date-inputs">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <FiChevronsRight />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="filter-group">
            <label><FiUser /> Operador</label>
            <select value={selectedOperator} onChange={e => setSelectedOperator(e.target.value)}>
              <option value="all">Todos os Operadores</option>
              {allUsers.map((user: any) => (
                <option key={user.email} value={user.email}>{user.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <Button variant="primary" onClick={handleFilter}><FiFilter /> Filtrar</Button>
            <Button variant="outline" onClick={handleClearFilter}>Limpar</Button>
          </div>
        </Card>

        <div className="reports-new-content">
          {loading ? (
            <div className="loading-state">Carregando caixas...</div>
          ) : (
            <Card className="operations-card">
              <h3><FiClock /> Controle de Caixas</h3>
              <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                Clique em qualquer caixa para ver todos os detalhes e itens vendidos
              </p>
              {filteredCashRegisters.length > 0 ? (
                (() => {
                  // Agrupar caixas por operador
                  const cashRegistersByUser = filteredCashRegisters.reduce((acc: any, cr: any) => {
                    const userName = cr.user_name;
                    if (!acc[userName]) {
                      acc[userName] = [];
                    }
                    acc[userName].push(cr);
                    return acc;
                  }, {});

                  return (
                    <div className="cash-registers-by-operator">
                      {Object.entries(cashRegistersByUser).map(([userName, registers]: [string, any]) => (
                        <div key={userName} className="operator-cash-section">
                          <div className="operator-cash-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <FiUser size={20} style={{ color: 'var(--primary-color)' }} />
                              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{userName}</h4>
                            </div>
                            <div className="operator-cash-summary">
                              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                {registers.length} caixa{registers.length > 1 ? 's' : ''} • 
                                Total: <strong style={{ color: 'var(--primary-color)' }}>
                                  {formatMoney(registers.reduce((sum: number, cr: any) => sum + parseFloat(cr.total_sales || 0), 0))}
                                </strong>
                              </span>
                            </div>
                          </div>
                          
                          <div className="cash-registers-grid">
                            {registers.map((cr: any) => (
                              <div key={cr.id} className="cash-register-card" onClick={() => handleOpenDetailModal(cr.id)}>
                                <div className="cash-card-header">
                                  <div className="cash-id">
                                    <FiHash size={14} />
                                    <span>Caixa #{cr.register_number || cr.id}</span>
                                  </div>
                                  <span className={`cash-status ${cr.status === 'closed' ? 'closed' : 'open'}`}>
                                    {cr.status === 'closed' ? '✓ Fechado' : '● Aberto'}
                                  </span>
                                </div>
                                
                                <div className="cash-card-body">
                                  <div className="cash-info-row">
                                    <span className="cash-label">Abertura:</span>
                                    <span className="cash-value">{new Date(cr.opened_at).toLocaleString('pt-BR')}</span>
                                  </div>
                                  {cr.closed_at && (
                                    <div className="cash-info-row">
                                      <span className="cash-label">Fechamento:</span>
                                      <span className="cash-value">{new Date(cr.closed_at).toLocaleString('pt-BR')}</span>
                                    </div>
                                  )}
                                  <div className="cash-info-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
                                    <span className="cash-label">Comandas:</span>
                                    <span className="cash-value">{cr.total_orders || 0}</span>
                                  </div>
                                  <div className="cash-info-row">
                                    <span className="cash-label">Vendas:</span>
                                    <span className="cash-value" style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '1.1rem' }}>
                                      {formatMoney(cr.total_sales)}
                                    </span>
                                  </div>
                                  {cr.payment_breakdown && Object.keys(cr.payment_breakdown).length > 0 && (
                                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
                                      <span className="cash-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: '#6b7280' }}>Formas de Pagamento:</span>
                                      {Object.entries(cr.payment_breakdown).map(([type, value]: [string, any]) => (
                                        value > 0 && (
                                          <div key={type} className="cash-info-row" style={{ fontSize: '0.85rem' }}>
                                            <span className="cash-label" style={{ textTransform: 'capitalize' }}>{type}:</span>
                                            <span className="cash-value">{formatMoney(value)}</span>
                                          </div>
                                        )
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="cash-card-footer">
                                  <span>Ver todos os itens</span>
                                  <FiChevronsRight size={16} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div className="no-data-message">
                  <FiClock size={48} style={{ color: '#d1d5db' }} />
                  <p>Nenhum caixa encontrado</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                    {selectedOperator !== 'all' 
                      ? 'Nenhum caixa encontrado para este operador no período selecionado'
                      : 'Ajuste os filtros de data ou aguarde a abertura de um caixa'
                    }
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
      <CashRegisterDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        cashRegisterId={selectedCashRegisterId}
        companyId={companyId}
        onCashRegisterClosed={() => {
          // Recarregar lista de caixas após fechar um caixa
          if (companyId) {
            loadAllData({ companyId, startDate, endDate });
          }
        }}
      />
    </Layout>
  );
};

export default FinancialReports;
