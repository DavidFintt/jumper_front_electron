/// <reference types="../../../global" />
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../components/layout';
import { Button, Alert } from '../../../components/ui';
import { FiPlus, FiClock, FiAlertCircle, FiCheckCircle, FiX, FiSave, FiActivity, FiCalendar, FiCheck, FiCheckSquare, FiBarChart2, FiPause, FiPlay, FiSearch, FiFilter, FiTrendingUp, FiAlertTriangle, FiThumbsUp, FiMoon, FiShoppingCart, FiTrash2, FiMinus, FiPlusCircle, FiDollarSign, FiChevronRight, FiChevronDown, FiList, FiUser, FiPrinter, FiUserX, FiUsers, FiChevronUp, FiPackage, FiMessageSquare, FiMaximize2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Dashboard.css';
import { jumpUsageService, orderService, cashRegisterService, companyPrinterService, userService, equipmentUnitService } from '../../../services';
import { customerService } from '../../../services';
import { productService } from '../../../services';
import { api } from '../../../services/api';
import type { Product, Order, CashRegister, OrderItem, JumpUsage, User, EquipmentUnit } from '../../../services/types';

interface CustomerOption {
  id: string;
  nome: string;
  cpf?: string;
  pcd?: boolean;
  tipo: 'Cliente' | 'Dependente';
  customerId?: string;
  dependenteId?: string;
  aprovacao_responsavel?: boolean;
}

interface QuickDependenteForm {
  nome: string;
  data_nascimento: string;
  pcd: boolean;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeJumps, setActiveJumps] = useState<JumpUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Cash Register states
  const [currentCashRegister, setCurrentCashRegister] = useState<CashRegister | null>(null);
  const [showOpenCashModal, setShowOpenCashModal] = useState(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [openingNotes, setOpeningNotes] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');
  const [cashWithdrawals, setCashWithdrawals] = useState<any[]>([]);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [selectedTransferUser, setSelectedTransferUser] = useState<User | null>(null);
  const [pendingItems, setPendingItems] = useState<{ open_orders_count: number; active_jumps_count: number } | null>(null);

  // Printer configuration
  const [fiscalPrinterName, setFiscalPrinterName] = useState<string | null>(null);
  const [a4PrinterName, setA4PrinterName] = useState<string | null>(null);

  // Helper para formatar horas contratadas de forma natural
  const formatContractedHours = (hours: number): string => {
    // Se for menos de 1 hora, exibe em minutos
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} minutos`;
    } else if (hours === 1) {
      return '1 hora';
    } else if (hours % 1 === 0) {
      return `${hours} horas`;
    } else {
      // Para valores como 1.5, 2.5, etc
      const wholeHours = Math.floor(hours);
      const minutes = Math.round((hours - wholeHours) * 60);
      return `${wholeHours}h ${minutes}min`;
    }
  };


  const [currentTime, setCurrentTime] = useState(new Date());
  const [showJumpModal, setShowJumpModal] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  
  // Nova estrutura para clientes com dependentes
  interface CustomerWithDependents {
    customer: CustomerOption;
    dependents: CustomerOption[];
  }
  const [customersWithDependents, setCustomersWithDependents] = useState<CustomerWithDependents[]>([]);
  
  const [selectedCustomerOption, setSelectedCustomerOption] = useState<CustomerOption | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newlyCreatedCustomerId, setNewlyCreatedCustomerId] = useState<string | null>(null);
  
  // Estados para múltiplos clientes no mesmo jump
  interface SelectedCustomerWithProduct {
    customer: CustomerOption;
    product: Product | null;
  }
  const [selectedCustomers, setSelectedCustomers] = useState<SelectedCustomerWithProduct[]>([]);
  const [expandedCustomers, setExpandedCustomers] = useState<string[]>([]);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [selectedJump, setSelectedJump] = useState<JumpUsage | null>(null);
  const [additionalHours, setAdditionalHours] = useState<number>(0);
  const [jumpSearchTerm, setJumpSearchTerm] = useState('');
  const [comandaSearchTerm, setComandaSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'warning' | 'expired' | 'paused'>('all');
  
  // Estados para abas do dashboard
  const [activeTab, setActiveTab] = useState<'jumps' | 'comandas'>('jumps');
  
  // Estados para Order (Pedido/Comanda)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersDateFrom, setOrdersDateFrom] = useState<string>('');
  const [ordersDateTo, setOrdersDateTo] = useState<string>('');
  const [ordersShowClosed, setOrdersShowClosed] = useState<boolean>(false);
  const [consumableProducts, setConsumableProducts] = useState<Product[]>([]);
  const [selectedConsumable, setSelectedConsumable] = useState<Product | null>(null);
  const [consumableQuantity, setConsumableQuantity] = useState<number>(1);
  
  // Equipment states
  const [equipmentProducts, setEquipmentProducts] = useState<Product[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Product | null>(null);
  const [availableUnits, setAvailableUnits] = useState<EquipmentUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<EquipmentUnit | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(false);
  
  // Memo para filtrar comandas
  const filteredOrders = useMemo(() => {
    if (!comandaSearchTerm) {
      return orders;
    }
    const searchTerm = comandaSearchTerm.toLowerCase();
    return orders.filter(order => {
      const customerName = order.customer_name?.toLowerCase() || '';
      const customerCpf = order.customer_cpf?.replace(/[.-]/g, '') || '';
      const searchCpf = searchTerm.replace(/[.-]/g, '');

      return customerName.includes(searchTerm) || (searchCpf && customerCpf.includes(searchCpf));
    });
  }, [orders, comandaSearchTerm]);
  
  // Estados para modal de comanda
  const [showComandaModal, setShowComandaModal] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<Order | null>(null);
  const [comandaModalView, setComandaModalView] = useState<'details' | 'confirm_close'>('details');
  const [closePreview, setClosePreview] = useState<null | { additional_items: any[]; additional_total: string; total_with_additional: string }>(null);
  // Estados locais do modal para evitar substituir o objeto selectedComanda a cada alteração
  const [comandaItems, setComandaItems] = useState<OrderItem[]>([] as any);
  const [comandaTotal, setComandaTotal] = useState<string>('0');
  const [comandaLoading, setComandaLoading] = useState<boolean>(false);
  const [additionalTimeAdjustments, setAdditionalTimeAdjustments] = useState<{[jumpId: string]: {newQuantity: number, reason: string}}>({});
  const [showAdjustTimeModal, setShowAdjustTimeModal] = useState(false);
  const [adjustingTimeItem, setAdjustingTimeItem] = useState<any>(null);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  
  const [paymentTypes, setPaymentTypes] = useState<any[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<{payment_type: string, amount: string}[]>([]);
  const [paymentSectionExpanded, setPaymentSectionExpanded] = useState(false);
  const [summarySectionExpanded, setSummarySectionExpanded] = useState(true);
  
  // Estados para modal de cadastro rápido de cliente
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [quickCustomerProduct, setQuickCustomerProduct] = useState<Product | null>(null);
  const [quickCustomerWillUseTitular, setQuickCustomerWillUseTitular] = useState(true);
  const [quickCustomerWillUseDependentes, setQuickCustomerWillUseDependentes] = useState<number[]>([]);
  const [quickCustomerTitularProduct, setQuickCustomerTitularProduct] = useState<Product | null>(null);
  
  // Estados para modais de confirmação
  const [showConfirmAddTime, setShowConfirmAddTime] = useState(false);
  const [pendingTimeProduct, setPendingTimeProduct] = useState<Product | null>(null);
  const [showConfirmFinishJump, setShowConfirmFinishJump] = useState(false);
  const [quickCustomerDependentesProducts, setQuickCustomerDependentesProducts] = useState<{[key: string]: Product | null}>({});
  const [quickCustomerData, setQuickCustomerData] = useState({
    nome: '',
    telefone: '',
    cpf: '',
    email: '',
    data_nascimento: '',
    estrangeiro: false,
    pcd: false,
  });
  const [quickCustomerDependentes, setQuickCustomerDependentes] = useState<QuickDependenteForm[]>([]);

  // Estados para alerta de jump expirado
  const [expiredJumpAlert, setExpiredJumpAlert] = useState<JumpUsage | null>(null);
  
  // Modal fullscreen de jumps
  const [showJumpsExpandModal, setShowJumpsExpandModal] = useState(false);
  const [modalFinishedJumps, setModalFinishedJumps] = useState<JumpUsage[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [showExpiredJumpAlert, setShowExpiredJumpAlert] = useState(false);
  const [notifiedExpiredJumps, setNotifiedExpiredJumps] = useState<Set<string>>(new Set());
  const [recentlyUpdatedJumps, setRecentlyUpdatedJumps] = useState<Map<string, number>>(new Map());

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const selectedCompany = localStorage.getItem('selectedCompany');
  const companyId = selectedCompany ? parseInt(selectedCompany) : userData.company;

  // Helper para retornar o nome correto (dependente ou cliente)
  const getDisplayName = (jump: JumpUsage): string => {
    return jump.dependente_name || jump.customer_name || 'Cliente não identificado';
  };

  // Carregar caixa atual
  const loadCurrentCashRegister = async () => {
    try {
      if (!companyId) {
        console.warn('No companyId available, skipping cash register load');
        setCurrentCashRegister(null);
        return;
      }
      
      const response = await cashRegisterService.getCurrent(companyId);
      if (response.success) {
        setCurrentCashRegister(response.data);
      } else {
        setCurrentCashRegister(null);
      }
    } catch (err: any) {
      console.error('Error loading cash register:', err);
      setCurrentCashRegister(null);
    }
  };

  // Carregar impressoras configuradas
  const loadFiscalPrinter = async () => {
    try {
      if (!companyId) return;
      
      const response = await companyPrinterService.getFiscalPrinterName(companyId);
      if (response.success && response.fiscal_printer) {
        setFiscalPrinterName(response.fiscal_printer);
      } else {
        setFiscalPrinterName(null);
      }
    } catch (err: any) {
      console.error('Error loading fiscal printer:', err);
      setFiscalPrinterName(null);
    }
  };

  const loadA4Printer = async () => {
    try {
      if (!companyId) return;
      
      const response = await companyPrinterService.getA4PrinterName(companyId);
      if (response.success && response.a4_printer) {
        setA4PrinterName(response.a4_printer);
      } else {
        setA4PrinterName(null);
      }
    } catch (err: any) {
      console.error('Error loading A4 printer:', err);
      setA4PrinterName(null);
    }
  };

  // Função para detectar jumps que acabaram de expirar (não foram notificados ainda)
  const checkForNewlyExpiredJumps = () => {
    // Só verifica se o caixa está aberto
    if (!currentCashRegister || currentCashRegister.status !== 'open') {
      return;
    }

    const now = new Date();
    const newlyExpiredJumps: JumpUsage[] = [];
    
    for (const jump of activeJumps) {
      if (jump.finished || jump.is_paused) continue;
      if (notifiedExpiredJumps.has(jump.id)) continue; // Já notificou este jump
      
      // Só notifica se o jump pertence ao usuário atual (caixa)
      if (jump.user_id !== userData.id) continue;
      
      // Não notifica se o jump foi recentemente atualizado (período de graça de 60 segundos)
      const lastUpdate = recentlyUpdatedJumps.get(jump.id);
      if (lastUpdate && (Date.now() - lastUpdate) < 60000) {
        continue; // Ignora por 60 segundos após atualização
      }
      
      // Verifica se o jump acabou de expirar
      let hasExpired = false;
      
      // Se tem extensão de tempo, usar esse prazo
      if (jump.time_extension_at) {
        const extensionTime = new Date(jump.time_extension_at);
        hasExpired = now >= extensionTime;
      } else {
        // Senão, usar o tempo contratado original
        const start = new Date(jump.start_time);
        const contractedMillis = jump.contracted_hours * 60 * 60 * 1000;
        const end = new Date(start.getTime() + contractedMillis);
        hasExpired = now >= end;
      }
      
      if (hasExpired) {
        newlyExpiredJumps.push(jump);
        setNotifiedExpiredJumps(prev => new Set(prev).add(jump.id));
      }
    }
    
    // Se houver jumps expirados, mostra o alerta (apenas o primeiro da lista)
    if (newlyExpiredJumps.length > 0) {
      setExpiredJumpAlert(newlyExpiredJumps[0]);
      setShowExpiredJumpAlert(true);
    }
  };

  // Função para enviar mensagem no WhatsApp
  const sendWhatsAppNotification = (jump: JumpUsage) => {
    // SEMPRE usa o nome do RESPONSÁVEL (titular), nunca do dependente
    const responsibleName = jump.customer_name;
    const phone = jump.customer_telefone;
    
    if (!phone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }
    
    // Remove caracteres não numéricos do telefone
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Verifica se há outros jumps expirados do MESMO responsável (não notificados)
    const sameResponsibleExpiredJumps = activeJumps.filter(j => {
      if (j.finished || j.is_paused) return false;
      if (!notifiedExpiredJumps.has(j.id)) return false; // Só pega os que acabaram de expirar
      
      // Mesmo responsável (customer_id)
      return j.customer === jump.customer;
    });
    
    // Monta a mensagem
    let message = `Olá ${responsibleName}! `;
    
    if (sameResponsibleExpiredJumps.length > 1) {
      // Múltiplos jumps do mesmo responsável
      const jumpNumbers = sameResponsibleExpiredJumps.map(j => `#${j.id}`).join(', ');
      
      // Se forem dependentes, menciona os nomes
      const dependentNames = sameResponsibleExpiredJumps
        .filter(j => j.dependente_name)
        .map(j => j.dependente_name)
        .filter((name, index, self) => self.indexOf(name) === index); // Remove duplicatas
      
      if (dependentNames.length > 0) {
        message += `Os jumps ${jumpNumbers} (${dependentNames.join(', ')}) esgotaram o tempo. `;
      } else {
        message += `Os jumps ${jumpNumbers} esgotaram o tempo. `;
      }
    } else {
      // Um único jump
      if (jump.dependente_name) {
        message += `O tempo do Jump #${jump.id} (${jump.dependente_name}) esgotou. `;
      } else {
        message += `O tempo do seu Jump #${jump.id} esgotou. `;
      }
    }
    
    message += 'Por favor, dirija-se ao caixa para finalizar o atendimento.';
    
    // Abre o WhatsApp (funciona em desktop e mobile)
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast.success(`WhatsApp aberto para ${responsibleName}`);
  };

  // Função para verificar e finalizar jumps expirados automaticamente
  const checkAndFinishExpiredJumps = async () => {
    const now = new Date();
    
    for (const jump of activeJumps) {
      if (jump.finished || jump.is_paused) continue;
      
      // SE O JUMP TEM COMANDA ASSOCIADA, NUNCA FINALIZAR AUTOMATICAMENTE
      // A comanda controla o ciclo de vida do jump - apenas exibir "TEMPO ESGOTADO"
      if (jump.order) {
        continue;
      }
      
      const start = new Date(jump.start_time);
      const contractedMillis = jump.contracted_hours * 60 * 60 * 1000;
      const end = new Date(start.getTime() + contractedMillis);
      
      // Verifica se o jump expirou (apenas finaliza jumps SEM comanda)
      if (now >= end) {
        try {
          const response = await jumpUsageService.finish(jump.id, { end_time: now.toISOString() }, companyId);
          
          if (response.success) {
            const customerName = jump.dependente_name || jump.customer_name;
            toast.info(`Jump de ${customerName} finalizado automaticamente (tempo expirado)`);
            // Atualizar a lista de jumps
            await loadActiveJumps();
            await loadOrders();
          }
        } catch (error) {
          console.error(`Erro ao finalizar jump ${jump.id} automaticamente:`, error);
        }
      }
    }
  };

  // Função para verificar o status da assinatura (APENAS da empresa atual)
  const checkSubscription = async (isInitialCheck: boolean = false) => {
    try {
      // Verificar APENAS a empresa atual (companyId)
      const response = await api.get(`/check-subscription/?company_id=${companyId}`);
      
      if (response.success && response.data) {
        // Se for superuser, não precisa verificar
        if (response.data.is_superuser) {
          return;
        }
        
        // Se não tem empresa, não precisa verificar
        if (!response.data.has_company || !response.data.companies || response.data.companies.length === 0) {
          return;
        }
        
        // Pegar status da empresa atual (deve ser apenas 1)
        const currentCompanyStatus = response.data.companies[0];
        
        if (!currentCompanyStatus) {
          return;
        }
        
        // Se venceu, bloquear acesso
        if (currentCompanyStatus.is_expired) {
          toast.error(currentCompanyStatus.message || 'Assinatura vencida! Entre em contato com o suporte.', {
            autoClose: false,
            closeOnClick: false,
          });
          
          // Redirecionar para seleção de empresa (se for admin) ou login (se for usuário comum)
          setTimeout(() => {
            sessionStorage.clear();
            if (userData?.is_admin) {
              // Admin volta para seleção de empresa
              navigate('/select-company');
            } else {
              // Usuário comum faz logout
              localStorage.clear();
              navigate('/login');
            }
          }, 3000);
          return;
        }
        
        // Se está perto de vencer, mostrar aviso
        if (currentCompanyStatus.show_warning && isInitialCheck) {
          // Verificar se já mostrou o aviso nesta sessão
          const sessionKey = `subscription_warning_shown_${companyId}`;
          const alreadyShown = sessionStorage.getItem(sessionKey);
        
          
          if (!alreadyShown && currentCompanyStatus.message) {
            
            // Marcar como já mostrado ANTES de mostrar o toast
            // para evitar duplicação em caso de renderização dupla
            sessionStorage.setItem(sessionKey, 'true');
            
            // Mostrar apenas UMA VEZ por sessão
            toast.warning(currentCompanyStatus.message, {
              autoClose: 10000,
              position: 'top-center',
              toastId: `subscription-warning-${companyId}`, // ID único para evitar duplicatas
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
    }
  };

  useEffect(() => {
    // Só carrega dados se tiver companyId
    if (!companyId) {
      console.error('Dashboard: companyId is undefined. userData:', userData, 'selectedCompany:', selectedCompany);
      setError('Empresa não identificada. Por favor, faça login novamente.');
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    
    const loadInitialData = async () => {
      try {
        // Verificar assinatura ao carregar o dashboard (primeira vez)
        checkSubscription(true);
        
        await loadCurrentCashRegister();
        if (cancelled) return;
        
        loadOrders();
        loadFiscalPrinter();
        loadA4Printer();
        loadCompanyUsers();
        loadPaymentTypes();
      } catch (err) {
        console.error('Erro ao carregar dados iniciais do dashboard:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    loadInitialData();
    
    // Atualizar o timer a cada segundo
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Verificar assinatura a cada hora (verificações subsequentes sem toast de aviso)
    const subscriptionInterval = setInterval(() => {
      checkSubscription(false);
    }, 60 * 60 * 1000); // 1 hora

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearInterval(subscriptionInterval);
    };
  }, [companyId]); // Recarrega quando muda de empresa

  // Verificar jumps recém expirados a cada 5 segundos
  useEffect(() => {
    const checkInterval = setInterval(() => {
      checkForNewlyExpiredJumps();
    }, 5000); // 5 segundos

    return () => clearInterval(checkInterval);
  }, [activeJumps, notifiedExpiredJumps, recentlyUpdatedJumps]);

  // Limpar jumps recentemente atualizados após 60 segundos
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setRecentlyUpdatedJumps(prev => {
        const newMap = new Map(prev);
        for (const [jumpId, timestamp] of newMap.entries()) {
          if (now - timestamp > 60000) {
            newMap.delete(jumpId);
          }
        }
        return newMap;
      });
    }, 30000); // Limpa a cada 30 segundos

    return () => clearInterval(cleanupInterval);
  }, []);

  // Verificar jumps expirados a cada 10 segundos
  useEffect(() => {
    const checkInterval = setInterval(() => {
      checkAndFinishExpiredJumps();
    }, 10000); // 10 segundos

    return () => clearInterval(checkInterval);
  }, [activeJumps, companyId]);

  // Carregar jumps quando o caixa estiver definido (filtra por caixa atual)
  useEffect(() => {
    if (!companyId) return;
    if (!currentCashRegister) {
      setActiveJumps([]);
      return;
    }
    loadActiveJumps();
  }, [companyId, currentCashRegister?.id]);

  // Atualizar jumps ativos a cada 5 segundos para refletir mudanças de outros lugares (ex: MobilePanel)
  useEffect(() => {
    if (!companyId || !currentCashRegister) return;

    const refreshInterval = setInterval(async () => {
      // Versão "silenciosa" do load que não causa re-renders desnecessários
      try {
        const response = await jumpUsageService.listActive(companyId, currentCashRegister.id);
        
        if (response.success && response.data) {
          const newJumps = response.data;
          
          // Usa setActiveJumps com função callback para ter acesso ao estado atual
          setActiveJumps(currentJumps => {
            // Compara se realmente mudou algo relevante
            const hasChanges = newJumps.length !== currentJumps.length ||
              newJumps.some((newJump) => {
                const oldJump = currentJumps.find(j => j.id === newJump.id);
                if (!oldJump) return true;
                
                // Verifica apenas campos que realmente importam para a UI
                return oldJump.is_paused !== newJump.is_paused ||
                       oldJump.paused_at !== newJump.paused_at ||
                       oldJump.total_paused_time !== newJump.total_paused_time ||
                       oldJump.end_time !== newJump.end_time ||
                       oldJump.finished !== newJump.finished;
              });
            
            // Só retorna novo estado se realmente houver mudanças
            return hasChanges ? newJumps : currentJumps;
          });
        }
      } catch (err) {
        // Ignora erros silenciosamente no polling
        console.error('Erro no polling de jumps:', err);
      }
    }, 5000); // 5 segundos

    return () => clearInterval(refreshInterval);
  }, [companyId, currentCashRegister]);

  const loadActiveJumps = async (cashRegisterOverride?: CashRegister | null) => {
    try {
      if (!companyId) {
        console.warn('No companyId available, skipping active jumps load');
        return;
      }
      const cashRegister = cashRegisterOverride ?? currentCashRegister;
      if (!cashRegister) {
        setActiveJumps([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Usa o jumpUsageService que já tem a base URL e token configurados (filtra por caixa atual)
      const response = await jumpUsageService.listActive(companyId, cashRegister.id);

      if (response.success) {
        // Força nova referência para garantir re-renderização
        setActiveJumps([...(response.data || [])]);
      } else {
        throw new Error(response.error || 'Erro ao carregar jumps ativos');
      }
    } catch (err: any) {
      console.error('Error loading active jumps:', err);
      setError(err.message || 'Erro ao carregar jumps ativos');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      if (!companyId) {
        console.warn('No companyId available, skipping orders load');
        return;
      }
      if (!currentCashRegister?.id) {
        setOrders([]);
        return;
      }
      
      const statusParam = ordersShowClosed ? 'closed' : 'open';
      const response = await orderService.list(companyId, statusParam, {
        dateFrom: ordersDateFrom || undefined,
        dateTo: ordersDateTo || undefined,
        cashRegisterId: currentCashRegister.id,
      });
      if (response.success) {
        const rawOrders = response.data || [];
        // Filtro de segurança: exibir apenas comandas do caixa atual
        const cashRegisterIdStr = String(currentCashRegister.id);
        const filtered = rawOrders.filter((o: Order) => {
          const cr = o.cash_register;
          const orderCashRegisterId = typeof cr === 'string' ? cr : (cr && typeof cr === 'object' && 'id' in cr ? (cr as { id: string }).id : undefined);
          return orderCashRegisterId && String(orderCashRegisterId) === cashRegisterIdStr;
        });
        setOrders(filtered);
      } else {
        throw new Error(response.error || 'Erro ao carregar comandas');
      }
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Erro ao carregar comandas');
    }
  };

  const loadPaymentTypes = async () => {
    try {
      const response = await api.get('/payment-types/');
      console.log('Payment Types carregados:', response);
      if (response) {
        setPaymentTypes(response);
      }
    } catch (err: any) {
      console.error('Error loading payment types:', err);
    }
  };

  const loadCustomers = async () => {
    try {
      if (!companyId) {
        console.warn('No companyId available, skipping customers load');
        return;
      }
      
      // Carrega clientes
      const customersResponse = await customerService.list(companyId);
      // Carrega dependentes
      const dependentesResponse = await customerService.listDependentes(companyId);

      // Cria opções de clientes
      const clienteOptions: CustomerOption[] = (customersResponse.data || []).map(c => ({
        id: c.id,
        nome: c.nome,
        cpf: c.cpf,
        pcd: c.pcd, // Pessoa com Deficiência
        tipo: 'Cliente' as const,
        customerId: c.id,
      }));

      // Cria opções de dependentes
      const dependenteOptions: CustomerOption[] = (dependentesResponse.data || []).map(d => ({
        id: d.id,
        nome: d.nome, // Nome sem sufixo, será mostrado na lista expandida
        pcd: d.pcd, // Pessoa com Deficiência
        tipo: 'Dependente' as const,
        customerId: d.cliente,
        dependenteId: d.id,
        aprovacao_responsavel: d.aprovacao_responsavel,
      }));

      // Agrupa dependentes por cliente
      const grouped: CustomerWithDependents[] = clienteOptions.map(cliente => ({
        customer: cliente,
        dependents: dependenteOptions.filter(dep => dep.customerId === cliente.id)
      }));

      setCustomersWithDependents(grouped);
      setCustomerOptions([...clienteOptions, ...dependenteOptions]); // Mantém para compatibilidade
    } catch (err: any) {
      console.error('Error loading customers:', err);
      setError(err.message || 'Erro ao carregar clientes');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productService.list({ 
        company_id: companyId, 
        product_type_name: 'Tempo de uso', 
        is_active: true 
      });
      if (response.success) {
        setProducts(response.data || []);
      } else {
        throw new Error(response.error || 'Erro ao carregar produtos');
      }
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message || 'Erro ao carregar produtos');
    }
  };

  const loadConsumableProducts = async () => {
    try {
      const response = await productService.list({ 
        company_id: companyId, 
        product_type_name: 'Consumível',
        is_active: true 
      });
      if (response.success) {
        setConsumableProducts(response.data || []);
      }
    } catch (err: any) {
      console.error('Error loading consumable products:', err);
    }
  };

  const loadEquipmentProducts = async () => {
    try {
      const response = await productService.list({ 
        company_id: companyId, 
        product_type_name: 'Equipamento',
        is_active: true 
      });
      if (response.success) {
        setEquipmentProducts(response.data || []);
      }
    } catch (err: any) {
      console.error('Error loading equipment products:', err);
    }
  };

  const loadAvailableUnits = async (productId: string) => {
    try {
      setLoadingUnits(true);
      const response = await equipmentUnitService.list(productId, 'available');
      console.log('🔍 Unidades disponíveis para produto', productId, ':', response);
      if (response.success) {
        const units = (response.data || []).filter(u => u.is_active);
        console.log('✅ Unidades filtradas (is_active):', units);
        setAvailableUnits(units);
        if (units.length === 0) {
          toast.warning('Nenhuma unidade disponível para este equipamento');
        }
      }
    } catch (err: any) {
      console.error('Error loading available units:', err);
      toast.error('Erro ao carregar unidades disponíveis');
    } finally {
      setLoadingUnits(false);
    }
  };

  const loadCompanyUsers = async () => {
    try {
      if (!companyId) return; // Garante que temos um companyId antes de buscar
      const response = await userService.list(companyId);
      if (response.success) {
        setCompanyUsers(response.data || []);
      } else {
        throw new Error(response.error || 'Erro ao carregar usuários da empresa');
      }
    } catch (err: any) {
      console.error('Error loading company users:', err);
      toast.error(err.message || 'Erro ao carregar usuários da empresa');
    }
  };

  const loadOrder = async (jumpUsageId: string) => {
    try {
      const response = await orderService.getByJumpUsage(jumpUsageId, companyId);
      if (response.success && response.data) {
        setCurrentOrder(response.data);
      }
    } catch (err: any) {
      console.error('Error loading order:', err);
    }
  };

  // Funções do Caixa
  const handleOpenCashModal = () => {
    setShowOpenCashModal(true);
    setOpeningAmount('');
    setOpeningNotes('');
  };

  const loadCashWithdrawals = async (cashRegisterId: string) => {
    try {
      // Buscar sangrias do caixa através do backend
      const response = await fetch(`http://localhost:8000/api/cash-register/${cashRegisterId}/withdrawals/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setCashWithdrawals(data.data);
      } else {
        setCashWithdrawals([]);
      }
    } catch (error) {
      console.error('Erro ao buscar sangrias:', error);
      setCashWithdrawals([]);
    }
  };

  const handleCloseCashModal = async () => {
    // Recarrega o caixa atual para ter os dados mais recentes
    await loadCurrentCashRegister();
    await loadCompanyUsers(); // Carrega os usuários para a transferência
    
    // Carrega as sangrias do caixa
    if (currentCashRegister) {
      await loadCashWithdrawals(currentCashRegister.id);
    }
    
    setPendingItems(null); // Reset pending items
    setSelectedTransferUser(null); // Reset selected user
    setShowCloseCashModal(true);
  };

  const handleCancelCloseCash = () => {
    setShowCloseCashModal(false);
    setPendingItems(null);
    setSelectedTransferUser(null);
    setClosingAmount('');
    setClosingNotes('');
  };

  const handleOpenCash = async () => {
    // Proteção contra cliques duplos
    if (loading) {
      return;
    }
    
    if (!companyId) {
      toast.error('Empresa não identificada. Por favor, recarregue a página.');
      return;
    }
    
    try {
      setLoading(true);
      
      if (!openingAmount || parseFloat(openingAmount) < 0) {
        toast.error('Informe um valor inicial válido');
        setLoading(false);
        return;
      }

      const response = await cashRegisterService.open({
        opening_amount: parseFloat(openingAmount),
        opening_notes: openingNotes
      }, companyId);
      
      
      if (response.success) {
        setCurrentCashRegister(response.data);
        setShowOpenCashModal(false);
        setOpeningAmount('');
        setOpeningNotes('');
        toast.success('Caixa aberto com sucesso!');
        loadActiveJumps(response.data); // Recarrega os jumps do novo caixa
      } else {
        toast.error(response.error || 'Erro ao abrir caixa');
      }
    } catch (err: any) {
      console.error('Erro ao abrir caixa:', err);
      toast.error('Erro ao abrir caixa');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCash = async () => {
    // Proteção contra cliques duplos
    if (loading) return;
    if (!currentCashRegister) return;
    
    try {
      setLoading(true);

      if (!closingAmount || parseFloat(closingAmount) < 0) {
        toast.error('Informe o valor final do caixa');
        setLoading(false);
        return;
      }

      // Verifica se há diferença no valor e se a observação é obrigatória
      const expectedAmount = parseFloat(currentCashRegister.expected_closing_amount);
      const actualAmount = parseFloat(closingAmount);
      const hasDifference = Math.abs(expectedAmount - actualAmount) > 0.01; // Tolerância de 1 centavo

      if (hasDifference && (!closingNotes || closingNotes.trim() === '')) {
        toast.error('Há diferença no valor do caixa. Por favor, informe o motivo nas observações.');
        setLoading(false);
        return;
      }

      // Se há itens pendentes e nenhum usuário de transferência selecionado, impede o fechamento
      if (pendingItems && (pendingItems.open_orders_count > 0 || pendingItems.active_jumps_count > 0) && !selectedTransferUser) {
        toast.error('Selecione um usuário para transferir os itens pendentes ou finalize-os.');
        setLoading(false);
        return;
      }

      const response = await cashRegisterService.close(currentCashRegister.id, {
        closing_amount: parseFloat(closingAmount),
        closing_notes: closingNotes,
        transfer_to_user_id: selectedTransferUser?.id || undefined // Passa o ID do usuário selecionado
      });
      
      if (response.success) {
        toast.success(response.message || 'Caixa fechado com sucesso!'); // Usa a mensagem da API
        
        // Se há comprovante fiscal, mostrar e imprimir
        if (response.comprovante_fiscal) {
          // Mostrar comprovante em uma nova janela para impressão
          const comprovanteWindow = window.open('', '_blank', 'width=600,height=800');
          if (comprovanteWindow) {
            comprovanteWindow.document.write(`
              <html>
                <head>
                  <title>Comprovante Fiscal - Caixa ${currentCashRegister.id}</title>
                  <style>
                    body { 
                      font-family: 'Courier New', monospace; 
                      font-size: 12px; 
                      line-height: 1.2;
                      margin: 0;
                      padding: 10px; 
                      white-space: pre-line;
                    }
                    @media print {
                      body { margin: 0; padding: 5px; }
                    }
                  </style>
                </head>
                <body>
                  ${response.comprovante_fiscal}
                </body>
              </html>
            `);
            comprovanteWindow.document.close();
            
            // Aguardar um pouco e imprimir automaticamente
            setTimeout(() => {
              comprovanteWindow.print();
            }, 500);
          }
        }

        setShowCloseCashModal(false);
        setCurrentCashRegister(null);
        setClosingAmount('');
        setClosingNotes('');
        setSelectedTransferUser(null); // Resetar
        setPendingItems(null); // Resetar
        
        // Limpar estados de notificação de jumps expirados
        setShowExpiredJumpAlert(false);
        setExpiredJumpAlert(null);
        setNotifiedExpiredJumps(new Set());
        setRecentlyUpdatedJumps(new Map()); // Limpar lista de jumps recentemente atualizados
        
        loadActiveJumps(); // Recarregar jumps (podem ter sido transferidos)
        loadOrders(); // Recarregar ordens (podem ter sido transferidas)
        loadCurrentCashRegister(); // Recarregar para garantir que nenhum caixa esteja aberto
      } else {
        // Se retornou pending_items, mostra no modal sem toast de erro
        if (response.pending_items) {
          setPendingItems(response.pending_items); // Exibir itens pendentes para o usuário
          // Não fecha o modal, apenas mostra os itens pendentes para seleção
        } else {
          // Outros erros mostram toast
          toast.error(response.error || 'Erro ao fechar caixa');
        }
      }
    } catch (err: any) {
      console.error('Error closing cash register:', err);
      toast.error('Erro ao fechar caixa');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWithdrawalModal = () => {
    if (!currentCashRegister) {
      toast.error('Nenhum caixa aberto');
      return;
    }
    setShowWithdrawalModal(true);
    setWithdrawalAmount('');
    setWithdrawalNotes('');
  };

  const handleCancelWithdrawal = () => {
    setShowWithdrawalModal(false);
    setWithdrawalAmount('');
    setWithdrawalNotes('');
  };

  const handleWithdrawal = async () => {
    // Proteção contra cliques duplos
    if (loading) return;
    if (!currentCashRegister) return;
    
    try {
      setLoading(true);

      if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
        toast.error('Informe um valor válido para sangria');
        setLoading(false);
        return;
      }

      const amount = parseFloat(withdrawalAmount);
      const expectedAmount = parseFloat(currentCashRegister.expected_closing_amount);

      // Verifica se há saldo suficiente
      if (amount > expectedAmount) {
        toast.error('Valor de sangria maior que o saldo disponível no caixa');
        setLoading(false);
        return;
      }

      const response = await cashRegisterService.withdrawal(currentCashRegister.id, {
        amount: amount,
        notes: withdrawalNotes
      });
      
      if (response.success) {
        toast.success('Sangria realizada com sucesso!');
        setShowWithdrawalModal(false);
        setWithdrawalAmount('');
        setWithdrawalNotes('');
        loadCurrentCashRegister(); // Recarregar para atualizar o saldo
      } else {
        toast.error(response.error || 'Erro ao realizar sangria');
      }
    } catch (err: any) {
      console.error('Erro ao realizar sangria:', err);
      toast.error('Erro ao realizar sangria');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenJumpModal = () => {
    setShowJumpModal(true);
    setError(null);
    setSuccess(null);
    loadCustomers();
    loadProducts();
  };

  const handleCloseJumpModal = () => {
    setShowJumpModal(false);
    setSelectedCustomerOption(null);
    setSelectedProduct(null);
    setSearchTerm('');
    setSelectedCustomers([]);
    setError(null);
  };

  // Funções de formatação para o modal de cadastro rápido
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const handleOpenQuickCustomerModal = () => {
    setShowQuickCustomerModal(true);
  };

  const handleCloseQuickCustomerModal = () => {
    setShowQuickCustomerModal(false);
    setQuickCustomerData({
      nome: '',
      telefone: '',
      cpf: '',
      email: '',
      data_nascimento: '',
      estrangeiro: false,
      pcd: false,
    });
    setQuickCustomerDependentes([]);
    setQuickCustomerProduct(null);
    setQuickCustomerWillUseTitular(true);
    setQuickCustomerWillUseDependentes([]);
    setQuickCustomerTitularProduct(null);
    setQuickCustomerDependentesProducts({});
    setError(null);
  };

  const handleQuickCustomerSubmit = async (andStartJump: boolean = false) => {
    console.log('=== handleQuickCustomerSubmit CHAMADO ===');
    console.log('andStartJump:', andStartJump);
    console.log('quickCustomerData:', quickCustomerData);
    console.log('quickCustomerWillUseTitular:', quickCustomerWillUseTitular);
    console.log('quickCustomerTitularProduct:', quickCustomerTitularProduct);
    console.log('quickCustomerWillUseDependentes:', quickCustomerWillUseDependentes);
    console.log('quickCustomerDependentesProducts:', quickCustomerDependentesProducts);
    
    try {
      setError(null);

      // Validações
      if (!quickCustomerData.nome.trim()) {
        console.log('ERRO: Nome é obrigatório');
        setError('Nome é obrigatório');
        return;
      }

      if (!quickCustomerData.telefone.trim()) {
        console.log('ERRO: Telefone é obrigatório');
        setError('Telefone é obrigatório');
        return;
      }

      // Validações para iniciar Jump
      if (andStartJump) {
        console.log('Validando para iniciar Jump...');
        // Valida se pelo menos uma pessoa foi selecionada
        if (!quickCustomerWillUseTitular && quickCustomerWillUseDependentes.length === 0) {
          console.log('ERRO: Nenhuma pessoa selecionada');
          setError('Selecione pelo menos uma pessoa para usar o Jump');
          return;
        }

        // Valida se o titular tem produto selecionado
        if (quickCustomerWillUseTitular && !quickCustomerTitularProduct) {
          console.log('ERRO: Titular selecionado mas sem produto');
          setError('Selecione um pacote para o cliente titular');
          return;
        }

        // Valida se os dependentes selecionados têm produtos
        for (const depIndex of quickCustomerWillUseDependentes) {
          if (!quickCustomerDependentesProducts[depIndex]) {
            const depName = quickCustomerDependentes[depIndex]?.nome || `Dependente ${depIndex + 1}`;
            console.log(`ERRO: Dependente ${depName} sem produto`);
            setError(`Selecione um pacote para ${depName}`);
            return;
          }
        }
        console.log('Validações OK! Prosseguindo...');
      }

      const data = {
        ...quickCustomerData,
        company: companyId,
        is_active: true,
        cpf: quickCustomerData.cpf || undefined,
        email: quickCustomerData.email || undefined,
        data_nascimento: quickCustomerData.data_nascimento || undefined,
      };

      const response = await customerService.create(data, companyId);
      
      if (!response.data) {
        throw new Error('Erro ao criar cliente: resposta inválida');
      }
      
      const newCustomerId = response.data.id;
      
      // Cadastrar dependentes e coletar IDs de menores de idade
      const menoresDeIdadeIds: (string | number)[] = [];
      const dependentesCreated: Array<{ id: string | number; nome: string; index: number }> = [];
      
      for (let index = 0; index < quickCustomerDependentes.length; index++) {
        const dep = quickCustomerDependentes[index];
        if (dep.nome.trim() && dep.data_nascimento.trim()) {
          const depResponse = await customerService.createDependente({
            nome: dep.nome,
            data_nascimento: dep.data_nascimento,
            cliente: newCustomerId,
            pcd: dep.pcd,
          } as any, companyId);

          if (!depResponse.data) {
            console.error('Erro: depResponse.data está undefined');
            continue;
          }
          
          const dependenteData = depResponse.data;
          
          // Armazena os dados do dependente criado
          dependentesCreated.push({
            id: String(dependenteData.id),
            nome: dependenteData.nome,
            index: index
          });
          
          // Verificar se é menor de 18 anos
          // Calcula idade manualmente também como fallback
          const dataNasc = new Date(dep.data_nascimento);
          const hoje = new Date();
          let idade = hoje.getFullYear() - dataNasc.getFullYear();
          const mesAtual = hoje.getMonth();
          const mesNasc = dataNasc.getMonth();
          if (mesAtual < mesNasc || (mesAtual === mesNasc && hoje.getDate() < dataNasc.getDate())) {
            idade--;
          }
          
          
          // Usa idade da API se disponível, senão usa calculada
          const idadeParaVerificar = dependenteData.idade !== undefined ? dependenteData.idade : idade;
          
          if (idadeParaVerificar < 18) {
            menoresDeIdadeIds.push(String(dependenteData.id));
          }
        }
      }
      
      
      toast.success('Cliente e dependentes cadastrados com sucesso!');
      
      // Se houver menores de idade, imprimir termo
      if (menoresDeIdadeIds.length > 0) {
        setTimeout(async () => {
          await imprimirTermo(menoresDeIdadeIds);
        }, 500);
      }
      
      // Recarrega os clientes e seleciona o recém-criado
      await loadCustomers();
      
      // Seleciona o novo cliente
      const newCustomer: CustomerOption = {
        id: response.data!.id,
        nome: response.data!.nome,
        cpf: response.data!.cpf,
        tipo: 'Cliente',
      };
      setSelectedCustomerOption(newCustomer);
      
      handleCloseQuickCustomerModal();

      // Se for para iniciar o Jump, prepara e abre o modal
      if (andStartJump) {
        console.log('=== INICIANDO JUMP ===');
        console.log('response.data:', response.data);
        console.log('dependentesCreated:', dependentesCreated);
        
        // Prepara a lista de clientes para adicionar (só os selecionados)
        const clientsToAdd: SelectedCustomerWithProduct[] = [];
        
        // Adiciona o titular se foi selecionado
        if (quickCustomerWillUseTitular && quickCustomerTitularProduct) {
          console.log('Adicionando titular à lista:', quickCustomerTitularProduct);
          clientsToAdd.push({
            customer: {
              id: response.data!.id,
              nome: response.data!.nome,
              cpf: response.data!.cpf,
              tipo: 'Cliente',
              customerId: response.data!.id,
            },
            product: quickCustomerTitularProduct,
          });
          // Define como produto selecionado padrão (para o modal)
          setSelectedProduct(quickCustomerTitularProduct);
        }
        
        // Adiciona apenas os dependentes selecionados (usando os IDs que já temos)
        for (const depCreated of dependentesCreated) {
          // Verifica se este dependente está na lista de selecionados
          if (quickCustomerWillUseDependentes.includes(depCreated.index)) {
            const depProduct = quickCustomerDependentesProducts[depCreated.index];
            console.log(`Dependente ${depCreated.nome} (index ${depCreated.index}):`, depProduct);
            if (depProduct) {
              clientsToAdd.push({
                customer: {
                  id: String(depCreated.id),
                  nome: depCreated.nome,
                  cpf: '',
                  tipo: 'Dependente',
                  customerId: String(response.data!.id),
                  dependenteId: String(depCreated.id),
                },
                product: depProduct,
              });
            }
          }
        }
        
        console.log('clientsToAdd final:', clientsToAdd);
        
        // Adiciona todos à lista de clientes selecionados
        setSelectedCustomers(clientsToAdd);
        
        // Marca como recém-criado para destacar no modal
        setNewlyCreatedCustomerId(response.data!.id);
        
        console.log('Abrindo modal de Jump em 300ms...');
        // Abre o modal de Jump
        setTimeout(() => {
          console.log('Chamando handleOpenJumpModal()');
          handleOpenJumpModal();
        }, 300);
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar cliente:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Erro ao cadastrar cliente';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleQuickAddDependente = () => {
    setQuickCustomerDependentes([...quickCustomerDependentes, { nome: '', data_nascimento: '', pcd: false }]);
  };

  const handleQuickRemoveDependente = (index: number) => {
    setQuickCustomerDependentes(quickCustomerDependentes.filter((_, i) => i !== index));
  };

  const handleQuickDependenteChange = (index: number, field: keyof QuickDependenteForm, value: string) => {
    const updated = [...quickCustomerDependentes];
    updated[index] = { ...updated[index], [field]: value };
    setQuickCustomerDependentes(updated);
  };

  const handleOpenFinishModal = (jump: JumpUsage) => {
    setSelectedJump(jump);
    setShowFinishModal(true);
    loadOrder(jump.id);
    loadProducts(); // Carrega produtos de "Tempo de uso" para horas extras
    loadConsumableProducts();
    loadEquipmentProducts();
    setSelectedConsumable(null);
    setConsumableQuantity(1);
    setSelectedEquipment(null);
    setSelectedUnit(null);
    setAvailableUnits([]);
  };

  const handleCloseFinishModal = () => {
    setShowFinishModal(false);
    setSelectedJump(null);
    setAdditionalHours(0);
    setCurrentOrder(null);
    setSelectedConsumable(null);
    setConsumableQuantity(1);
    setSelectedEquipment(null);
    setSelectedUnit(null);
    setAvailableUnits([]);
  };

  // Funções para modal de comanda
  const handleOpenComandaModal = async (order: Order) => {
    setSelectedComanda(order);
    // Recarregar os detalhes completos da comanda
    try {
      const response = await orderService.getById(order.id, companyId);
      if (response.success && response.data) {
        setSelectedComanda(response.data);
        const items = (response.data as any).items || [];
        setComandaItems(items);
        
        // Calcula o total excluindo itens de tipo 'additional_time' e itens já pagos
        const calculatedTotal = items
          .filter((i: any) => i.item_type !== 'additional_time' && !i.pago)
          .reduce((sum: number, i: any) => sum + parseFloat(i.subtotal || '0'), 0);
        setComandaTotal(calculatedTotal.toString());
        
        if ((response.data as any).status === 'closed') {
          setComandaModalView('confirm_close');
        } else {
          setComandaModalView('details');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar comanda:', error);
      toast.error('Erro ao carregar comanda');
    }
    // Carregar produtos consumíveis e equipamentos
    loadConsumableProducts();
    loadEquipmentProducts();
    setShowComandaModal(true);
  };

  const handleCloseComandaModal = () => {
    setShowComandaModal(false);
    setSelectedComanda(null);
    setComandaModalView('details');
    setComandaItems([] as any);
    setComandaTotal('0');
    setAdditionalTimeAdjustments({});
    setClosePreview(null);
    setPaymentDetails([]);
  };

  const imprimirCupomFiscal = async (cupomTexto: string) => {
    
    // Verificar se está rodando no Electron e tem impressora fiscal configurada
    if (window.electronAPI?.printFiscal && fiscalPrinterName) {
      try {
        const result = await window.electronAPI.printFiscal(fiscalPrinterName, cupomTexto);

        if (result.success) {
          toast.success('Cupom fiscal impresso com sucesso!');
        } else {
          toast.error(`Erro ao imprimir: ${result.error || 'Erro desconhecido'}`);
          // Fallback para impressão via browser
          imprimirCupomFiscalFallback(cupomTexto);
        }
      } catch (error) {
        toast.error('Erro ao imprimir cupom fiscal');
        // Fallback para impressão via browser
        imprimirCupomFiscalFallback(cupomTexto);
      }
    } else {
      imprimirCupomFiscalFallback(cupomTexto);
    }
  };

  const imprimirTermo = async (menoresDeIdadeIds: (string | number)[]) => {
    try {
      const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`;
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Erro: Token de autenticação não encontrado. Faça login novamente.');
        return;
      }
      
      let pdfBlob: Blob;
      
      // Buscar o PDF do backend
      if (menoresDeIdadeIds.length === 1) {
        const response = await fetch(
          `${baseUrl}/api/dependentes/${menoresDeIdadeIds[0]}/termo/?company_id=${companyId}`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro ao gerar termo:', errorData);
          toast.error('Erro ao gerar termo de responsabilidade');
          return;
        }
        
        pdfBlob = await response.blob();
      } else {
        const response = await fetch(
          `${baseUrl}/api/dependentes/termo-multiplo/?company_id=${companyId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ dependente_ids: menoresDeIdadeIds }),
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro ao gerar termo:', errorData);
          toast.error('Erro ao gerar termo de responsabilidade');
          return;
        }
        
        pdfBlob = await response.blob();
      }
      
      // Verificar se pode imprimir via Electron
      if (window.electronAPI?.printA4 && a4PrinterName) {
        try {
          console.log('✅ Imprimindo termo via Electron com impressora A4:', a4PrinterName);
          
          // Converter blob para base64
          const arrayBuffer = await pdfBlob.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          
          const result = await window.electronAPI.printA4(a4PrinterName, base64);
          
          console.log('Resultado da impressão:', result);
          
          if (result.success) {
            toast.success('Termo de responsabilidade impresso com sucesso!');
          } else {
            toast.error(`Erro ao imprimir: ${result.error || 'Erro desconhecido'}`);
            // Fallback para método browser
            imprimirTermoFallback(pdfBlob, menoresDeIdadeIds.length);
          }
        } catch (error) {
          toast.error('Erro ao imprimir termo');
          // Fallback para método browser
          imprimirTermoFallback(pdfBlob, menoresDeIdadeIds.length);
        }
      } else {
        imprimirTermoFallback(pdfBlob, menoresDeIdadeIds.length);
      }
      
      toast.info(`Termo de responsabilidade processado (${menoresDeIdadeIds.length} menor${menoresDeIdadeIds.length > 1 ? 'es' : ''})`);
    } catch (error) {
      console.error('Erro ao processar termo:', error);
      toast.error('Erro ao processar termo de responsabilidade');
    }
  };

  const imprimirTermoFallback = (pdfBlob: Blob, quantidade: number) => {
    toast.warning('Usando modo de impressão do navegador. Para impressão automática, execute no Electron e configure a impressora A4.', {
      autoClose: 5000
    });
    
    const url = window.URL.createObjectURL(pdfBlob);
    
    // Abrir em nova aba
    const newTab = window.open(url, '_blank');
    if (!newTab) {
      // Se pop-up bloqueado, faz download
      const a = document.createElement('a');
      a.href = url;
      a.download = quantidade > 1 ? 'termo_responsabilidade_multiplos.pdf' : 'termo_responsabilidade.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.warning('Pop-up bloqueado. PDF baixado automaticamente.');
    }
    
    // Limpar URL após 1 minuto
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  };

  const imprimirCupomFiscalFallback = (cupomTexto: string) => {
    // Aviso ao usuário sobre modo fallback
    toast.warning('Usando modo de impressão do navegador. Para impressão automática, execute no Electron e configure a impressora fiscal.', {
      autoClose: 5000
    });
    
    // Criar uma nova janela para impressão (método antigo)
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    if (!printWindow) {
      toast.error('Por favor, permita pop-ups para imprimir o cupom fiscal');
      return;
    }
    
    // Criar HTML formatado para impressão
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cupom Fiscal</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 10px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.4;
              }
            }
            body {
              margin: 0;
              padding: 10px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              white-space: pre-wrap;
              max-width: 80mm;
            }
            pre {
              margin: 0;
              font-family: 'Courier New', monospace;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <pre>${cupomTexto.replace(/\n/g, '<br>')}</pre>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Aguardar um pouco para garantir que o conteúdo foi carregado
    setTimeout(() => {
      printWindow.print();
      // Fechar a janela após impressão (opcional)
      // printWindow.close();
    }, 250);
  };

  const handleFinalizarComanda = async () => {
    if (!selectedComanda) return;

    const allItems = [
      ...(selectedComanda?.items || []),
      ...(closePreview?.additional_items || []),
    ];
    
    let totalComanda = 0;
    
    allItems.forEach((item: any) => {
      if (item.pago) return;
      
      if (item.item_type === 'additional_time') {
        const jumpMatch = item.description?.match(/Jump #(\d+)/);
        const jumpId = jumpMatch ? parseInt(jumpMatch[1]) : null;
        
        if (jumpId && additionalTimeAdjustments[jumpId] !== undefined) {
          const adjustedQuantity = additionalTimeAdjustments[jumpId].newQuantity;
          const unitPrice = parseFloat(item.subtotal) / item.quantity;
          totalComanda += adjustedQuantity * unitPrice;
        } else {
          totalComanda += parseFloat(item.subtotal || 0);
        }
      } else {
        totalComanda += parseFloat(item.subtotal || 0);
      }
    });

    const totalPago = paymentDetails.reduce((sum, detail) => sum + parseFloat(detail.amount || '0'), 0);
    
    if (Math.abs(totalPago - totalComanda) > 0.01) {
      toast.error(`O valor total dos pagamentos (R$ ${totalPago.toFixed(2)}) não corresponde ao total da comanda (R$ ${totalComanda.toFixed(2)})`);
      return;
    }
    
    if (paymentDetails.length === 0) {
      toast.error('Adicione pelo menos uma forma de pagamento');
      return;
    }

    try {
      setComandaLoading(true);
      setError(null);
      
      const adjustments = Object.keys(additionalTimeAdjustments).length > 0 
        ? additionalTimeAdjustments 
        : undefined;
      
      const response = await orderService.close(selectedComanda.id, companyId, adjustments, paymentDetails);
      
      if (response.success) {
        const message = response.message || 'Comanda finalizada com sucesso!';
        toast.success(message);
        
        if (response.cupom_fiscal) {
          imprimirCupomFiscal(response.cupom_fiscal);
        }
        
        handleCloseComandaModal();
        
        await loadActiveJumps();
        await loadOrders();
        await loadCurrentCashRegister();
      } else {
        toast.error(response.error || 'Erro ao finalizar comanda');
      }
    } catch (error) {
      console.error('Erro ao finalizar comanda:', error);
      toast.error('Erro ao finalizar comanda');
    } finally {
      setComandaLoading(false);
    }
  };

  const handleAddHours = async (product: Product) => {
    if (!selectedJump || !currentOrder) {
      toast.error('Erro: Jump ou pedido não encontrado');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Extrai as horas do nome do produto (ex: "1 Hora" -> 1, "5 Minutos" -> 0.0833)
      let hours = 1;
      
      // Verifica se é em minutos
      if (product.name.includes('Minutos') || product.name.includes('minutos')) {
        const minutesMatch = product.name.match(/(\d+)\s*(Minutos|minutos)/);
        if (minutesMatch) {
          const minutes = parseInt(minutesMatch[1]);
          // Converte minutos para horas e arredonda para 4 casas decimais
          hours = parseFloat((minutes / 60).toFixed(4));
        }
      } 
      // Verifica se é em horas
      else {
        const hoursMatch = product.name.match(/(\d+)\s*(Hora|hora|Horas|horas)?/);
        hours = hoursMatch ? parseFloat(parseFloat(hoursMatch[1]).toFixed(4)) : 1;
      }
      
      // IMPORTANTE: contracted_hours precisa ser convertido para número
      const currentHours = typeof selectedJump.contracted_hours === 'string' 
        ? parseFloat(selectedJump.contracted_hours) 
        : selectedJump.contracted_hours;
      
      // SEMPRE soma as horas extras ao tempo contratado existente
      // O start_time NUNCA é resetado para preservar o cálculo de tempo adicional (overtime)
      const newContractedHours = currentHours + hours;
      
      // Atualiza o jump adicionando as horas extras
      // O backend automaticamente reabre a comanda se estiver fechada e adiciona o item
      const updatedData = {
        contracted_hours: newContractedHours,
        product_id: product.id,
      };
      
      const updateResponse = await jumpUsageService.update(selectedJump.id, updatedData, companyId);
      
      if (updateResponse.success && updateResponse.data) {
        // Força atualização criando novo objeto
        const updatedJump = { ...updateResponse.data };
        setSelectedJump(updatedJump);
        
        // Remove o jump da lista de notificados para permitir novas notificações com o novo tempo
        setNotifiedExpiredJumps(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedJump.id);
          return newSet;
        });
        
        // Fecha qualquer alerta de jump expirado que possa estar aberto para este jump
        if (expiredJumpAlert?.id === selectedJump.id) {
          setShowExpiredJumpAlert(false);
          setExpiredJumpAlert(null);
        }
        
        // Marca o jump como recentemente atualizado (não notificar por 60 segundos)
        setRecentlyUpdatedJumps(prev => {
          const newMap = new Map(prev);
          newMap.set(selectedJump.id, Date.now());
          return newMap;
        });
        
        // PRIMEIRO: Atualiza o jump específico na lista ANTES de recarregar
        setActiveJumps(prevJumps => 
          prevJumps.map(jump => 
            jump.id === updatedJump.id ? updatedJump : jump
          )
        );
        
        // Recarrega a lista de jumps ativos
        await loadActiveJumps();
        
        // Força re-renderização atualizando o currentTime
        setCurrentTime(new Date());
        
        // Recarrega o pedido
        await loadOrder(selectedJump.id);
        
        setAdditionalHours(additionalHours + hours);
        
        // Mostra mensagem de sucesso com indicação se a comanda foi reaberta
        const message = updateResponse.message || `${hours} hora(s) adicionada(s)`;
        setSuccess(`${message} - R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}`);
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(updateResponse.error || 'Erro ao adicionar horas');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao adicionar horas');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseJump = async () => {
    // Proteção contra cliques duplos
    if (loading) return;
    if (!selectedJump) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await jumpUsageService.pause(selectedJump.id, companyId);
      
      if (response.success && response.data) {
        // Atualiza imediatamente o jump na lista de activeJumps
        setActiveJumps(prevJumps => 
          prevJumps.map(j => j.id === response.data!.id ? response.data! : j)
        );
        
        // Fecha o modal
        handleCloseFinishModal();
        
        // Recarrega a lista completa para garantir consistência
        loadActiveJumps();
        
        // Mostra toast de sucesso
        setSuccess('Jump pausado com sucesso!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.error || 'Erro ao pausar jump');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao pausar jump');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeJump = async () => {
    // Proteção contra cliques duplos
    if (loading) return;
    if (!selectedJump) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await jumpUsageService.resume(selectedJump.id, companyId);
      
      if (response.success && response.data) {
        console.log('🔄 Jump retomado:', response.data);
        console.log('  - is_paused:', response.data.is_paused);
        console.log('  - paused_at:', response.data.paused_at);
        console.log('  - total_paused_time:', response.data.total_paused_time);
        
        // Atualiza imediatamente o jump na lista de activeJumps
        setActiveJumps(prevJumps => 
          prevJumps.map(j => j.id === response.data!.id ? response.data! : j)
        );
        
        // Fecha o modal
        handleCloseFinishModal();
        
        // Recarrega a lista completa para garantir consistência
        loadActiveJumps();
        
        // Mostra toast de sucesso
        setSuccess('Jump retomado com sucesso!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.error || 'Erro ao retomar jump');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao retomar jump');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!selectedJump) return;
    
    // Sempre usa o telefone do responsável (customer_telefone)
    const phoneNumber = selectedJump.customer_telefone;
    
    if (!phoneNumber) {
      setError('Telefone não cadastrado para este cliente');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Remove formatação do telefone (deixa apenas números)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Nome do responsável (sempre customer_name)
    const responsavelName = selectedJump.customer_name;
    
    // Mensagem simples para todos
    const message = `Olá ${responsavelName}! Tudo bem?`;
    
    // Abre o WhatsApp com mensagem pré-definida
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleAddConsumable = async () => {
    // Proteção contra cliques duplos
    if (loading) return;
    
    if (!selectedConsumable || !currentOrder) {
      setError('Selecione um produto consumível');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const unitPrice = parseFloat(selectedConsumable.price);
      const subtotal = unitPrice * consumableQuantity;
      
      const response = await orderService.addItem({
        order: currentOrder.id,
        product: selectedConsumable.id,
        item_type: 'consumable',
        quantity: consumableQuantity,
        unit_price: selectedConsumable.price,
      });

      if (response.success) {
        setSuccess('Consumível adicionado!');
        // Recarrega o pedido para atualizar a lista de itens e o total
        await loadOrder(selectedJump!.id);
        setSelectedConsumable(null);
        setConsumableQuantity(1);
        setTimeout(() => setSuccess(null), 2000);
      } else {
        throw new Error(response.error || 'Erro ao adicionar consumível');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar consumível');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = async () => {
    // Proteção contra cliques duplos
    if (loading) return;
    
    if (!selectedEquipment || !currentOrder) {
      toast.error('Selecione um equipamento');
      return;
    }

    if (!selectedUnit) {
      toast.error('Selecione uma unidade disponível');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const unitPrice = parseFloat(selectedEquipment.price);
      const subtotal = unitPrice * 1; // Equipamento sempre quantidade 1
      
      // Adiciona o item à comanda
      const response = await orderService.addItem({
        order: currentOrder.id,
        product: selectedEquipment.id,
        item_type: 'consumable',
        quantity: 1,
        unit_price: selectedEquipment.price,
        description: `${selectedEquipment.name} - Unidade #${selectedUnit.number}`,
        equipment_unit: selectedUnit.id
      });

      if (response.success) {
        // Marca a unidade como "em uso"
        const updateResponse = await equipmentUnitService.update(selectedUnit.id, {
          status: 'in_use'
        });
        
        if (!updateResponse.success) {
          console.error('Erro ao atualizar status da unidade:', updateResponse.error);
          toast.error('Equipamento adicionado mas não foi possível marcar a unidade como "em uso"');
        }

        toast.success(`Equipamento ${selectedEquipment.name} #${selectedUnit.number} adicionado!`);
        
        // Recarrega o pedido para atualizar a lista de itens e o total
        await loadOrder(selectedJump!.id);
        
        // Reseta seleções
        setSelectedEquipment(null);
        setSelectedUnit(null);
        setAvailableUnits([]);
      } else {
        throw new Error(response.error || 'Erro ao adicionar equipamento');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar equipamento');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOrderItem = async (itemId: string) => {
    if (!currentOrder) return;

    try {
      setError(null);
      
      const response = await orderService.removeItem(itemId, companyId);

      if (response.success) {
        setSuccess('Item removido!');
        // Recarrega o pedido para atualizar a lista de itens e o total
        await loadOrder(selectedJump!.id);
        setTimeout(() => setSuccess(null), 2000);
      } else {
        throw new Error(response.error || 'Erro ao remover item');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao remover item');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleToggleItemPago = async (itemId: string) => {
    if (!currentOrder) return;

    try {
      const response = await orderService.toggleItemPago(itemId, companyId);

      if (response.success) {
        // Recarrega o pedido para atualizar a lista de itens e o total
        await loadOrder(selectedJump!.id);
        toast.success(response.message || 'Item atualizado!');
      } else {
        throw new Error(response.error || 'Erro ao atualizar item');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar item');
    }
  };

  const handleFinishJump = async () => {
    // Proteção contra cliques duplos
    if (loading) return;
    if (!selectedJump) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await jumpUsageService.finish(selectedJump.id, {}, companyId);
      
      if (response.success) {
        setSuccess('Jump finalizado com sucesso!');
        
        // Se há cupom fiscal, mostrar e imprimir
        if (response.cupom_fiscal) {
          // Mostrar cupom em uma nova janela para impressão
          const cupomWindow = window.open('', '_blank', 'width=600,height=800');
          if (cupomWindow) {
            cupomWindow.document.write(`
              <html>
                <head>
                  <title>Cupom Fiscal - Jump ${selectedJump.id}</title>
                  <style>
                    body { 
                      font-family: 'Courier New', monospace; 
                      font-size: 12px; 
                      line-height: 1.2;
                      margin: 0;
                      padding: 10px;
                      white-space: pre-line;
                    }
                    @media print {
                      body { margin: 0; padding: 5px; }
                    }
                  </style>
                </head>
                <body>
                  ${response.cupom_fiscal}
                </body>
              </html>
            `);
            cupomWindow.document.close();
            
            // Aguardar um pouco e imprimir automaticamente
            setTimeout(() => {
              cupomWindow.print();
            }, 500);
          }
        }
        
        handleCloseFinishModal();
        loadActiveJumps();
        loadCurrentCashRegister(); // Atualizar valor do caixa
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Erro ao finalizar jump');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao finalizar jump');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Função para expandir/colapsar clientes
  const toggleCustomerExpansion = (customerId: string | number) => {
    const id = String(customerId);
    setExpandedCustomers(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  // Funções para gerenciar múltiplos clientes
  const handleAddCustomerToList = () => {
    if (!selectedCustomerOption) {
      setError('Selecione um cliente ou dependente');
      return;
    }

    if (!selectedProduct) {
      setError('Selecione um produto (tempo de uso)');
      return;
    }

    // Verifica se o cliente já está na lista
    const alreadyAdded = selectedCustomers.some(
      sc => sc.customer.id === selectedCustomerOption.id && sc.customer.tipo === selectedCustomerOption.tipo
    );

    if (alreadyAdded) {
      setError('Este cliente já foi adicionado à lista');
      return;
    }

    setSelectedCustomers([
      ...selectedCustomers,
      { customer: selectedCustomerOption, product: selectedProduct }
    ]);

    // Limpa a seleção
    setSelectedCustomerOption(null);
    setSelectedProduct(null);
    setSearchTerm('');
    setError(null);
  };

  // Adicionar cliente com todos os seus dependentes
  const handleAddCustomerWithDependents = (customerId: string | number) => {
    if (!selectedProduct) {
      setError('Selecione um produto (tempo de uso) primeiro');
      return;
    }

    const customerGroup = customersWithDependents.find(cwd => String(cwd.customer.id) === String(customerId));
    if (!customerGroup) return;

    // Verifica quais já estão na lista
    const toAdd: SelectedCustomerWithProduct[] = [];
    
    // Adiciona o cliente principal se não estiver na lista
    const clienteJaAdicionado = selectedCustomers.some(
      sc => sc.customer.id === customerGroup.customer.id && sc.customer.tipo === 'Cliente'
    );
    if (!clienteJaAdicionado) {
      toAdd.push({ customer: customerGroup.customer, product: selectedProduct });
    }

    // Adiciona os dependentes que não estão na lista
    customerGroup.dependents.forEach(dep => {
      const dependenteJaAdicionado = selectedCustomers.some(
        sc => sc.customer.id === dep.id && sc.customer.tipo === 'Dependente'
      );
      if (!dependenteJaAdicionado) {
        toAdd.push({ customer: dep, product: selectedProduct });
      }
    });

    if (toAdd.length === 0) {
      setError('Todos já foram adicionados à lista');
      return;
    }

    setSelectedCustomers([...selectedCustomers, ...toAdd]);
    setError(null);
    toast.success(`${toAdd.length} pessoa(s) adicionada(s) à lista`);
  };

  const handleRemoveCustomerFromList = (index: number) => {
    setSelectedCustomers(selectedCustomers.filter((_, i) => i !== index));
  };

  const handleUpdateCustomerProduct = (index: number, product: Product) => {
    const updated = [...selectedCustomers];
    updated[index].product = product;
    setSelectedCustomers(updated);
  };

  const handleCreateJump = async () => {
    // Proteção contra cliques duplos - verifica logo no início
    if (loading) {
      return;
    }

    if (selectedCustomers.length === 0) {
      setError('Adicione pelo menos um cliente à lista');
      return;
    }

    // Valida se todos têm produtos selecionados
    const missingProduct = selectedCustomers.some(sc => !sc.product);
    if (missingProduct) {
      setError('Todos os clientes devem ter um produto selecionado');
      return;
    }

    try {
      // Define loading como true imediatamente para prevenir cliques múltiplos
      setLoading(true);
      setError(null);
      
      // Preparar dados de todos os clientes
      const jumpsData = selectedCustomers.map(sc => {
        // Extrai as horas do nome do produto
        let contractedHours = 1;
        const productName = sc.product!.name;
        
        // Verifica se é em minutos
        if (productName.includes('Minutos') || productName.includes('minutos')) {
          const minutesMatch = productName.match(/(\d+)\s*(Minutos|minutos)/);
          if (minutesMatch) {
            const minutes = parseInt(minutesMatch[1]);
            // Converte minutos para horas e arredonda para 4 casas decimais
            contractedHours = parseFloat((minutes / 60).toFixed(4));
          }
        } 
        // Verifica se é em horas
        else {
          const hoursMatch = productName.match(/(\d+)\s*(Hora|hora|Horas|horas)?/);
          contractedHours = hoursMatch ? parseFloat(parseFloat(hoursMatch[1]).toFixed(4)) : 1;
        }
        
        const jumpData: any = {
          customer: sc.customer.customerId,
          contracted_hours: contractedHours,
          start_time: new Date().toISOString(),
          company: companyId,
          product_id: sc.product!.id,
          cash_register: currentCashRegister?.id,
        };

        // Se for dependente, adiciona o ID do dependente
        if (sc.customer.tipo === 'Dependente' && sc.customer.dependenteId) {
          jumpData.dependente = sc.customer.dependenteId;
        }

        return jumpData;
      });

      // Enviar dados para o backend (criará múltiplos jumps no mesmo pedido)
      const response = await jumpUsageService.createMultiple(jumpsData, companyId);

      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar uso do jump');
      }

      // Fecha o modal imediatamente e atualiza os dados
      handleCloseJumpModal();
      loadActiveJumps();
      loadOrders(); // Atualizar lista de comandas
      
      // Mostra mensagem de sucesso via toast
      toast.success('Uso do jump iniciado com sucesso para todos os clientes!');
    } catch (err: any) {
      console.error('Error creating jump:', err);
      setError(err.message || 'Erro ao criar uso do jump');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomerOptions = customerOptions.filter(option =>
    option.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.cpf && option.cpf.includes(searchTerm))
  );

  // Filtro para clientes agrupados com dependentes
  const filteredCustomersWithDependents = useMemo(() => {
    if (!searchTerm) return customersWithDependents;
    
    return customersWithDependents
      .map(cwd => ({
        ...cwd,
        dependents: cwd.dependents.filter(dep =>
          dep.nome.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }))
      .filter(cwd =>
        cwd.customer.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cwd.customer.cpf && cwd.customer.cpf.includes(searchTerm)) ||
        cwd.dependents.length > 0
      );
  }, [customersWithDependents, searchTerm]);

  // Função auxiliar para parsear duração (precisa estar antes de ser usada)
  const parseDuration = (duration: string): number => {
    // Parse ISO 8601 duration format (PT1H30M45S) ou formato HH:MM:SS
    let totalSeconds = 0;
    
    // Tenta formato HH:MM:SS primeiro
    if (duration.includes(':')) {
      const parts = duration.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
      }
    }
    
    // Fallback para ISO 8601 duration format (PT1H30M45S)
    const hoursMatch = duration.match(/(\d+)H/);
    const minutesMatch = duration.match(/(\d+)M/);
    const secondsMatch = duration.match(/(\d+)S/);
    
    if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;
    if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;
    if (secondsMatch) totalSeconds += parseInt(secondsMatch[1]);
    
    return totalSeconds;
  };

  // Função para calcular o horário de fim programado (precisa estar antes do useMemo)
  const calculateScheduledEndTime = (startTime: string, contractedHours: number, timeExtensionAt: string | null = null, totalPausedTime: string = 'PT0S'): Date => {
    // Se há uma extensão de tempo após expiração, time_extension_at JÁ É o novo fim programado
    if (timeExtensionAt) {
      return new Date(timeExtensionAt);
    }
    
    // Caso contrário, calcula normalmente a partir do start_time
    const start = new Date(startTime);
    let end = new Date(start.getTime() + contractedHours * 60 * 60 * 1000);
    
    // Adiciona o tempo pausado ao fim programado (para verificar se expirou)
    if (totalPausedTime && totalPausedTime !== 'PT0S') {
      const pausedSeconds = parseDuration(totalPausedTime);
      end = new Date(end.getTime() + pausedSeconds * 1000);
    }
    
    return end;
  };

  const filteredJumps = useMemo(() => {
    let filtered = [...activeJumps];

    // Filtro por busca (nome ou CPF)
    if (jumpSearchTerm) {
      filtered = filtered.filter(jump => 
        getDisplayName(jump).toLowerCase().includes(jumpSearchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(jump => {
        if (statusFilter === 'paused') {
          return jump.is_paused;
        }
        
        if (jump.is_paused) return false; // Outros filtros ignoram jumps pausados
        
        const start = new Date(jump.start_time);
        const contractedMillis = jump.contracted_hours * 60 * 60 * 1000;
        const originalEnd = new Date(start.getTime() + contractedMillis);
        
        // Para verificar se expirou, considerar o tempo pausado
        const scheduledEndWithPause = calculateScheduledEndTime(jump.start_time, jump.contracted_hours, jump.time_extension_at, jump.total_paused_time);
        if (currentTime >= scheduledEndWithPause) {
          return statusFilter === 'expired';
        }
        
        // Para cálculo de porcentagem, usar tempo original (sem pausas)
        const totalDuration = originalEnd.getTime() - start.getTime();
        let elapsed = currentTime.getTime() - start.getTime();
        
        // Desconta o tempo pausado do elapsed
        if (jump.total_paused_time && jump.total_paused_time !== 'PT0S') {
          const pausedSeconds = parseDuration(jump.total_paused_time);
          elapsed -= pausedSeconds * 1000;
        }
        
        const percentageElapsed = (elapsed / totalDuration) * 100;

        switch (statusFilter) {
          case 'warning':
            return percentageElapsed >= 50 && percentageElapsed < 100;
          case 'active':
            return percentageElapsed < 50;
          default:
            return true;
        }
      });
    }

    // Ordenar por data de início (mais antigo primeiro)
    return filtered.sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }, [activeJumps, jumpSearchTerm, statusFilter, currentTime]);

  const calculateElapsedTime = (startTime: string, isPaused: boolean = false, pausedAt: string | null = null, totalPausedTime: string = 'PT0S'): string => {
    const start = new Date(startTime);
    let endTime = currentTime;
    
    // Se está pausado, usa o momento da pausa como "fim"
    if (isPaused && pausedAt) {
      endTime = new Date(pausedAt);
    }
    
    // Calcula tempo decorrido
    let diff = endTime.getTime() - start.getTime();
    
    // Desconta o tempo pausado acumulado (formato ISO 8601 duration: PT1H30M)
    if (totalPausedTime && totalPausedTime !== 'PT0S') {
      const pausedSeconds = parseDuration(totalPausedTime);
      diff -= pausedSeconds * 1000;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Nova função para calcular tempo restante (countdown)
  const calculateRemainingTime = (startTime: string, contractedHours: number, timeExtensionAt: string | null = null, isPaused: boolean = false, pausedAt: string | null = null, totalPausedTime: string = 'PT0S'): string => {
    let currentTimeForCalc = currentTime;
    
    // Se está pausado, usa o momento da pausa como "tempo atual"
    if (isPaused && pausedAt) {
      currentTimeForCalc = new Date(pausedAt);
    }
    
    let diff: number;
    
    // Se há extensão de tempo (time_extension_at), usa uma lógica diferente
    if (timeExtensionAt) {
      // time_extension_at já é o novo fim programado calculado pelo backend
      const extensionEnd = new Date(timeExtensionAt);
      diff = extensionEnd.getTime() - currentTimeForCalc.getTime();
      
      
      // Para extensões, não precisamos ajustar o tempo pausado pois o backend
      // já calculou o novo fim considerando que o jump estava expirado
    } else {
      // Lógica normal: calcula baseado no tempo contratado
      const start = new Date(startTime);
      const scheduledEnd = new Date(start.getTime() + contractedHours * 60 * 60 * 1000);
      diff = scheduledEnd.getTime() - currentTimeForCalc.getTime();
      
      // Adiciona o tempo pausado de volta (só para jumps sem extensão)
      if (totalPausedTime && totalPausedTime !== 'PT0S') {
        const pausedSeconds = parseDuration(totalPausedTime);
        diff += pausedSeconds * 1000;
      }
    }
    
    // Se o tempo já esgotou, retorna 00:00:00
    if (diff <= 0) {
      return '00:00:00';
    }
    
    // Converte para horas, minutos e segundos
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Formata como HH:MM:SS
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;;
  };

  const getStatusIcon = (startTime: string, contractedHours: number, timeExtensionAt: string | null = null, timeExtraHours: number | null = null, isPaused: boolean = false, pausedAt: string | null = null, totalPausedTime: string = 'PT0S') => {
    const scheduledEnd = calculateScheduledEndTime(startTime, contractedHours, timeExtensionAt, totalPausedTime);
    const start = new Date(startTime);

    // Calcula o fim programado ORIGINAL (sem extensões)
    const originalScheduledEnd = new Date(start.getTime() + contractedHours * 60 * 60 * 1000);
    
    // Se está pausado, usa o momento da pausa como "tempo atual"
    let currentTimeForCalc = currentTime;
    if (isPaused && pausedAt) {
      currentTimeForCalc = new Date(pausedAt);
    }
    
    // Verifica se o tempo já esgotou com base no NOVO fim programado (usando currentTimeForCalc)
    const isExpired = currentTimeForCalc >= scheduledEnd;
    
    if (isExpired) {
      // Tempo esgotado
      return {
        bgColor: '#c92127', // Vermelho Forte
        color: '#ffffff', // Texto Branco
        label: 'Tempo esgotado',
        cardClassName: 'jump-card--expired',
      };
    }
    
    // Se há extensão de tempo, recalcula a porcentagem baseada apenas na extensão
    if (timeExtensionAt) {
      
      const remainingTime = scheduledEnd.getTime() - currentTimeForCalc.getTime();
      const hasExpired = currentTimeForCalc > originalScheduledEnd;
      
      let percentageRemaining: number;
      
      if (hasExpired && timeExtraHours) {
        // Jump expirou E sabemos quanto tempo extra foi adicionado
        // Cálculo correto: porcentagem baseada apenas no tempo extra
        const extraTimeMs = timeExtraHours * 3600000; // Converte horas para ms
        percentageRemaining = (remainingTime / extraTimeMs) * 100;
      } else {
        // Lógica padrão para extensões normais ou quando não temos timeExtraHours
        const totalExtensionTime = scheduledEnd.getTime() - originalScheduledEnd.getTime();
        percentageRemaining = (remainingTime / totalExtensionTime) * 100;
      }

      if (percentageRemaining < 50) {
        return {
          bgColor: '#ff9500', // Laranja Fluorescente Mais Claro
          color: '#000000', // Texto Preto para contraste
          label: 'Menos de 50% restante',
          cardClassName: 'jump-card--warning',
        };
      } else {
        return {
          bgColor: '#00ff88', // Verde Fluorescente
          color: '#000000', // Texto Preto para contraste
          label: 'Mais de 50% restante',
          cardClassName: 'jump-card--success',
        };
      }
    }

    // Lógica padrão para jumps sem extensão ou que ainda não atingiram o tempo original
    // IMPORTANTE: Para cálculo de porcentagem, usar o tempo contratado ORIGINAL (sem pausas)
    const originalEnd = new Date(start.getTime() + contractedHours * 60 * 60 * 1000);
    const totalDuration = originalEnd.getTime() - start.getTime();
    let elapsed = currentTimeForCalc.getTime() - start.getTime();
    
    // Desconta o tempo pausado do elapsed
    if (totalPausedTime && totalPausedTime !== 'PT0S') {
      const pausedSeconds = parseDuration(totalPausedTime);
      
      // Log apenas quando há tempo pausado
      console.log("🎯 JUMP COM PAUSA - Cálculo da cor:");
      console.log("  totalPausedTime:", totalPausedTime);
      console.log("  pausedSeconds:", pausedSeconds, "s");
      console.log("  elapsed ANTES:", elapsed / 1000, "s");
      
      elapsed -= pausedSeconds * 1000;
      
      console.log("  elapsed DEPOIS:", elapsed / 1000, "s");
      console.log("  totalDuration (original, sem pausas):", totalDuration / 1000, "s");
      console.log("  percentageElapsed:", ((elapsed / totalDuration) * 100).toFixed(2), "%");
    }
    
    const percentageElapsed = (elapsed / totalDuration) * 100;

    if (percentageElapsed >= 50) {
      // Falta menos de 50%
      if (totalPausedTime && totalPausedTime !== 'PT0S') {
      }
      return {
        bgColor: '#ff9500', // Laranja Fluorescente Mais Claro
        color: '#000000', // Texto Preto para contraste
        label: 'Menos de 50% restante',
        cardClassName: 'jump-card--warning',
      };
    } else {
      // Falta mais de 50%
      if (totalPausedTime && totalPausedTime !== 'PT0S') {
      }
      return {
        bgColor: '#00ff88', // Verde Fluorescente
        color: '#000000', // Texto Preto para contraste
        label: 'Mais de 50% restante',
        cardClassName: 'jump-card--success',
      };
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Recarrega as comandas sempre que filtros ou caixa mudarem
  useEffect(() => {
    if (activeTab === 'comandas') {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordersDateFrom, ordersDateTo, ordersShowClosed, activeTab, currentCashRegister?.id]);

  // Scroll e destaque automático do cliente recém-criado
  useEffect(() => {
    if (showJumpModal && newlyCreatedCustomerId) {
      // Aguarda um pouco para garantir que o DOM foi renderizado
      setTimeout(() => {
        const element = document.getElementById('newly-created-customer');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Expande os dependentes automaticamente
          setExpandedCustomers(prev => [...prev, newlyCreatedCustomerId]);
        }
        // Remove o destaque após 5 segundos
        setTimeout(() => {
          setNewlyCreatedCustomerId(null);
        }, 5000);
      }, 300);
    }
  }, [showJumpModal, newlyCreatedCustomerId]);

  if (loading) {
    return (
      <Layout>
        <div className="dashboard-container">
          <div className="dashboard-loading">Carregando dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-container">
        {/* Se não tem caixa aberto, mostra tela para abrir */}
        {!currentCashRegister ? (
          <div className="cash-register-closed" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            gap: '20px'
          }}>
            <FiDollarSign size={80} style={{ color: 'var(--primary-color)' }} />
            <h1>Caixa Fechado</h1>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>
              Você precisa abrir o caixa antes de começar a atender
            </p>
            <button
              className="btn btn-primary btn-large"
              onClick={() => {
                handleOpenCashModal();
              }}
              style={{
                padding: '12px 24px',
                fontSize: '1.1rem',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiDollarSign /> Abrir Caixa
            </button>
          </div>
        ) : (
          <>
            <div className="dashboard-header">
              <div>
                <h1>Dashboard Operacional</h1>
                <p className="dashboard-subtitle">
                  Caixa aberto em {new Date(currentCashRegister.opened_at).toLocaleString('pt-BR')} • 
                  Valor inicial: R$ {parseFloat(currentCashRegister.opening_amount).toFixed(2)}
                </p>
              </div>
              <div className="header-actions">
                <Button
                  variant="outline"
                  size="medium"
                  onClick={handleOpenWithdrawalModal}
                  style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: 'white' }}
                >
                  <FiMinus /> Sangria
                </Button>
                <Button
                  variant="outline"
                  size="medium"
                  onClick={handleCloseCashModal}
                >
                  <FiDollarSign /> Fechar Caixa
                </Button>
                <Button
                  variant="primary"
                  size="medium"
                  onClick={handleOpenJumpModal}
                >
                  <FiActivity /> Iniciar Jump
                </Button>
              </div>
            </div>

        {success && (
          <Alert variant="success">
            {success}
          </Alert>
        )}

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Abas do Dashboard */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'jumps' ? 'active' : ''}`}
            onClick={() => setActiveTab('jumps')}
          >
            <FiActivity /> Jumps em Andamento
            <span className="tab-count">{activeJumps.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'comandas' ? 'active' : ''}`}
            onClick={() => setActiveTab('comandas')}
          >
            <FiShoppingCart /> Comandas
            <span className="tab-count">{orders.length}</span>
          </button>
        </div>

        {/* Conteúdo da aba Jumps */}
        {activeTab === 'jumps' && (
          <div className="active-jumps-section">
            <div className="section-header">
              <h2>Jumps em Andamento</h2>
              <span className="jump-count">{filteredJumps.length} de {activeJumps.length} {activeJumps.length === 1 ? 'jump' : 'jumps'}</span>
              <button
                className="jumps-expand-btn"
                onClick={async () => {
                  if (!currentCashRegister?.id) return;
                  setShowJumpsExpandModal(true);
                  setModalLoading(true);
                  try {
                    const response = await jumpUsageService.list(
                      companyId ?? undefined,
                      currentCashRegister.id
                    );
                    if (response.success && response.data) {
                      const cashRegisterId = currentCashRegister.id;
                      const finished = response.data.filter(
                        (j: JumpUsage) =>
                          j.finished && j.order_cash_register_id === cashRegisterId
                      );
                      setModalFinishedJumps(finished);
                    }
                  } catch (e) {
                    console.error('Erro ao carregar jumps finalizados:', e);
                    setModalFinishedJumps([]);
                  } finally {
                    setModalLoading(false);
                  }
                }}
                title="Expandir em tela cheia"
              >
                <FiMaximize2 size={20} />
                <span>Expandir</span>
              </button>
            </div>

          {/* Barra de Pesquisa e Filtros */}
          <div className="jumps-filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar por nome do cliente..."
                value={jumpSearchTerm}
                onChange={(e) => setJumpSearchTerm(e.target.value)}
                className="search-input"
              />
              {jumpSearchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setJumpSearchTerm('')}
                  title="Limpar busca"
                >
                  <FiX />
                </button>
              )}
            </div>

            <div className="status-filters">
              <button
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Todos
              </button>
              <button
                className={`filter-btn filter-btn--active ${statusFilter === 'active' ? 'active' : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                🟢 Normal
              </button>
              <button
                className={`filter-btn filter-btn--warning ${statusFilter === 'warning' ? 'active' : ''}`}
                onClick={() => setStatusFilter('warning')}
              >
                🟠 Alerta
              </button>
              <button
                className={`filter-btn filter-btn--expired ${statusFilter === 'expired' ? 'active' : ''}`}
                onClick={() => setStatusFilter('expired')}
              >
                🔴 Expirado
              </button>
              <button
                className={`filter-btn filter-btn--paused ${statusFilter === 'paused' ? 'active' : ''}`}
                onClick={() => setStatusFilter('paused')}
              >
                ⏸️ Pausado
              </button>
            </div>
          </div>

          {activeJumps.length === 0 ? (
            <div className="empty-jumps">
              <FiClock size={48} />
              <p>Nenhum jump em andamento no momento</p>
              <Button
                variant="primary"
                size="medium"
                onClick={() => navigate('/customers')}
              >
                Cadastrar Novo Cliente
              </Button>
            </div>
          ) : filteredJumps.length === 0 ? (
            <div className="empty-jumps">
              <FiSearch size={48} />
              <p>Nenhum jump encontrado com os filtros aplicados</p>
              <Button
                variant="outline"
                size="medium"
                onClick={() => {
                  setJumpSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="jumps-grid">
              {filteredJumps.map((jump) => {
                const status = getStatusIcon(jump.start_time, jump.contracted_hours, jump.time_extension_at, jump.time_extra_hours, jump.is_paused, jump.paused_at, jump.total_paused_time);
                const scheduledEnd = calculateScheduledEndTime(jump.start_time, jump.contracted_hours, jump.time_extension_at, jump.total_paused_time);
                const elapsedTime = calculateElapsedTime(jump.start_time, jump.is_paused, jump.paused_at, jump.total_paused_time);
                const remainingTime = calculateRemainingTime(jump.start_time, jump.contracted_hours, jump.time_extension_at, jump.is_paused, jump.paused_at, jump.total_paused_time);
                
                
                // Um jump está com tempo esgotado se:
                // 1. Não está finalizado
                // 2. Não está pausado 
                // 3. O tempo restante é 00:00:00
                const isTimeExhausted = !jump.finished && !jump.is_paused && remainingTime === '00:00:00';

                return (
                  <div 
                    key={jump.id} 
                    className={`jump-card ${status.cardClassName} ${jump.is_paused ? 'jump-card--paused' : ''}`}
                    onClick={() => handleOpenFinishModal(jump)}
                  >
                    {jump.is_paused && (
                      <div className="paused-badge">
                        <FiPause /> PAUSADO
                      </div>
                    )}
                    <div className="card-status-bar" style={{ backgroundColor: status.bgColor }}></div>
                    
                    <div className="jump-card-content">
                      <div className="jump-card-header">
                        <h3 className="customer-name">
                          {getDisplayName(jump)}
                        </h3>
                      </div>
                      
                      <div className="jump-card-body">
                        {jump.order_number && (
                          <div className="info-row">
                            <FiShoppingCart className="info-icon" />
                            <span className="info-label">Comanda:</span>
                            <span className="info-value">#{jump.order_number}</span>
                          </div>
                        )}
                        <div className="info-row">
                          <FiCalendar className="info-icon" />
                          <span className="info-label">Tempo:</span>
                          <span className="info-value">{formatContractedHours(jump.contracted_hours)}</span>
                        </div>
                        <div className="info-row">
                          <FiPlay className="info-icon" />
                          <span className="info-label">Início:</span>
                          <span className="info-value">{formatTime(new Date(jump.start_time))}</span>
                        </div>
                        <div className="info-row">
                          <FiBarChart2 className="info-icon" />
                          <span className="info-label">Fim Programado:</span>
                          <span className="info-value">{formatTime(scheduledEnd)}</span>
                        </div>
                      </div>

                      <div className="jump-card-footer">
                        <div className="timer">
                          <FiClock size={20} className="timer-icon" />
                          <div className="timer-info">
                            <span className="timer-label">{isTimeExhausted ? 'TEMPO ESGOTADO' : 'Tempo Restante'}</span>
                            <span className="timer-value">{isTimeExhausted ? 'TEMPO ESGOTADO' : remainingTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        )}

        {/* Conteúdo da aba Comandas */}
        {activeTab === 'comandas' && (
          <div className="active-jumps-section">
            <div className="section-header" style={{ gap: 12 }}>
              <h2>{ordersShowClosed ? 'Comandas Fechadas' : 'Comandas Abertas'}</h2>
              <span className="jump-count">{orders.length} {orders.length === 1 ? 'comanda' : 'comandas'}</span>
            </div>

            {/* Filtro de Comandas */}
            <div className="jumps-filters">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Buscar por nome ou CPF do cliente..."
                  value={comandaSearchTerm}
                  onChange={(e) => setComandaSearchTerm(e.target.value)}
                  className="search-input"
                />
                {comandaSearchTerm && (
                  <button 
                    className="clear-search"
                    onClick={() => setComandaSearchTerm('')}
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              <div className="date-filters">
                <div className="date-input-group">
                  {/* <label className="date-label">De</label> */}
                  <div className="date-input-wrapper">
                    <FiCalendar className="date-icon" />
                    <input
                      type="date"
                      className="date-input"
                      value={ordersDateFrom}
                      onChange={(e) => setOrdersDateFrom(e.target.value)}
                    />
                  </div>
                </div>
                <span className="date-separator">-</span>
                <div className="date-input-group">
                  {/* <label className="date-label">Até</label> */}
                  <div className="date-input-wrapper">
                    <FiCalendar className="date-icon" />
                    <input
                      type="date"
                      className="date-input"
                      value={ordersDateTo}
                      onChange={(e) => setOrdersDateTo(e.target.value)}
                    />
                  </div>
                </div>
                <div className="filter-switch">
                  <label>
                    <input type="checkbox" checked={ordersShowClosed} onChange={(e) => setOrdersShowClosed(e.target.checked)} /> 
                    <span className="switch-label">Finalizadas</span>
                  </label>
                </div>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="empty-jumps">
                <FiShoppingCart size={64} />
                <p>Nenhuma comanda aberta no momento</p>
              </div>
            ) : (
              <div className="jumps-grid">
                {filteredOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="jump-card"
                    onClick={() => handleOpenComandaModal(order)}
                  >
                    <div className="card-status-bar" style={{ backgroundColor: '#16a34a' }}></div>
                    
                    <div className="jump-card-content">
                      <div className="jump-card-header">
                        <h3 className="customer-name">
                          Comanda #{order.order_number || '---'}
                        </h3>
                      </div>
                      
                      <div className="jump-card-body">
                        <div className="info-row">
                          <FiUser className="info-icon" />
                          <span className="info-label">Cliente:</span>
                          <span className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {order.customer_name || order.dependente_name || ''}
                            {order.is_pcd && (
                              <span style={{ 
                                fontSize: '10px', 
                                fontWeight: 700, 
                                padding: '2px 5px', 
                                borderRadius: '3px', 
                                backgroundColor: '#fef3c7', 
                                color: '#92400e'
                              }}>PCD</span>
                            )}
                          </span>
                        </div>
                        <div className="info-row">
                          <FiCalendar className="info-icon" />
                          <span className="info-label">Criada em:</span>
                          <span className="info-value">{new Date(order.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="info-row">
                          <FiShoppingCart className="info-icon" />
                          <span className="info-label">Itens:</span>
                          <span className="info-value">{order.items?.length || 0}</span>
                        </div>
                        <div className="info-row">
                          <FiDollarSign className="info-icon" />
                          <span className="info-label">Total:</span>
                          <span className="info-value">R$ {parseFloat(order.total || '0').toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal de Iniciar Jump */}
        {showJumpModal && (
          <div className="modal-overlay" onClick={handleCloseJumpModal}>
            <div className="modal-content jump-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2><FiActivity /> Iniciar Uso do Jump</h2>
                <button className="modal-close" onClick={handleCloseJumpModal}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                {/* Seção de seleção de cliente */}
                <div className="jump-customer-picker">
                  {/* Cabeçalho da busca */}
                  <div className="jump-customer-picker__search-header">
                    <div className="jump-customer-picker__search-input-wrapper">
                      <FiSearch />
                      <input
                        type="text"
                        placeholder="Buscar por nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={handleOpenQuickCustomerModal}
                      className="jump-customer-picker__new-btn"
                    >
                      <FiPlus /> Novo Cliente
                    </Button>
                  </div>

                  {/* Lista de Clientes com Dependentes */}
                  <div className="jump-customer-picker__list">
                    {filteredCustomersWithDependents.length === 0 ? (
                      <div className="jump-customer-picker__no-results">
                        <FiUserX size={40} />
                        <strong>Nenhum cliente encontrado</strong>
                        <span>Tente outro termo ou cadastre um novo cliente.</span>
                      </div>
                    ) : (
                      filteredCustomersWithDependents.map((cwd) => (
                        <div 
                          key={`customer-group-${cwd.customer.id}`} 
                          className={`jump-customer-picker__group ${newlyCreatedCustomerId === cwd.customer.id ? 'newly-created' : ''}`}
                          id={newlyCreatedCustomerId === cwd.customer.id ? 'newly-created-customer' : undefined}
                        >
                          {/* Cliente Principal */}
                          <div
                            className={`jump-customer-picker__row ${selectedCustomerOption?.id === cwd.customer.id && selectedCustomerOption?.tipo === 'Cliente' ? 'selected' : ''}`}
                            onClick={() => setSelectedCustomerOption(cwd.customer)}
                          >
                            <div className="jump-customer-picker__avatar">
                              {cwd.customer.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="jump-customer-picker__info">
                              <span className="jump-customer-picker__name">
                                {cwd.customer.nome}
                                {cwd.customer.pcd && <span className="jump-customer-picker__badge pcd">PCD</span>}
                              </span>
                              <span className="jump-customer-picker__details">
                                {cwd.customer.cpf ? `CPF: ${cwd.customer.cpf}` : 'Sem CPF'}
                              </span>
                            </div>
                            <div className="jump-customer-picker__actions">
                              {selectedCustomerOption?.id === cwd.customer.id && selectedCustomerOption?.tipo === 'Cliente' && (
                                <FiCheckCircle className="jump-customer-picker__check-icon" />
                              )}
                              {cwd.dependents.length > 0 && (
                                <>
                                  <button
                                    className="jump-customer-picker__action-btn add-all"
                                    onClick={(e) => { e.stopPropagation(); handleAddCustomerWithDependents(cwd.customer.id); }}
                                    title="Adicionar titular e todos os dependentes"
                                  >
                                    <FiUsers size={14} /> Todos ({cwd.dependents.length + 1})
                                  </button>
                                  <button
                                    className="jump-customer-picker__action-btn expand"
                                    onClick={(e) => { e.stopPropagation(); toggleCustomerExpansion(cwd.customer.id); }}
                                  >
                                    {expandedCustomers.includes(String(cwd.customer.id)) ? <FiChevronUp /> : <FiChevronDown />}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Lista de Dependentes (expandida) */}
                          {expandedCustomers.includes(cwd.customer.id) && cwd.dependents.length > 0 && (
                            <div className="jump-customer-picker__dependents">
                              {cwd.dependents.map((dep) => (
                                <div
                                  key={`dependente-${dep.id}`}
                                  className={`jump-customer-picker__row dependent ${selectedCustomerOption?.id === dep.id && selectedCustomerOption?.tipo === 'Dependente' ? 'selected' : ''}`}
                                  onClick={() => setSelectedCustomerOption(dep)}
                                >
                                  <div className="jump-customer-picker__avatar small">
                                    {dep.nome.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="jump-customer-picker__info">
                                    <span className="jump-customer-picker__name">
                                      {dep.nome}
                                      {dep.pcd && <span className="jump-customer-picker__badge pcd">PCD</span>}
                                    </span>
                                    <span className="jump-customer-picker__details">
                                      Dependente
                                    </span>
                                  </div>
                                  <div className="jump-customer-picker__actions">
                                    {selectedCustomerOption?.id === dep.id && selectedCustomerOption?.tipo === 'Dependente' && (
                                      <FiCheckCircle className="jump-customer-picker__check-icon" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Selecionar Produto (Tempo de Uso) */}
                <div className="form-group">
                  <label>Selecione o Tempo de Uso</label>
                  {products.length === 0 ? (
                    <div className="no-products">
                      <p>Nenhum produto de tempo de uso cadastrado</p>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => {
                          handleCloseJumpModal();
                          navigate('/products');
                        }}
                      >
                        <FiPlus /> Cadastrar Produtos
                      </Button>
                    </div>
                  ) : (
                    <div className="products-selector">
                      {products.map((product) => (
                        <button
                          key={product.id}
                          className={`product-btn ${selectedProduct?.id === product.id ? 'active' : ''}`}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <div className="product-btn-name">{product.name}</div>
                          <div className="product-btn-price">R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botão para adicionar cliente à lista */}
                <div style={{ marginTop: '16px' }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCustomerToList}
                    disabled={!selectedCustomerOption || !selectedProduct}
                    style={{ width: '100%' }}
                  >
                    <FiPlus /> Adicionar Cliente à Lista
                  </Button>
                </div>

                {/* Lista de clientes selecionados */}
                {selectedCustomers.length > 0 && (
                  <div className="selected-customers-list" style={{ marginTop: '20px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #eaecf0' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#101828', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiCheckCircle size={20} color="var(--primary-color, #001166)" />
                      Clientes Selecionados ({selectedCustomers.length})
                    </h3>
                    {selectedCustomers.map((sc, index) => (
                      <div key={index} className="selected-customer-item" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #eaecf0',
                        gap: '12px'
                      }}>
                        {/* Header com nome e botão remover */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#101828', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {sc.customer.nome}
                              {sc.customer.pcd && (
                                <span style={{ 
                                  fontSize: '11px', 
                                  fontWeight: 700, 
                                  padding: '2px 6px', 
                                  borderRadius: '4px', 
                                  backgroundColor: '#fef3c7', 
                                  color: '#92400e'
                                }}>PCD</span>
                              )}
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', backgroundColor: sc.customer.tipo === 'Cliente' ? '#e0f2fe' : '#fefce8', color: sc.customer.tipo === 'Cliente' ? '#0369a1' : '#a16207', marginTop: '4px', display: 'inline-block' }}>
                              {sc.customer.tipo}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveCustomerFromList(index)}
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                        
                        {/* Seletor de produto */}
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#667085', marginBottom: '6px', display: 'block' }}>
                            Tempo de Uso
                          </label>
                          <select
                            value={sc.product?.id || ''}
                            onChange={(e) => {
                              const product = products.find(p => String(p.id) === e.target.value);
                              if (product) {
                                handleUpdateCustomerProduct(index, product);
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              backgroundColor: 'white',
                              cursor: 'pointer'
                            }}
                          >
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {error && <Alert variant="error">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
              </div>

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseJumpModal}
                >
                  <FiX /> Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCreateJump}
                  disabled={selectedCustomers.length === 0 || loading}
                >
                  <FiSave /> {loading ? 'Iniciando...' : `Iniciar Jump (${selectedCustomers.length})`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Restante do componente... */}

        {/* Modal de Finalizar Jump */}
        {showFinishModal && selectedJump && (() => {
          return (
            <div className="modal-overlay" onClick={handleCloseFinishModal}>
              <div className="modal-content jump-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2><FiCheckSquare /> Finalizar Jump</h2>
                  <button className="modal-close" onClick={handleCloseFinishModal}>
                    <FiX size={24} />
                  </button>
                </div>

                <div className="modal-body">
                  {/* Informações do Jump */}
                  <div className="modal-section">
                    <div className="jump-info-header">
                      <h3>{getDisplayName(selectedJump)}</h3>
                    </div>
                    <div className="info-grid">
                      <div className="info-item">
                        <FiClock />
                        <div>
                          <span className="info-item-label">Início</span>
                          <span className="info-item-value">
                            {formatTime(new Date(selectedJump.start_time))}
                          </span>
                        </div>
                      </div>

                      <div className="info-item">
                        <FiClock />
                        <div>
                          <span className="info-item-label">Tempo Restante</span>
                          <span className="info-item-value">
                            {(() => {
                              const remaining = calculateRemainingTime(selectedJump.start_time, selectedJump.contracted_hours, selectedJump.time_extension_at, selectedJump.is_paused, selectedJump.paused_at, selectedJump.total_paused_time);
                              const isExpired = !selectedJump.finished && !selectedJump.is_paused && remaining === '00:00:00';
                              
                              if (isExpired) {
                                return 'TEMPO ESGOTADO';
                              }
                              return remaining + (selectedJump.is_paused ? ' (PAUSADO)' : '');
                            })()}
                          </span>
                        </div>
                      </div>

                      <div className="info-item">
                        <FiPlay />
                        <div>
                          <span className="info-item-label">Tempo Decorrido</span>
                          <span className="info-item-value">
                            {calculateElapsedTime(selectedJump.start_time, selectedJump.is_paused, selectedJump.paused_at, selectedJump.total_paused_time)}
                          </span>
                        </div>
                      </div>

                      <div className="info-item">
                        <FiCalendar />
                        <div>
                          <span className="info-item-label">Tempo Contratado</span>
                          <span className="info-item-value">
                            {formatContractedHours(selectedJump.contracted_hours)}
                          </span>
                        </div>
                      </div>

                      <div className="info-item">
                        <FiBarChart2 />
                        <div>
                          <span className="info-item-label">Fim Programado</span>
                          <span className="info-item-value">
                            {formatTime(calculateScheduledEndTime(selectedJump.start_time, selectedJump.contracted_hours, selectedJump.time_extension_at, selectedJump.total_paused_time))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Adicionar Horas Extras */}
                  <div className="modal-section">
                    <h4 className="modal-section-title">Adicionar Horas Extras</h4>
                    <p className="modal-section-description">
                      Cliente deseja contratar mais tempo? Escolha um pacote abaixo.
                    </p>
                    
                    {products.length === 0 ? (
                      <div className="no-products">
                        <p>Nenhum produto de tempo de uso cadastrado</p>
                      </div>
                    ) : (
                      <div className="add-hours-buttons">
                        {products.map(product => (
                          <button
                            key={product.id}
                            className="add-hour-btn"
                            onClick={() => {
                              setPendingTimeProduct(product);
                              setShowConfirmAddTime(true);
                            }}
                            disabled={loading}
                          >
                            <FiPlus /> {product.name}
                            <span className="add-hour-price">
                              R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {additionalHours > 0 && (
                      <div className="hours-added-badge">
                        <FiCheckCircle /> {additionalHours} hora(s) adicionada(s)
                      </div>
                    )}
                  </div>

                  {/* Adicionar Consumíveis */}
                  <div className="modal-section">
                    <h4 className="modal-section-title"><FiShoppingCart /> Adicionar Consumíveis</h4>
                    <p className="modal-section-description">
                      Selecione produtos para adicionar à comanda do cliente.
                    </p>

                    {consumableProducts.length === 0 ? (
                      <div className="no-consumables">
                        <p>Nenhum produto consumível cadastrado</p>
                      </div>
                    ) : (
                      <div className="consumable-form">
                        <div className="consumable-select-row">
                          <select
                            value={selectedConsumable?.id || ''}
                            onChange={(e) => {
                              const productId = e.target.value;
                              const product = consumableProducts.find(p => String(p.id) === productId);
                              setSelectedConsumable(product || null);
                            }}
                            className="consumable-select"
                          >
                            <option value="">Selecione um produto</option>
                            {consumableProducts.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                              </option>
                            ))}
                          </select>
                          
                          <div className="quantity-stepper">
                            <button onClick={() => setConsumableQuantity(q => Math.max(1, q - 1))}><FiMinus /></button>
                            <span>{consumableQuantity}</span>
                            <button onClick={() => setConsumableQuantity(q => q + 1)}><FiPlus /></button>
                          </div>
                          
                          <button
                            className="add-consumable-btn"
                            onClick={handleAddConsumable}
                            disabled={!selectedConsumable}
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Adicionar Equipamentos */}
                  <div className="modal-section">
                    <h4 className="modal-section-title"><FiPackage /> Adicionar Equipamentos</h4>
                    <p className="modal-section-description">
                      Selecione um equipamento e sua unidade disponível para adicionar à comanda.
                    </p>

                    {equipmentProducts.length === 0 ? (
                      <div className="no-consumables">
                        <p>Nenhum equipamento cadastrado</p>
                      </div>
                    ) : (
                      <div className="consumable-form">
                        <div className="consumable-select-row">
                          <select
                            value={selectedEquipment?.id || ''}
                            onChange={(e) => {
                              const productId = e.target.value;
                              const product = equipmentProducts.find(p => String(p.id) === productId);
                              setSelectedEquipment(product || null);
                              setSelectedUnit(null);
                              setAvailableUnits([]);
                              if (product) {
                                loadAvailableUnits(product.id);
                              }
                            }}
                            className="consumable-select"
                          >
                            <option value="">Selecione um equipamento</option>
                            {equipmentProducts.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                              </option>
                            ))}
                          </select>
                          
                          <select
                            value={selectedUnit?.id || ''}
                            onChange={(e) => {
                              const unitId = e.target.value;
                              const unit = availableUnits.find(u => String(u.id) === unitId);
                              setSelectedUnit(unit || null);
                            }}
                            className="consumable-select"
                            disabled={!selectedEquipment || loadingUnits}
                          >
                            <option value="">
                              {loadingUnits ? 'Carregando...' : 'Selecione a unidade'}
                            </option>
                            {availableUnits.map(unit => (
                              <option key={unit.id} value={unit.id}>
                                Unidade #{unit.number}
                              </option>
                            ))}
                          </select>
                          
                          <button
                            className="add-consumable-btn"
                            onClick={handleAddEquipment}
                            disabled={!selectedEquipment || !selectedUnit || loading}
                          >
                            Adicionar
                          </button>
                        </div>
                        {availableUnits.length === 0 && selectedEquipment && !loadingUnits && (
                          <p style={{ color: '#dc3545', fontSize: '13px', marginTop: '8px' }}>
                            Nenhuma unidade disponível para este equipamento
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="finish-warning">
                    <FiAlertCircle size={20} />
                    <p>Ao finalizar, o tempo adicional (se houver) será calculado automaticamente e adicionado ao pedido. Para gerenciar a comanda completa, acesse a aba "Comandas".</p>
                  </div>
                </div>

                <div className="modal-actions">
                  <div className="modal-actions-left">
                    {selectedJump.is_paused ? (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleResumeJump}
                        disabled={loading}
                      >
                        <FiPlay /> Retomar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePauseJump}
                        disabled={loading}
                      >
                        <FiPause /> Pausar
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenWhatsApp}
                      disabled={loading}
                      style={{ 
                        backgroundColor: '#25D366', 
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      <FaWhatsapp size={18} /> WhatsApp
                    </Button>
                  </div>
                  <div className="modal-actions-right">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseFinishModal}
                    >
                      <FiX /> Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => setShowConfirmFinishJump(true)}
                      disabled={loading || selectedJump.is_paused}
                    >
                      <FiCheck /> Finalizar Jump
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Modal de Confirmação - Adicionar Tempo Extra */}
        {showConfirmAddTime && pendingTimeProduct && (
          <div className="modal-overlay" onClick={() => setShowConfirmAddTime(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h2><FiAlertCircle /> Confirmar Adição de Tempo</h2>
                <button className="modal-close" onClick={() => setShowConfirmAddTime(false)}>
                  <FiX />
                </button>
              </div>
              
              <div className="modal-body" style={{ padding: '20px' }}>
                <Alert variant="info">
                  Tem certeza que deseja adicionar <strong>{pendingTimeProduct.name}</strong> por <strong>R$ {parseFloat(pendingTimeProduct.price).toFixed(2).replace('.', ',')}</strong>?
                </Alert>
                
                <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>
                  O tempo extra será adicionado ao jump do cliente e incluído na comanda.
                </p>
              </div>
              
              <div className="modal-actions">
                <Button variant="outline" onClick={() => setShowConfirmAddTime(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setShowConfirmAddTime(false);
                    if (pendingTimeProduct) {
                      handleAddHours(pendingTimeProduct);
                    }
                  }}
                >
                  <FiCheck /> Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação - Finalizar Jump */}
        {showConfirmFinishJump && (
          <div className="modal-overlay" onClick={() => setShowConfirmFinishJump(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h2><FiAlertTriangle /> Confirmar Finalização</h2>
                <button className="modal-close" onClick={() => setShowConfirmFinishJump(false)}>
                  <FiX />
                </button>
              </div>
              
              <div className="modal-body" style={{ padding: '20px' }}>
                <Alert variant="warning">
                  <strong>Atenção:</strong> Tem certeza que deseja finalizar este jump? Esta ação não pode ser desfeita.
                </Alert>
                
                <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>
                  O tempo adicional (se houver) será calculado automaticamente e adicionado à comanda.
                </p>
              </div>
              
              <div className="modal-actions">
                <Button variant="outline" onClick={() => setShowConfirmFinishJump(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setShowConfirmFinishJump(false);
                    handleFinishJump();
                  }}
                >
                  <FiCheck /> Finalizar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Fechar Caixa */}
        {showCloseCashModal && currentCashRegister && (
          <div className="modal-overlay" onClick={handleCancelCloseCash}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
              backgroundColor: 'white',
              maxWidth: '600px'
            }}>
              <div className="modal-header">
                <h2>Fechar Caixa</h2>
                <button className="modal-close" onClick={handleCancelCloseCash}>
                  <FiX />
                </button>
              </div>
              
              <div className="modal-body" style={{ padding: '20px' }}>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>Resumo do Caixa</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Valor Inicial:</span>
                      <strong>R$ {parseFloat(currentCashRegister.opening_amount).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total de Vendas:</span>
                      <strong style={{ color: 'green' }}>R$ {parseFloat(currentCashRegister.total_sales).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Pedidos:</span>
                      <strong>{currentCashRegister.total_orders}</strong>
                    </div>
                    
                    {/* Sangrias */}
                    {cashWithdrawals.length > 0 && (
                      <>
                        <div style={{ 
                          marginTop: '10px', 
                          paddingTop: '10px', 
                          borderTop: '1px dashed #ccc' 
                        }}>
                          <div style={{ 
                            fontWeight: 'bold', 
                            marginBottom: '8px',
                            color: '#ff9800'
                          }}>
                            Sangrias Realizadas:
                          </div>
                          {cashWithdrawals.map((withdrawal: any) => (
                            <div 
                              key={withdrawal.id}
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                fontSize: '13px',
                                marginBottom: '5px',
                                paddingLeft: '10px',
                                color: '#666'
                              }}
                            >
                              <span style={{ maxWidth: '70%' }}>
                                {withdrawal.notes || 'Sangria sem motivo'}
                                <span style={{ fontSize: '11px', color: '#999', marginLeft: '5px' }}>
                                  ({new Date(withdrawal.performed_at).toLocaleString('pt-BR')})
                                </span>
                              </span>
                              <strong style={{ color: '#ff6b6b' }}>
                                - R$ {parseFloat(withdrawal.amount).toFixed(2)}
                              </strong>
                            </div>
                          ))}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px solid #eee',
                            fontSize: '14px'
                          }}>
                            <span><strong>Total de Sangrias:</strong></span>
                            <strong style={{ color: '#ff6b6b' }}>
                              - R$ {cashWithdrawals.reduce((sum: number, w: any) => sum + parseFloat(w.amount), 0).toFixed(2)}
                            </strong>
                          </div>
                        </div>
                      </>
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
                        R$ {parseFloat(currentCashRegister.expected_closing_amount).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Valor Final do Caixa *</label>
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
                  />
                  {closingAmount && (() => {
                    const expectedAmount = parseFloat(currentCashRegister.expected_closing_amount);
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

                <div className="form-group" style={{ marginTop: '15px' }}>
                  <label>
                    Observações sobre o Fechamento
                    {closingAmount && Math.abs(parseFloat(closingAmount) - parseFloat(currentCashRegister.expected_closing_amount)) > 0.01 && (
                      <span style={{ color: 'red', marginLeft: '5px' }}>*</span>
                    )}
                  </label>
                  <textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder={
                      closingAmount && Math.abs(parseFloat(closingAmount) - parseFloat(currentCashRegister.expected_closing_amount)) > 0.01
                        ? "Obrigatório: explique o motivo da diferença no valor"
                        : "Observações sobre o fechamento do caixa (opcional)"
                    }
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: closingAmount && Math.abs(parseFloat(closingAmount) - parseFloat(currentCashRegister.expected_closing_amount)) > 0.01
                        ? '2px solid #ffc107'
                        : '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

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
                      <FiAlertTriangle style={{ marginRight: '8px' }} />
                      Itens Pendentes
                    </h3>
                    <p>Existem itens abertos neste caixa que precisam ser transferidos antes do fechamento:</p>
                    {pendingItems.open_orders_count > 0 && (
                      <p>- {pendingItems.open_orders_count} Comanda(s) Aberta(s)</p>
                    )}
                    {pendingItems.active_jumps_count > 0 && (
                      <p>- {pendingItems.active_jumps_count} Jump(s) Ativo(s)</p>
                    )}
                    <div className="form-group" style={{ marginTop: '15px' }}>
                      <label>Transferir para outro Usuário:</label>
                      <select
                        value={selectedTransferUser?.id || ''}
                        onChange={(e) => {
                          const user = companyUsers.find(u => String(u.id) === e.target.value);
                          setSelectedTransferUser(user || null);
                        }}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
                      >
                        <option value="">Selecione um usuário para transferir</option>
                        {companyUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                padding: '20px',
                borderTop: '1px solid #eee'
              }}>
                <Button
                  variant="outline"
                  onClick={handleCancelCloseCash}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCloseCash}
                  disabled={!!(pendingItems && (pendingItems.open_orders_count > 0 || pendingItems.active_jumps_count > 0) && !selectedTransferUser)}
                >
                  <FiCheck /> {pendingItems && (pendingItems.open_orders_count > 0 || pendingItems.active_jumps_count > 0) && selectedTransferUser ? 'Fechar e Transferir' : 'Fechar Caixa'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Cadastro Rápido de Cliente */}
        {showQuickCustomerModal && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseQuickCustomerModal();
            }
          }}>
            <div className="modal-content customer-modal" style={{ maxWidth: '700px' }}>
              <div className="modal-header">
                <h2><FiPlus /> Cadastro Rápido de Cliente</h2>
                <button className="modal-close" onClick={handleCloseQuickCustomerModal}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                {error && (
                  <Alert variant="error">{error}</Alert>
                )}
                
                <div className="form-section">
                  <h3 className="section-title">Dados do Cliente</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="quick-nome">Nome *</label>
                      <input id="quick-nome" type="text" value={quickCustomerData.nome} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, nome: e.target.value })} placeholder="Nome completo" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="quick-telefone">Telefone *</label>
                      <input id="quick-telefone" type="text" value={quickCustomerData.telefone} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, telefone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="quick-cpf">CPF</label>
                      <div className="cpf-field-wrapper">
                        <input id="quick-cpf" type="text" value={quickCustomerData.cpf} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" maxLength={14} disabled={quickCustomerData.estrangeiro} style={{ flex: 1, opacity: quickCustomerData.estrangeiro ? 0.5 : 1 }} />
                        <div className="form-group-checkbox">
                          <label>
                            <input type="checkbox" checked={quickCustomerData.estrangeiro} onChange={(e) => {
                              const isEstrangeiro = e.target.checked;
                              console.log('Estrangeiro mudou para:', isEstrangeiro);
                              setQuickCustomerData({ ...quickCustomerData, estrangeiro: isEstrangeiro, cpf: isEstrangeiro ? '' : quickCustomerData.cpf });
                            }} />
                            Estrangeiro
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="quick-email">E-mail</label>
                      <input id="quick-email" type="email" value={quickCustomerData.email} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, email: e.target.value })} placeholder="email@exemplo.com" />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="quick-data-nascimento">Data de Nascimento</label>
                      <input id="quick-data-nascimento" type="date" value={quickCustomerData.data_nascimento} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, data_nascimento: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group-checkbox">
                    <label>
                      <input type="checkbox" checked={quickCustomerData.pcd} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, pcd: e.target.checked })} />
                      Cliente é PcD
                    </label>
                  </div>
                </div>

                {/* Dependentes */}
                <div className="form-section">
                  <div className="section-header">
                    <h3 className="section-title">Dependentes</h3>
                    <Button type="button" variant="outline" size="small" onClick={handleQuickAddDependente}>
                      <FiPlus /> Adicionar Dependente
                    </Button>
                  </div>
                  <div className="dependentes-list">
                    {quickCustomerDependentes.length === 0 && (
                      <p className="no-dependentes">Nenhum dependente adicionado.</p>
                    )}
                    {quickCustomerDependentes.map((dep, index) => (
                      <div key={index} className="dependente-item">
                        <div className="dependente-fields" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                          <div className="form-group" style={{ flex: 2 }}>
                            <label>Nome do Dependente</label>
                            <input type="text" value={dep.nome} onChange={(e) => handleQuickDependenteChange(index, 'nome', e.target.value)} placeholder="Nome do dependente" />
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Data de Nascimento</label>
                            <input type="date" value={dep.data_nascimento} onChange={(e) => handleQuickDependenteChange(index, 'data_nascimento', e.target.value)} />
                          </div>
                          <div className="form-group-checkbox" style={{ marginBottom: '8px' }}>
                            <label>
                              <input 
                                type="checkbox" 
                                checked={dep.pcd} 
                                onChange={(e) => {
                                  const updated = [...quickCustomerDependentes];
                                  updated[index] = { ...updated[index], pcd: e.target.checked };
                                  setQuickCustomerDependentes(updated);
                                }} 
                              />
                              PcD
                            </label>
                          </div>
                        </div>
                        <button type="button" className="remove-dependente-btn" onClick={() => handleQuickRemoveDependente(index)} title="Remover dependente">
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seleção de Pacote para Iniciar Jump */}
                <div className="form-section">
                  <h3 className="section-title">
                    <FiPackage style={{ marginRight: '8px' }} />
                    Pacotes para Iniciar Jump (Opcional)
                  </h3>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                    Selecione quem vai usar e o pacote de cada um para iniciar o Jump automaticamente.
                  </p>

                  <div className="form-group" style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontWeight: 'bold', marginBottom: '12px', display: 'block', color: 'var(--primary-color)' }}>
                      <FiUsers style={{ marginRight: '8px' }} />
                      Quem vai usar e qual pacote?
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Cliente Titular */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        padding: '12px', 
                        borderRadius: '8px', 
                        backgroundColor: quickCustomerWillUseTitular ? '#eef2ff' : 'white',
                        border: '1px solid #e2e8f0'
                      }}>
                        <input
                          type="checkbox"
                          checked={quickCustomerWillUseTitular}
                          onChange={(e) => setQuickCustomerWillUseTitular(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: 'bold', flex: '0 0 150px' }}>
                          👤 {quickCustomerData.nome || 'Cliente titular'}
                        </span>
                        {quickCustomerWillUseTitular && (
                          <select
                            value={quickCustomerTitularProduct?.id || ''}
                            onChange={(e) => {
                              console.log('=== SELECT TITULAR onChange ===');
                              console.log('e.target.value:', e.target.value);
                              const productId = e.target.value; // UUID string, não número
                              console.log('productId:', productId);
                              const product = products.find(p => String(p.id) === productId);
                              console.log('product found:', product);
                              setQuickCustomerTitularProduct(product || null);
                              console.log('Estado atualizado para:', product);
                            }}
                            onClick={(e) => {
                              console.log('=== SELECT TITULAR onClick ===');
                              console.log('Clique no select titular');
                            }}
                            style={{ 
                              flex: 1, 
                              padding: '8px', 
                              borderRadius: '4px', 
                              border: '1px solid #cbd5e1',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              position: 'relative',
                              zIndex: 10
                            }}
                          >
                            <option value="">Selecione o pacote</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Dependentes */}
                      {quickCustomerDependentes.map((dep, index) => (
                        <div 
                          key={index}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            padding: '12px', 
                            borderRadius: '8px', 
                            backgroundColor: quickCustomerWillUseDependentes.includes(index) ? '#eef2ff' : 'white',
                            border: '1px solid #e2e8f0',
                            marginLeft: '20px'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={quickCustomerWillUseDependentes.includes(index)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setQuickCustomerWillUseDependentes([...quickCustomerWillUseDependentes, index]);
                              } else {
                                setQuickCustomerWillUseDependentes(quickCustomerWillUseDependentes.filter(i => i !== index));
                                // Remove o produto se desmarcar
                                const newProducts = { ...quickCustomerDependentesProducts };
                                delete newProducts[index];
                                setQuickCustomerDependentesProducts(newProducts);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: 'bold', flex: '0 0 130px' }}>
                            👶 {dep.nome || `Dependente ${index + 1}`}
                          </span>
                          {quickCustomerWillUseDependentes.includes(index) && (
                            <select
                              value={quickCustomerDependentesProducts[index]?.id || ''}
                              onChange={(e) => {
                                console.log('=== SELECT DEPENDENTE onChange ===');
                                console.log('index:', index);
                                console.log('e.target.value:', e.target.value);
                                const productId = e.target.value; // UUID string, não número
                                console.log('productId:', productId);
                                const product = products.find(p => String(p.id) === productId);
                                console.log('product found:', product);
                                console.log('quickCustomerDependentesProducts antes:', quickCustomerDependentesProducts);
                                setQuickCustomerDependentesProducts({
                                  ...quickCustomerDependentesProducts,
                                  [index]: product || null
                                });
                                console.log('Estado atualizado');
                              }}
                              onClick={(e) => {
                                console.log('=== SELECT DEPENDENTE onClick ===');
                                console.log('Clique no select dependente index:', index);
                              }}
                              style={{ 
                                flex: 1, 
                                padding: '8px', 
                                borderRadius: '4px', 
                                border: '1px solid #cbd5e1',
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                                position: 'relative',
                                zIndex: 10
                              }}
                            >
                              <option value="">Selecione o pacote</option>
                              {products.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.name} - R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                    <small style={{ color: 'var(--primary-color)', display: 'block', marginTop: '12px' }}>
                      ✓ Marque quem vai participar e selecione o pacote de cada um. Você poderá ajustar na próxima tela.
                    </small>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <Button variant="outline" onClick={handleCloseQuickCustomerModal}>
                  Cancelar
                </Button>
                <Button variant="secondary" onClick={() => handleQuickCustomerSubmit(false)}>
                  <FiSave /> Cadastrar Cliente
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => handleQuickCustomerSubmit(true)}
                  disabled={!quickCustomerWillUseTitular && quickCustomerWillUseDependentes.length === 0}
                  title={
                    !quickCustomerWillUseTitular && quickCustomerWillUseDependentes.length === 0
                      ? 'Marque pelo menos uma pessoa e selecione seu pacote para iniciar o Jump'
                      : ''
                  }
                >
                  <FiPlay /> Cadastrar e Iniciar Jump
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Comanda */}
        {showComandaModal && (
          <div className="modal-overlay">
            <div className={`modal-container comanda-modal ${comandaModalView === 'confirm_close' ? 'confirmation-view' : ''}`}>

              {/* === VIEW: DETALHES DA COMANDA === */}
              {comandaModalView === 'details' && (
                <>
                  <div className="modal-header">
                    <h3><FiShoppingCart /> Comanda #{selectedComanda ? selectedComanda.order_number || '---' : '---'}</h3>
                    <button className="modal-close" onClick={handleCloseComandaModal} disabled={comandaLoading}>
                      <FiX />
                    </button>
                  </div>

                  <div className="modal-body">
                    {/* Informações do Cliente */}
                    <div className="modal-section" style={{ padding: 0, border: 'none' }}>
                      <div className="comanda-customer-info">
                        <div className="customer-avatar">
                          <span>{((selectedComanda?.dependente_name || selectedComanda?.customer_name) || '?').charAt(0)}</span>
                        </div>
                        <div className="customer-details">
                          <span className="customer-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {selectedComanda?.dependente_name || selectedComanda?.customer_name}
                            {selectedComanda?.is_pcd && (
                              <span style={{ 
                                fontSize: '11px', 
                                fontWeight: 700, 
                                padding: '3px 7px', 
                                borderRadius: '4px', 
                                backgroundColor: '#fef3c7', 
                                color: '#92400e'
                              }}>PCD</span>
                            )}
                          </span>
                          {selectedComanda?.dependente_name && (
                            <span className="customer-responsible">Responsável: {selectedComanda?.customer_name}</span>
                          )}
                        </div>
                        <div className="comanda-info-pills">
                          <div className="info-pill">
                            <FiCalendar />
                            <span>{selectedComanda?.created_at ? new Date(selectedComanda.created_at).toLocaleDateString('pt-BR') : ''}</span>
                          </div>
                          <div className="info-pill">
                            <strong>{selectedComanda?.items?.length || 0}</strong>
                            <span>Itens</span>
                          </div>
                          <div className="info-pill">
                            <strong>{selectedComanda?.jump_usages_count || 0}</strong>
                            <span>Jumps</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Adicionar Consumíveis */}
                    <div className="modal-section">
                      <h4 className="modal-section-title"><FiShoppingCart /> Adicionar Consumíveis</h4>
                      <p className="modal-section-description">
                        Selecione produtos para adicionar à comanda do cliente.
                      </p>

                      {consumableProducts.length === 0 ? (
                        <div className="no-consumables">
                          <p>Nenhum produto consumível cadastrado</p>
                        </div>
                      ) : (
                        <div className="consumable-form">
                          <div className="consumable-select-row">
                            <select
                              value={selectedConsumable?.id || ''}
                              onChange={(e) => {
                                const productId = e.target.value;
                                const product = consumableProducts.find(p => String(p.id) === productId);
                                setSelectedConsumable(product || null);
                              }}
                              className="consumable-select"
                            >
                              <option value="">Selecione um produto</option>
                              {consumableProducts.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.name} - R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                                </option>
                              ))}
                            </select>
                            <div className="quantity-stepper">
                              <button type="button" onClick={() => setConsumableQuantity(Math.max(1, consumableQuantity - 1))}>-</button>
                              <span>{consumableQuantity}</span>
                              <button type="button" onClick={() => setConsumableQuantity(consumableQuantity + 1)}>+</button>
                            </div>
                            <button
                              type="button"
                              className="add-consumable-btn"
                              onClick={async () => {
                                if (!selectedComanda || !selectedConsumable) return;
                                try {
                                  setComandaLoading(true);
                                  const unitPrice = parseFloat(selectedConsumable.price);
                                  const subtotal = unitPrice * consumableQuantity;
                                  
                                  const response = await orderService.addItem({
                                    order: selectedComanda.id,
                                    product: selectedConsumable.id,
                                    item_type: 'consumable',
                                    quantity: consumableQuantity,
                                    unit_price: selectedConsumable.price,
                                    description: selectedConsumable.name
                                  });

                                  if (response.success && response.data) {
                                    toast.success('Produto adicionado à comanda!');
                                    setSelectedConsumable(null);
                                    setConsumableQuantity(1);
                                    
                                    const newItem = response.data as any;
                                    setComandaItems(prev => [...prev, newItem]);
                                    setComandaTotal(prev => {
                                      const newTotal = [...comandaItems, newItem]
                                        .filter(i => i.item_type !== 'additional_time')
                                        .reduce((sum, i: any) => sum + parseFloat(i.pago ? '0' : (i.subtotal || '0')), 0);
                                      return newTotal.toString();
                                    });
                                  } else {
                                    toast.error(response.error || 'Erro ao adicionar produto');
                                  }
                                } catch (error) {
                                  toast.error('Erro ao adicionar produto à comanda');
                                } finally {
                                  setComandaLoading(false);
                                }
                              }}
                              disabled={!selectedComanda || comandaLoading}
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Adicionar Equipamentos */}
                    <div className="modal-section">
                      <h4 className="modal-section-title"><FiPackage /> Adicionar Equipamentos</h4>
                      <p className="modal-section-description">
                        Selecione um equipamento e sua unidade disponível para adicionar à comanda.
                      </p>

                      {equipmentProducts.length === 0 ? (
                        <div className="no-consumables">
                          <p>Nenhum equipamento cadastrado</p>
                        </div>
                      ) : (
                        <div className="consumable-form">
                          <div className="consumable-select-row">
                            <select
                              value={selectedEquipment?.id || ''}
                              onChange={(e) => {
                                const productId = e.target.value;
                                const product = equipmentProducts.find(p => String(p.id) === productId);
                                setSelectedEquipment(product || null);
                                setSelectedUnit(null);
                                setAvailableUnits([]);
                                if (product) {
                                  loadAvailableUnits(product.id);
                                }
                              }}
                              className="consumable-select"
                            >
                              <option value="">Selecione um equipamento</option>
                              {equipmentProducts.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.name} - R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                                </option>
                              ))}
                            </select>
                            
                            <select
                              value={selectedUnit?.id || ''}
                              onChange={(e) => {
                                const unitId = e.target.value;
                                const unit = availableUnits.find(u => String(u.id) === unitId);
                                setSelectedUnit(unit || null);
                              }}
                              className="consumable-select"
                              disabled={!selectedEquipment || loadingUnits}
                            >
                              <option value="">
                                {loadingUnits ? 'Carregando...' : 'Selecione a unidade'}
                              </option>
                              {availableUnits.map(unit => (
                                <option key={unit.id} value={unit.id}>
                                  Unidade #{unit.number}
                                </option>
                              ))}
                            </select>
                            
                            <button
                              type="button"
                              className="add-consumable-btn"
                              onClick={async () => {
                                if (!selectedComanda || !selectedEquipment || !selectedUnit) return;
                                try {
                                  setComandaLoading(true);
                                  
                                  const unitPrice = parseFloat(selectedEquipment.price);
                                  const subtotal = unitPrice * 1; // Equipamento sempre quantidade 1
                                  
                                  // Adiciona o item à comanda
                                  const response = await orderService.addItem({
                                    order: selectedComanda.id,
                                    product: selectedEquipment.id,
                                    item_type: 'consumable',
                                    quantity: 1,
                                    unit_price: selectedEquipment.price,
                                    description: `${selectedEquipment.name} - Unidade #${selectedUnit.number}`,
                                    equipment_unit: selectedUnit.id
                                  });

                                  if (response.success && response.data) {
                                    // Marca a unidade como "em uso"
                                    const updateResponse = await equipmentUnitService.update(selectedUnit.id, {
                                      status: 'in_use'
                                    });
                                    
                                    if (!updateResponse.success) {
                                      console.error('Erro ao atualizar status da unidade:', updateResponse.error);
                                      toast.error('Equipamento adicionado mas não foi possível marcar a unidade como "em uso"');
                                    }
                                    
                                    toast.success(`Equipamento ${selectedEquipment.name} #${selectedUnit.number} adicionado!`);
                                    
                                    setSelectedEquipment(null);
                                    setSelectedUnit(null);
                                    setAvailableUnits([]);
                                    
                                    const newItem = response.data as any;
                                    setComandaItems(prev => [...prev, newItem]);
                                    setComandaTotal(prev => {
                                      const newTotal = [...comandaItems, newItem]
                                        .filter(i => i.item_type !== 'additional_time')
                                        .reduce((sum, i: any) => sum + parseFloat(i.pago ? '0' : (i.subtotal || '0')), 0);
                                      return newTotal.toString();
                                    });
                                  } else {
                                    toast.error(response.error || 'Erro ao adicionar equipamento');
                                  }
                                } catch (error) {
                                  toast.error('Erro ao adicionar equipamento à comanda');
                                } finally {
                                  setComandaLoading(false);
                                }
                              }}
                              disabled={!selectedComanda || !selectedEquipment || !selectedUnit || comandaLoading}
                            >
                              Adicionar
                            </button>
                          </div>
                          {availableUnits.length === 0 && selectedEquipment && !loadingUnits && (
                            <p style={{ color: '#dc3545', fontSize: '13px', marginTop: '8px' }}>
                              Nenhuma unidade disponível para este equipamento
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Itens da Comanda */}
                    <div className="order-items-section">
                      <h4 className="modal-section-title"><FiList /> Itens da Comanda</h4>
                      
                      {selectedComanda?.items.length === 0 ? (
                        <p className="no-items">Nenhum item na comanda</p>
                      ) : (
                        <div className="order-items-container">
                          <div className="order-items-header">
                            <span>Produto</span>
                            <span>Subtotal</span>
                          </div>
                          <div className="order-items-list">
                            {comandaItems
                              .filter(item => item.item_type !== 'additional_time')
                              .sort((a, b) => {
                                // Extrai o nome do cliente da descrição
                                const getClientName = (item: any) => {
                                  if (item.description) {
                                    const parts = item.description.split(' - ');
                                    return parts[0].trim().toLowerCase();
                                  }
                                  return item.product_name?.toLowerCase() || '';
                                };
                                
                                const nameA = getClientName(a);
                                const nameB = getClientName(b);
                                
                                return nameA.localeCompare(nameB, 'pt-BR');
                              })
                              .map(item => (
                              <div key={item.id} className={`order-item ${item.pago ? 'item-pago' : ''}`}>
                                <div className="order-item-icon">
                                  {item.item_type === 'jump_time' && <FiClock />}
                                  {item.item_type === 'consumable' && <FiShoppingCart />}
                                  {item.item_type === 'additional_time' && <FiPlusCircle />}
                                </div>
                                <div className="order-item-main">
                                  <span className="order-item-name">{item.description || item.product_name}</span>
                                  <span className={`order-item-subtotal ${item.pago ? 'subtotal-pago' : ''}`}>
                                    R$ {parseFloat(item.subtotal).toFixed(2).replace('.', ',')}
                                  </span>
                                  <span className="order-item-details">
                                    {item.quantity}x R$ {(parseFloat(item.subtotal) / item.quantity).toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                                <div className="order-item-actions">
                                  <button
                                    className={`pay-item-btn ${item.pago ? 'paid' : ''}`}
                                    onClick={async () => {
                                      try {
                                        setComandaLoading(true);
                                        const response = await orderService.toggleItemPago(item.id, companyId);
                                        
                                        if (response.success) {
                                          toast.success(item.pago ? 'Item marcado como não pago' : 'Item marcado como pago');
                                          setComandaItems(prev => prev.map(i => i.id === item.id ? { ...i, pago: !i.pago } : i));
                                          setComandaTotal(prev => {
                                            const updated = comandaItems.map(i => i.id === item.id ? { ...i, pago: !i.pago } : i);
                                            const newTotal = updated
                                              .filter(it => it.item_type !== 'additional_time')
                                              .reduce((sum, it: any) => sum + parseFloat(it.pago ? '0' : (it.subtotal || '0')), 0);
                                            return newTotal.toString();
                                          });
                                        } else {
                                          toast.error(response.error || 'Erro ao atualizar item');
                                        }
                                      } catch (error) {
                                        toast.error('Erro ao atualizar item');
                                      } finally {
                                        setComandaLoading(false);
                                      }
                                    }}
                                    title={item.pago ? "Marcar como não pago" : "Marcar como pago"}
                                    disabled={comandaLoading}
                                  >
                                    {item.pago ? <FiCheck /> : <FiDollarSign />}
                                  </button>
                                  
                                  {!item.pago && (item.item_type !== 'jump_time' || (item.description && item.description.toLowerCase().includes('extra'))) && (
                                    <button
                                      className="remove-item-btn"
                                      onClick={async () => {
                                        try {
                                          setComandaLoading(true);
                                          const response = await orderService.removeItem(item.id, companyId);
                                          
                                          if (response.success) {
                                            toast.success('Item removido da comanda');
                                            setComandaItems(prev => prev.filter(i => i.id !== item.id));
                                            setComandaTotal(prev => {
                                              const updated = comandaItems.filter(i => i.id !== item.id);
                                              const newTotal = updated
                                                .filter(it => it.item_type !== 'additional_time')
                                                .reduce((sum, it: any) => sum + parseFloat(it.pago ? '0' : (it.subtotal || '0')), 0);
                                              return newTotal.toString();
                                            });
                                          } else {
                                            toast.error(response.error || 'Erro ao remover item');
                                          }
                                        } catch (error) {
                                          toast.error('Erro ao remover item');
                                        } finally {
                                          setComandaLoading(false);
                                        }
                                      }}
                                      title="Remover item"
                                      disabled={comandaLoading}
                                    >
                                      <FiTrash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="order-total">
                            <span>TOTAL A PAGAR</span>
                            <span className="order-total-value">
                              R$ {parseFloat(comandaTotal).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="modal-actions">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseComandaModal}
                    >
                      Fechar
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={async () => {
                        if (!selectedComanda) return;
                        try {
                          const resp = await orderService.close(selectedComanda.id, companyId, { dryRun: true });
                          if (resp.success && (resp as any).preview) {
                            const prev = (resp as any).preview;
                            setClosePreview({
                              additional_items: prev.additional_items || [],
                              additional_total: prev.additional_total || '0',
                              total_with_additional: prev.total_with_additional || selectedComanda.total,
                            });
                          }
                        } catch (e) {
                          // ignora prévia se falhar
                        }
                        setComandaModalView('confirm_close');
                      }}
                      disabled={comandaLoading}
                    >
                      <FiCheckSquare /> Finalizar Comanda
                    </Button>
                  </div>
                </>
              )}

              {/* === VIEW: CONFIRMAÇÃO DE FINALIZAÇÃO === */}
              {comandaModalView === 'confirm_close' && (
                <>
                  <div className="modal-header">
                    <h3>
                      <FiAlertTriangle /> Confirmar Finalização
                    </h3>
                    <button
                      className="modal-close"
                      onClick={handleCloseComandaModal}
                      disabled={comandaLoading}
                    >
                      <FiX />
                    </button>
                  </div>

                  <div className="modal-body">
                    <div className="confirmation-summary">
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px',
                          marginBottom: summarySectionExpanded ? '20px' : '10px',
                          cursor: 'pointer',
                          paddingBottom: '12px',
                          borderBottom: '2px solid #f1f5f9'
                        }}
                        onClick={() => {
                          setSummarySectionExpanded(!summarySectionExpanded);
                          if (!summarySectionExpanded) {
                            setPaymentSectionExpanded(false);
                          }
                        }}
                      >
                        <button
                          type="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#1e293b',
                            transition: 'transform 0.2s'
                          }}
                        >
                          {summarySectionExpanded ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
                        </button>
                        <h4 style={{ margin: 0, color: '#1e293b', fontSize: '18px', fontWeight: '600' }}>Resumo da Comanda</h4>
                      </div>
                      
                      {summarySectionExpanded && (
                        <>
                          <div className="summary-info">
                        <div className="summary-row">
                          <span className="summary-label">Cliente:</span>
                          <span className="summary-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {selectedComanda?.customer_name}
                            {selectedComanda?.customer_pcd && (
                              <span style={{ 
                                fontSize: '10px', 
                                fontWeight: 700, 
                                padding: '2px 6px', 
                                borderRadius: '3px', 
                                backgroundColor: '#fef3c7', 
                                color: '#92400e'
                              }}>PCD</span>
                            )}
                          </span>
                        </div>
                        
                        {selectedComanda?.dependente_name && (
                          <div className="summary-row">
                            <span className="summary-label">Dependente:</span>
                            <span className="summary-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {selectedComanda.dependente_name}
                              {selectedComanda?.dependente_pcd && (
                                <span style={{ 
                                  fontSize: '10px', 
                                  fontWeight: 700, 
                                  padding: '2px 6px', 
                                  borderRadius: '3px', 
                                  backgroundColor: '#fef3c7', 
                                  color: '#92400e'
                                }}>PCD</span>
                              )}
                            </span>
                          </div>
                        )}

                        {!!selectedComanda?.closed_at && (
                          <div className="summary-row">
                            <span className="summary-label">Fechada em:</span>
                            <span className="summary-value">{new Date(selectedComanda.closed_at).toLocaleString('pt-BR')}</span>
                          </div>
                        )}

                        <div className="summary-row">
                          <span className="summary-label">Total de Itens:</span>
                          <span className="summary-value">{(selectedComanda?.items?.length || 0) + (closePreview?.additional_items?.length || 0)}</span>
                        </div>
                      </div>

                      {/* Informações dos Jumps */}
                      {selectedComanda?.jump_usages && selectedComanda.jump_usages.length > 0 && (
                        <div style={{ 
                          marginTop: '20px', 
                          padding: '16px', 
                          backgroundColor: '#f9fafb', 
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <h5 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiClock size={16} />
                            Informações de Uso dos Jumps
                          </h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {selectedComanda.jump_usages.map((ju: any) => (
                              <div key={ju.id} style={{ 
                                padding: '12px', 
                                backgroundColor: 'white', 
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb'
                              }}>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'flex-start',
                                  marginBottom: '8px'
                                }}>
                                  <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                      backgroundColor: '#3b82f6',
                                      color: 'white',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 700
                                    }}>
                                      #{ju.jump_number ?? (ju.id ? String(ju.id).slice(0, 8) : '-')}
                                    </span>
                                    {ju.dependente_name || ju.customer_name}
                                  </div>
                                  <div style={{ 
                                    fontSize: '11px', 
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: ju.finished ? '#dcfce7' : '#fef3c7',
                                    color: ju.finished ? '#166534' : '#92400e'
                                  }}>
                                    {ju.finished ? 'Finalizado' : 'Em uso'}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>Início:</span>
                                    <span style={{ fontWeight: 500 }}>
                                      {new Date(ju.start_time).toLocaleString('pt-BR')}
                                    </span>
                                  </div>
                                  {ju.end_time && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: '#6b7280' }}>Fim:</span>
                                      <span style={{ fontWeight: 500 }}>
                                        {new Date(ju.end_time).toLocaleString('pt-BR')}
                                      </span>
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>Tempo contratado:</span>
                                    <span style={{ fontWeight: 500 }}>
                                      {ju.contracted_hours_display || `${ju.contracted_hours}h`}
                                    </span>
                                  </div>
                                  {ju.finished && ju.total_hours && ju.total_hours !== 'Em andamento' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: '#6b7280' }}>Tempo total:</span>
                                      <span style={{ fontWeight: 500 }}>
                                        {ju.total_hours}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="summary-items">
                        <h5>Itens:</h5>
                        <div className="summary-items-list">
                          {(() => {
                            // Combina itens reais e de preview
                            const allItems = [
                              ...(selectedComanda?.items || []),
                              ...(closePreview?.additional_items || []),
                            ];
                            
                            // Consolida itens de additional_time do mesmo jump
                            const consolidatedItems: any[] = [];
                            const additionalTimeByJump: { [key: string]: any } = {};
                            
                            allItems.forEach((item: any) => {
                              if (item.item_type === 'additional_time') {
                                // Extrai Jump ID da descrição
                                const jumpMatch = item.description?.match(/Jump #(\d+)/);
                                const jumpId = jumpMatch ? jumpMatch[1] : null;
                                
                                if (jumpId) {
                                  if (!additionalTimeByJump[jumpId]) {
                                    // Primeiro item deste jump
                                    additionalTimeByJump[jumpId] = { ...item };
                                  } else {
                                    // Soma com item existente
                                    additionalTimeByJump[jumpId].quantity += item.quantity;
                                    additionalTimeByJump[jumpId].subtotal = (
                                      parseFloat(additionalTimeByJump[jumpId].subtotal) + 
                                      parseFloat(item.subtotal)
                                    ).toString();
                                    // Atualiza descrição com total
                                    const personName = item.description.split(' - ')[0];
                                    additionalTimeByJump[jumpId].description = 
                                      `${personName} - Tempo adicional: ${additionalTimeByJump[jumpId].quantity} minutos (Jump #${jumpId})`;
                                  }
                                } else {
                                  // Sem Jump ID, adiciona normalmente
                                  consolidatedItems.push(item);
                                }
                              } else {
                                // Não é additional_time, adiciona normalmente
                                consolidatedItems.push(item);
                              }
                            });
                            
                            // Adiciona itens consolidados de additional_time
                            Object.values(additionalTimeByJump).forEach(item => {
                              consolidatedItems.push(item);
                            });
                            
                            // Ordena os itens por cliente (extraindo o nome da descrição)
                            consolidatedItems.sort((a, b) => {
                              // Extrai o nome do cliente da descrição
                              const getClientName = (item: any) => {
                                if (item.description) {
                                  // Para itens de tempo, o nome está antes do " - "
                                  const parts = item.description.split(' - ');
                                  return parts[0].trim().toLowerCase();
                                }
                                return item.product_name?.toLowerCase() || '';
                              };
                              
                              const nameA = getClientName(a);
                              const nameB = getClientName(b);
                              
                              return nameA.localeCompare(nameB, 'pt-BR');
                            });
                            
                            return consolidatedItems;
                          })().map((item: any) => {
                            // Extrai Jump ID para itens de tempo adicional (captura número ou UUID)
                            const jumpMatch = item.item_type === 'additional_time' && item.description?.match(/Jump #([\w-]+)/);
                            const jumpId = jumpMatch ? jumpMatch[1] : null;
                            const hasAdjustment = jumpId && additionalTimeAdjustments[jumpId] !== undefined;
                            const adjustedQuantity = hasAdjustment ? additionalTimeAdjustments[jumpId].newQuantity : item.quantity;
                            
                            return (
                              <div key={item.id}>
                                <div className={`summary-item ${item.pago ? 'item-pago' : ''}`}>
                                  <div className="summary-item-info">
                                    <div className="summary-item-icon">
                                      {item.item_type === 'jump_time' && <FiClock />}
                                      {item.item_type === 'consumable' && <FiShoppingCart />}
                                      {item.item_type === 'additional_time' && <FiPlusCircle />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div className="summary-item-name">{item.description || item.product_name}</div>
                                      <div className="summary-item-details">
                                        {hasAdjustment && adjustedQuantity !== item.quantity && (
                                          <span style={{ 
                                            textDecoration: 'line-through', 
                                            color: '#999', 
                                            marginRight: '8px' 
                                          }}>
                                            {item.quantity}x
                                          </span>
                                        )}
                                        {hasAdjustment && adjustedQuantity !== item.quantity ? (
                                          <span style={{ color: '#28a745', fontWeight: 600 }}>
                                            {adjustedQuantity}x R$ {(parseFloat(item.subtotal) / item.quantity).toFixed(2).replace('.', ',')}
                                          </span>
                                        ) : (
                                          <span>
                                            {item.quantity}x R$ {(parseFloat(item.subtotal) / item.quantity).toFixed(2).replace('.', ',')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {/* Botão de ajustar tempo adicional */}
                                    {item.item_type === 'additional_time' && jumpId && !item.pago && (
                                      <button
                                        onClick={() => {
                                          setAdjustingTimeItem(item);
                                          // Inicializa o motivo se já existe um ajuste para este jump
                                          setAdjustmentReason(additionalTimeAdjustments[jumpId]?.reason || '');
                                          setShowAdjustTimeModal(true);
                                        }}
                                        style={{
                                          marginLeft: '8px',
                                          padding: '6px 12px',
                                          backgroundColor: '#ffc107',
                                          color: '#000',
                                          border: 'none',
                                          borderRadius: '6px',
                                          fontSize: '12px',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#ffb300';
                                          e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#ffc107';
                                          e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                      >
                                        <FiClock size={14} />
                                        Ajustar
                                      </button>
                                    )}
                                  </div>
                                  <div className="summary-item-price">
                                    {hasAdjustment && adjustedQuantity !== item.quantity ? (
                                      <>
                                        <span style={{ 
                                          textDecoration: 'line-through', 
                                          color: '#999', 
                                          fontSize: '12px',
                                          display: 'block'
                                        }}>
                                          R$ {parseFloat(item.subtotal).toFixed(2).replace('.', ',')}
                                        </span>
                                        <span style={{ color: '#28a745', fontWeight: 600 }}>
                                          R$ {(adjustedQuantity * (parseFloat(item.subtotal) / item.quantity)).toFixed(2).replace('.', ',')}
                                        </span>
                                      </>
                                    ) : (
                                      <span className={item.pago ? 'price-pago' : ''}>
                                        R$ {parseFloat(item.subtotal).toFixed(2).replace('.', ',')}
                                      </span>
                                    )}
                                    {item.pago && <span className="badge-pago">PAGO</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="summary-total">
                        <div className="summary-total-row">
                          <span className="summary-total-label">TOTAL A PAGAR:</span>
                          <span className="summary-total-value">
                            R$ {(() => {
                              // Calcula o total considerando os ajustes de tempo adicional
                              const allItems = [
                                ...(selectedComanda?.items || []),
                                ...(closePreview?.additional_items || []),
                              ];
                              
                              let total = 0;
                              
                              allItems.forEach((item: any) => {
                                // Pula itens já pagos
                                if (item.pago) return;
                                
                                if (item.item_type === 'additional_time') {
                                  // Para tempo adicional, verifica se há ajuste
                                  const jumpMatch = item.description?.match(/Jump #(\d+)/);
                                  const jumpId = jumpMatch ? parseInt(jumpMatch[1]) : null;
                                  
                                  if (jumpId && additionalTimeAdjustments[jumpId] !== undefined) {
                                    // Usa a quantidade ajustada
                                    const adjustedQuantity = additionalTimeAdjustments[jumpId].newQuantity;
                                    const unitPrice = parseFloat(item.subtotal) / item.quantity;
                                    total += adjustedQuantity * unitPrice;
                                  } else {
                                    // Usa o valor original
                                    total += parseFloat(item.subtotal || 0);
                                  }
                                } else {
                                  // Para outros itens, usa o valor original
                                  total += parseFloat(item.subtotal || 0);
                                }
                              });
                              
                              return total.toFixed(2).replace('.', ',');
                            })()}
                          </span>
                        </div>
                      </div>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedComanda?.status !== 'closed' && (() => {
                    const allItems = [
                      ...(selectedComanda?.items || []),
                      ...(closePreview?.additional_items || []),
                    ];
                    
                    let totalReal = 0;
                    
                    allItems.forEach((item: any) => {
                      if (item.pago) return;
                      
                      if (item.item_type === 'additional_time') {
                        const jumpMatch = item.description?.match(/Jump #(\d+)/);
                        const jumpId = jumpMatch ? parseInt(jumpMatch[1]) : null;
                        
                        if (jumpId && additionalTimeAdjustments[jumpId] !== undefined) {
                          const adjustedQuantity = additionalTimeAdjustments[jumpId].newQuantity;
                          const unitPrice = parseFloat(item.subtotal) / item.quantity;
                          totalReal += adjustedQuantity * unitPrice;
                        } else {
                          totalReal += parseFloat(item.subtotal || 0);
                        }
                      } else {
                        totalReal += parseFloat(item.subtotal || 0);
                      }
                    });

                    return (
                      <div style={{ marginTop: '25px', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                        <div 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: paymentSectionExpanded ? '20px' : '0', 
                            borderBottom: '2px solid #f1f5f9', 
                            paddingBottom: '12px',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setPaymentSectionExpanded(!paymentSectionExpanded);
                            if (!paymentSectionExpanded) {
                              setSummarySectionExpanded(false);
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                              type="button"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#1e293b',
                                transition: 'transform 0.2s'
                              }}
                            >
                              {paymentSectionExpanded ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
                            </button>
                            <h4 style={{ margin: 0, color: '#1e293b', fontSize: '18px', fontWeight: '600' }}>
                              Formas de Pagamento
                            </h4>
                          </div>
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ display: 'block', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Total da Comanda</span>
                              <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>R$ {totalReal.toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                        </div>
                      
                      {paymentSectionExpanded && (
                        <>
                          {paymentTypes.length === 0 && (
                            <div style={{ padding: '12px', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', color: '#9a3412', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
                              Carregando formas de pagamento...
                            </div>
                          )}
                          
                          <div style={{ marginBottom: '20px' }}>
                            {paymentDetails.length === 0 ? (
                          <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '2px dashed #cbd5e1' }}>
                            <p style={{ marginBottom: '16px', color: '#64748b', fontSize: '14px' }}>Nenhuma forma de pagamento adicionada</p>
                            <Button
                              type="button"
                              variant="primary"
                              onClick={() => setPaymentDetails([{ payment_type: '', amount: '' }])}
                              style={{ padding: '10px 20px' }}
                            >
                              Adicionar Primeira Forma de Pagamento
                            </Button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {paymentDetails.map((detail, index) => (
                              <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>TIPO</label>
                                  <select
                                    value={detail.payment_type}
                                    onChange={(e) => {
                                      const newDetails = [...paymentDetails];
                                      newDetails[index].payment_type = e.target.value;
                                      setPaymentDetails(newDetails);
                                    }}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '14px', outline: 'none' }}
                                  >
                                    <option value="">Selecione...</option>
                                    {paymentTypes.map((pt: any) => (
                                      <option key={pt.id} value={pt.id}>{pt.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div style={{ width: '160px' }}>
                                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>VALOR (R$)</label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={detail.amount}
                                    onChange={(e) => {
                                      let value = e.target.value;
                                      value = value.replace(/[^\d.,]/g, '');
                                      value = value.replace(',', '.');
                                      const parts = value.split('.');
                                      if (parts.length > 2) {
                                        value = parts[0] + '.' + parts.slice(1).join('');
                                      }
                                      const newDetails = [...paymentDetails];
                                      newDetails[index].amount = value;
                                      setPaymentDetails(newDetails);
                                    }}
                                    onBlur={(e) => {
                                      const value = e.target.value;
                                      if (value && !isNaN(parseFloat(value))) {
                                        const newDetails = [...paymentDetails];
                                        newDetails[index].amount = parseFloat(value).toFixed(2);
                                        setPaymentDetails(newDetails);
                                      }
                                    }}
                                    placeholder="0.00"
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                                  />
                                </div>
                                <div style={{ alignSelf: 'flex-end', paddingBottom: '2px' }}>
                                  <button
                                    onClick={() => {
                                      const newDetails = paymentDetails.filter((_, i) => i !== index);
                                      setPaymentDetails(newDetails);
                                    }}
                                    title="Remover"
                                    style={{ padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#fee2e2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                  >
                                    <FiTrash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {paymentDetails.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setPaymentDetails([...paymentDetails, { payment_type: '', amount: '' }])}
                          style={{ marginBottom: '20px', width: '100%', borderStyle: 'dashed', borderWidth: '2px' }}
                        >
                          <FiPlusCircle /> Adicionar Outra Forma de Pagamento
                        </Button>
                      )}

                        <div style={{ 
                          marginTop: '20px', 
                          padding: '16px', 
                          backgroundColor: '#f8fafc', 
                          borderRadius: '10px', 
                          border: '1px solid #e2e8f0',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '16px'
                        }}>
                          <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>TOTAL PAGO</span>
                            <span style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>
                              R$ {paymentDetails.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          
                          <div style={{ 
                            padding: '12px', 
                            backgroundColor: 'white', 
                            borderRadius: '8px', 
                            border: '1px solid #e2e8f0',
                            borderLeft: `4px solid ${Math.abs(paymentDetails.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0) - totalReal) < 0.01 ? '#059669' : '#dc2626'}`
                          }}>
                            <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>FALTA PAGAR</span>
                            <span style={{ 
                              fontSize: '20px', 
                              fontWeight: '800', 
                              color: Math.abs(paymentDetails.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0) - totalReal) < 0.01 ? '#059669' : '#dc2626'
                            }}>
                              R$ {Math.max(0, totalReal - paymentDetails.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0)).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>

                          {Math.abs(paymentDetails.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0) - totalReal) < 0.01 && paymentDetails.length > 0 && (
                            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '6px', fontSize: '14px', textAlign: 'center', fontWeight: '600', border: '1px solid #a7f3d0' }}>
                              <FiCheckCircle style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                              Valor total conferido
                            </div>
                          )}
                        </>
                      )}
                      </div>
                    );
                  })()}

                  <div className="modal-actions">
                    {selectedComanda?.status === 'closed' ? (
                      <>
                        <Button type="button" variant="outline" onClick={handleCloseComandaModal} disabled={comandaLoading}>
                          Fechar
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          onClick={async () => {
                            if (!selectedComanda) return;
                            try {
                              setComandaLoading(true);
                              const resp = await orderService.getCupomFiscal(selectedComanda.id, companyId);
                              if (resp.success && resp.data?.cupom_fiscal) {
                                imprimirCupomFiscal(resp.data.cupom_fiscal);
                              } else {
                                toast.error(resp.error || 'Não foi possível obter o cupom fiscal');
                              }
                            } catch (e) {
                              toast.error('Erro ao imprimir cupom fiscal');
                            } finally {
                              setComandaLoading(false);
                            }
                          }}
                          disabled={comandaLoading}
                        >
                          <FiPrinter /> Imprimir Cupom Fiscal
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setComandaModalView('details')}
                          disabled={comandaLoading}
                        >
                          Voltar
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          onClick={handleFinalizarComanda}
                          disabled={comandaLoading}
                        >
                          <FiCheck /> Confirmar Finalização
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </>
    )}

    {/* Modal Abrir Caixa - Fora da condição para funcionar quando caixa fechado */}
    {showOpenCashModal && (
      <div className="modal-overlay" onClick={() => setShowOpenCashModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
          backgroundColor: 'white',
          maxWidth: '500px'
        }}>
          <div className="modal-header">
            <h2>Abrir Caixa</h2>
            <button className="modal-close" onClick={() => setShowOpenCashModal(false)}>
              <FiX />
            </button>
          </div>
          
          <div className="modal-body" style={{ padding: '20px' }}>
            <div className="form-group">
              <label>Valor Inicial do Caixa *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div className="form-group" style={{ marginTop: '15px' }}>
              <label>Observações</label>
              <textarea
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
                placeholder="Observações sobre a abertura do caixa (opcional)"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            padding: '20px',
            borderTop: '1px solid #eee'
          }}>
            <Button
              variant="outline"
              onClick={() => setShowOpenCashModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleOpenCash}
              disabled={loading || !companyId}
            >
              <FiDollarSign /> {loading ? 'Abrindo...' : 'Abrir Caixa'}
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Modal Sangria de Caixa */}
    {showWithdrawalModal && (
      <div className="modal-overlay" onClick={handleCancelWithdrawal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
          backgroundColor: 'white',
          maxWidth: '500px'
        }}>
          <div className="modal-header" style={{ 
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: 'white'
          }}>
            <h2>Sangria do Caixa</h2>
            <button className="modal-close" onClick={handleCancelWithdrawal} style={{ color: 'white' }}>
              <FiX />
            </button>
          </div>
          
          <div className="modal-body" style={{ padding: '20px' }}>
            {currentCashRegister && (
              <div style={{
                backgroundColor: '#f5f5f5',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                  <strong>Saldo Atual do Caixa:</strong>
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                  R$ {parseFloat(currentCashRegister.expected_closing_amount).toFixed(2)}
                </p>
              </div>
            )}

            <div className="form-group">
              <label>Valor da Sangria *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div className="form-group" style={{ marginTop: '15px' }}>
              <label>Motivo da Sangria *</label>
              <textarea
                value={withdrawalNotes}
                onChange={(e) => setWithdrawalNotes(e.target.value)}
                placeholder="Informe o motivo da sangria (ex: depósito bancário, pagamento de fornecedor, etc.)"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            padding: '20px',
            borderTop: '1px solid #eee'
          }}>
            <Button
              variant="outline"
              onClick={handleCancelWithdrawal}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleWithdrawal}
              disabled={loading}
              style={{ backgroundColor: '#ff9800', borderColor: '#ff9800' }}
            >
              <FiMinus /> {loading ? 'Realizando...' : 'Realizar Sangria'}
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Alerta de Jump Expirado */}
    {showExpiredJumpAlert && expiredJumpAlert && (
      <div className="modal-overlay" style={{ zIndex: 9999 }}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
          backgroundColor: 'white',
          maxWidth: '500px',
          border: '3px solid #ef4444'
        }}>
          <div className="modal-header" style={{ 
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white'
          }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiAlertCircle size={24} />
              Tempo Esgotado!
            </h2>
            <button 
              className="modal-close" 
              onClick={() => {
                setShowExpiredJumpAlert(false);
                setExpiredJumpAlert(null);
              }}
              style={{ color: 'white' }}
            >
              <FiX />
            </button>
          </div>
          
          <div className="modal-body" style={{ padding: '30px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏰</div>
            <h3 style={{ marginBottom: '15px', fontSize: '20px', color: '#111827' }}>
              Jump #{expiredJumpAlert.id} esgotou o tempo!
            </h3>
            {expiredJumpAlert.dependente_name && (
              <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '10px' }}>
                <strong>Dependente:</strong> {expiredJumpAlert.dependente_name}
              </p>
            )}
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '10px' }}>
              <strong>Responsável:</strong> {expiredJumpAlert.customer_name}
            </p>
            {expiredJumpAlert.customer_telefone && (
              <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '20px' }}>
                <strong>Telefone:</strong> {expiredJumpAlert.customer_telefone}
              </p>
            )}
            <p style={{ fontSize: '16px', color: '#374151', marginTop: '20px' }}>
              Deseja enviar uma mensagem via WhatsApp para o responsável?
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            padding: '20px',
            borderTop: '1px solid #eee'
          }}>
            <Button
              variant="outline"
              onClick={() => {
                setShowExpiredJumpAlert(false);
                setExpiredJumpAlert(null);
              }}
            >
              Não
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (expiredJumpAlert) {
                  sendWhatsAppNotification(expiredJumpAlert);
                }
                setShowExpiredJumpAlert(false);
                setExpiredJumpAlert(null);
              }}
              style={{
                background: '#25D366',
                borderColor: '#25D366',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiMessageSquare /> Sim, Enviar WhatsApp
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Ajuste de Tempo Adicional */}
    {showAdjustTimeModal && adjustingTimeItem && (
      <div className="modal-overlay" style={{ zIndex: 10000 }}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
          backgroundColor: 'white',
          maxWidth: '500px',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div className="modal-header" style={{ 
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '16px 24px'
          }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', color: '#1e293b', fontWeight: 600 }}>
              <FiClock size={20} />
              Ajustar Tempo Adicional
            </h2>
            <button 
              className="modal-close" 
              onClick={() => {
                setShowAdjustTimeModal(false);
                setAdjustingTimeItem(null);
              }}
              style={{ color: '#64748b' }}
            >
              <FiX />
            </button>
          </div>
          
          <div className="modal-body" style={{ padding: '24px' }}>
            <div style={{
              padding: '16px',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '14px', color: '#475569', marginBottom: '6px' }}>
                <strong style={{ color: '#1e293b' }}>Item:</strong> {adjustingTimeItem.description || adjustingTimeItem.product_name}
              </div>
              <div style={{ fontSize: '14px', color: '#475569' }}>
                <strong style={{ color: '#1e293b' }}>Tempo adicional atual:</strong> {adjustingTimeItem.quantity} minutos
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#475569', marginBottom: '12px', lineHeight: '1.5' }}>
                Informe o novo tempo adicional em minutos. O valor será atualizado na comanda para refletir o ajuste manual.
              </p>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', padding: '10px', backgroundColor: '#fdf2f2', borderRadius: '6px', borderLeft: '4px solid #ef4444' }}>
                Nota: Digite 0 para remover completamente a cobrança de tempo adicional deste item.
              </p>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: '#334155',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em'
                }}>
                  Novo Tempo (Minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  max={adjustingTimeItem.quantity}
                  defaultValue={(() => {
                    const match = adjustingTimeItem.description?.match(/Jump #(\d+)/);
                    const jumpId = match ? parseInt(match[1]) : null;
                    return jumpId !== null && additionalTimeAdjustments[jumpId] !== undefined
                      ? additionalTimeAdjustments[jumpId].newQuantity
                      : adjustingTimeItem.quantity;
                  })()}
                  onChange={(e) => {
                    const jumpMatch = adjustingTimeItem.description?.match(/Jump #(\d+)/);
                    const jumpId = jumpMatch ? parseInt(jumpMatch[1]) : null;
                    if (jumpId) {
                      const value = Math.max(0, Math.min(adjustingTimeItem.quantity, parseInt(e.target.value) || 0));
                      setAdditionalTimeAdjustments(prev => ({
                        ...prev,
                        [jumpId]: {
                          newQuantity: value,
                          reason: prev[jumpId]?.reason || ''
                        }
                      }));
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: 700,
                    textAlign: 'center',
                    color: '#1e293b',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  autoFocus
                />
                <div style={{ 
                  marginTop: '6px', 
                  fontSize: '12px', 
                  color: '#94a3b8',
                  textAlign: 'center'
                }}>
                  Limite permitido: 0 a {adjustingTimeItem.quantity} minutos
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: '#334155',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em'
                }}>
                  Motivo do Ajuste <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => {
                    setAdjustmentReason(e.target.value);
                    const jumpMatch = adjustingTimeItem.description?.match(/Jump #(\d+)/);
                    const jumpId = jumpMatch ? parseInt(jumpMatch[1]) : null;
                    if (jumpId && additionalTimeAdjustments[jumpId]) {
                      setAdditionalTimeAdjustments(prev => ({
                        ...prev,
                        [jumpId]: {
                          newQuantity: prev[jumpId].newQuantity,
                          reason: e.target.value
                        }
                      }));
                    }
                  }}
                  placeholder="Descreva o motivo (ex: atraso no atendimento, compensação de tempo...)"
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
                <div style={{ 
                  marginTop: '6px', 
                  fontSize: '12px', 
                  color: '#64748b',
                  fontStyle: 'italic'
                }}>
                  Este campo é obrigatório para o registro do histórico.
                </div>
              </div>
            </div>

            {(() => {
              const jumpMatch = adjustingTimeItem.description?.match(/Jump #(\d+)/);
              const jumpId = jumpMatch ? parseInt(jumpMatch[1]) : null;
              const newQuantity = jumpId && additionalTimeAdjustments[jumpId] !== undefined 
                ? additionalTimeAdjustments[jumpId].newQuantity 
                : adjustingTimeItem.quantity;
              const unitPrice = parseFloat(adjustingTimeItem.subtotal) / adjustingTimeItem.quantity;
              const newTotal = newQuantity * unitPrice;

              return newQuantity !== adjustingTimeItem.quantity && (
                <div style={{
                  padding: '16px',
                  backgroundColor: newQuantity === 0 ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${newQuantity === 0 ? '#fecaca' : '#bbf7d0'}`,
                  borderRadius: '8px',
                  marginTop: '12px'
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: newQuantity === 0 ? '#dc2626' : '#16a34a',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {newQuantity === 0 ? <FiTrash2 size={16} /> : <FiCheckCircle size={16} />}
                    {newQuantity === 0 ? 'O tempo adicional será totalmente removido' : 'Novo valor calculado'}
                  </div>
                  {newQuantity > 0 && (
                    <>
                      <div style={{ fontSize: '14px', color: '#475569' }}>
                        {newQuantity} minutos × R$ {unitPrice.toFixed(2).replace('.', ',')} = 
                        <strong style={{ marginLeft: '8px', fontSize: '16px', color: '#16a34a' }}>
                          R$ {newTotal.toFixed(2).replace('.', ',')}
                        </strong>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        Diferença: - R$ {(parseFloat(adjustingTimeItem.subtotal) - newTotal).toFixed(2).replace('.', ',')}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            padding: '16px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0'
          }}>
            <Button
              variant="outline"
              onClick={() => {
                setShowAdjustTimeModal(false);
                setAdjustingTimeItem(null);
                setAdjustmentReason('');
              }}
              style={{ padding: '8px 20px' }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const jumpMatch = adjustingTimeItem.description?.match(/Jump #(\d+)/);
                const jumpId = jumpMatch ? parseInt(jumpMatch[1]) : null;
                
                if (jumpId && additionalTimeAdjustments[jumpId]) {
                  const newQuantity = additionalTimeAdjustments[jumpId].newQuantity;
                  
                  // Se houve alteração, o motivo é obrigatório
                  if (newQuantity !== adjustingTimeItem.quantity && !adjustmentReason.trim()) {
                    toast.error('Por favor, informe o motivo do ajuste');
                    return;
                  }
                }
                
                setShowAdjustTimeModal(false);
                setAdjustingTimeItem(null);
                setAdjustmentReason('');
              }}
              style={{
                backgroundColor: 'var(--primary-color, #001166)',
                borderColor: 'var(--primary-color, #001166)',
                color: '#fff',
                padding: '8px 24px',
                fontWeight: 600
              }}
            >
              Confirmar Ajuste
            </Button>
          </div>
        </div>
      </div>
    )}
  </div>

  {/* Modal fullscreen de Jumps */}
  {showJumpsExpandModal && currentCashRegister && (
    <div className="jumps-expand-modal">
      <div className="jumps-expand-modal__content">
        <button
          className="jumps-expand-modal__close"
          onClick={() => setShowJumpsExpandModal(false)}
          aria-label="Fechar"
        >
          <FiX size={28} />
        </button>
        <div className="jumps-expand-modal__columns">
          {/* Coluna 1: Em andamento - apenas do caixa atual */}
          <div className="jumps-expand-modal__col">
            <h3 className="jumps-expand-modal__col-title jumps-expand-modal__col-title--active">
              Em Andamento
            </h3>
            <div className="jumps-expand-modal__col-list jumps-expand-modal__col-list--grid">
              {activeJumps
                .filter((j) => {
                  if (j.order_cash_register_id && j.order_cash_register_id !== currentCashRegister.id) return false;
                  if (j.finished || j.is_paused) return false;
                  const rem = calculateRemainingTime(j.start_time, j.contracted_hours, j.time_extension_at, j.is_paused, j.paused_at, j.total_paused_time);
                  return rem !== '00:00:00';
                })
                .map((jump) => {
                  const status = getStatusIcon(jump.start_time, jump.contracted_hours, jump.time_extension_at, jump.time_extra_hours, jump.is_paused, jump.paused_at, jump.total_paused_time);
                  const scheduledEnd = calculateScheduledEndTime(jump.start_time, jump.contracted_hours, jump.time_extension_at, jump.total_paused_time);
                  const remainingTime = calculateRemainingTime(jump.start_time, jump.contracted_hours, jump.time_extension_at, jump.is_paused, jump.paused_at, jump.total_paused_time);
                  return (
                    <div
                      key={jump.id}
                      className={`jump-card ${status.cardClassName} jump-card--compact`}
                      onClick={() => {
                        setShowJumpsExpandModal(false);
                        handleOpenFinishModal(jump);
                      }}
                    >
                      <div className="card-status-bar" style={{ backgroundColor: status.bgColor }}></div>
                      <div className="jump-card-content">
                        <div className="jump-card-header">
                          <h3 className="customer-name">{getDisplayName(jump)}</h3>
                        </div>
                        <div className="jump-card-body">
                          {jump.order_number && (
                            <div className="info-row">
                              <FiShoppingCart className="info-icon" />
                              <span className="info-label">Comanda:</span>
                              <span className="info-value">#{jump.order_number}</span>
                            </div>
                          )}
                          <div className="info-row">
                            <FiCalendar className="info-icon" />
                            <span className="info-label">Tempo:</span>
                            <span className="info-value">{formatContractedHours(jump.contracted_hours)}</span>
                          </div>
                          <div className="info-row">
                            <FiPlay className="info-icon" />
                            <span className="info-label">Início:</span>
                            <span className="info-value">{formatTime(new Date(jump.start_time))}</span>
                          </div>
                          <div className="info-row">
                            <FiBarChart2 className="info-icon" />
                            <span className="info-label">Fim Programado:</span>
                            <span className="info-value">{formatTime(scheduledEnd)}</span>
                          </div>
                        </div>
                        <div className="jump-card-footer">
                          <div className="timer">
                            <FiClock size={20} className="timer-icon" />
                            <div className="timer-info">
                              <span className="timer-label">Tempo Restante</span>
                              <span className="timer-value">{remainingTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {activeJumps.filter((j) => {
                if (j.order_cash_register_id && j.order_cash_register_id !== currentCashRegister.id) return false;
                if (j.finished || j.is_paused) return false;
                const rem = calculateRemainingTime(j.start_time, j.contracted_hours, j.time_extension_at, j.is_paused, j.paused_at, j.total_paused_time);
                return rem !== '00:00:00';
              }).length === 0 && (
                <div className="jumps-expand-modal__empty">Nenhum em andamento</div>
              )}
            </div>
          </div>
          {/* Coluna 2: Pausados */}
          <div className="jumps-expand-modal__col">
            <h3 className="jumps-expand-modal__col-title jumps-expand-modal__col-title--paused">
              Pausados
            </h3>
            <div className="jumps-expand-modal__col-list jumps-expand-modal__col-list--grid">
              {activeJumps
                .filter((j) => {
                  if (j.order_cash_register_id && j.order_cash_register_id !== currentCashRegister.id) return false;
                  return !j.finished && j.is_paused;
                })
                .map((jump) => {
                  const status = getStatusIcon(jump.start_time, jump.contracted_hours, jump.time_extension_at, jump.time_extra_hours, jump.is_paused, jump.paused_at, jump.total_paused_time);
                  const scheduledEnd = calculateScheduledEndTime(jump.start_time, jump.contracted_hours, jump.time_extension_at, jump.total_paused_time);
                  return (
                    <div
                      key={jump.id}
                      className="jump-card jump-card--paused jump-card--compact"
                      onClick={() => {
                        setShowJumpsExpandModal(false);
                        handleOpenFinishModal(jump);
                      }}
                    >
                      <div className="paused-badge">
                        <FiPause /> PAUSADO
                      </div>
                      <div className="card-status-bar" style={{ backgroundColor: status.bgColor }}></div>
                      <div className="jump-card-content">
                        <div className="jump-card-header">
                          <h3 className="customer-name">{getDisplayName(jump)}</h3>
                        </div>
                        <div className="jump-card-body">
                          {jump.order_number && (
                            <div className="info-row">
                              <FiShoppingCart className="info-icon" />
                              <span className="info-label">Comanda:</span>
                              <span className="info-value">#{jump.order_number}</span>
                            </div>
                          )}
                          <div className="info-row">
                            <FiCalendar className="info-icon" />
                            <span className="info-label">Tempo:</span>
                            <span className="info-value">{formatContractedHours(jump.contracted_hours)}</span>
                          </div>
                          <div className="info-row">
                            <FiPlay className="info-icon" />
                            <span className="info-label">Início:</span>
                            <span className="info-value">{formatTime(new Date(jump.start_time))}</span>
                          </div>
                          <div className="info-row">
                            <FiBarChart2 className="info-icon" />
                            <span className="info-label">Fim Programado:</span>
                            <span className="info-value">{formatTime(scheduledEnd)}</span>
                          </div>
                        </div>
                        <div className="jump-card-footer">
                          <div className="timer">
                            <FiPause size={20} className="timer-icon" />
                            <div className="timer-info">
                              <span className="timer-label">PAUSADO</span>
                              <span className="timer-value">PAUSADO</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {activeJumps.filter((j) => {
                if (j.order_cash_register_id && j.order_cash_register_id !== currentCashRegister.id) return false;
                return !j.finished && j.is_paused;
              }).length === 0 && (
                <div className="jumps-expand-modal__empty">Nenhum pausado</div>
              )}
            </div>
          </div>
          {/* Coluna 3: Tempo esgotado */}
          <div className="jumps-expand-modal__col">
            <h3 className="jumps-expand-modal__col-title jumps-expand-modal__col-title--expired">
              Tempo Esgotado
            </h3>
            <div className="jumps-expand-modal__col-list jumps-expand-modal__col-list--grid">
              {activeJumps
                .filter((j) => {
                  if (j.order_cash_register_id && j.order_cash_register_id !== currentCashRegister.id) return false;
                  if (j.finished || j.is_paused) return false;
                  const rem = calculateRemainingTime(j.start_time, j.contracted_hours, j.time_extension_at, j.is_paused, j.paused_at, j.total_paused_time);
                  return rem === '00:00:00';
                })
                .map((jump) => {
                  const status = getStatusIcon(jump.start_time, jump.contracted_hours, jump.time_extension_at, jump.time_extra_hours, jump.is_paused, jump.paused_at, jump.total_paused_time);
                  const scheduledEnd = calculateScheduledEndTime(jump.start_time, jump.contracted_hours, jump.time_extension_at, jump.total_paused_time);
                  return (
                    <div
                      key={jump.id}
                      className={`jump-card ${status.cardClassName} jump-card--compact`}
                      onClick={() => {
                        setShowJumpsExpandModal(false);
                        handleOpenFinishModal(jump);
                      }}
                    >
                      <div className="card-status-bar" style={{ backgroundColor: status.bgColor }}></div>
                      <div className="jump-card-content">
                        <div className="jump-card-header">
                          <h3 className="customer-name">{getDisplayName(jump)}</h3>
                        </div>
                        <div className="jump-card-body">
                          {jump.order_number && (
                            <div className="info-row">
                              <FiShoppingCart className="info-icon" />
                              <span className="info-label">Comanda:</span>
                              <span className="info-value">#{jump.order_number}</span>
                            </div>
                          )}
                          <div className="info-row">
                            <FiCalendar className="info-icon" />
                            <span className="info-label">Tempo:</span>
                            <span className="info-value">{formatContractedHours(jump.contracted_hours)}</span>
                          </div>
                          <div className="info-row">
                            <FiPlay className="info-icon" />
                            <span className="info-label">Início:</span>
                            <span className="info-value">{formatTime(new Date(jump.start_time))}</span>
                          </div>
                          <div className="info-row">
                            <FiBarChart2 className="info-icon" />
                            <span className="info-label">Fim Programado:</span>
                            <span className="info-value">{formatTime(scheduledEnd)}</span>
                          </div>
                        </div>
                        <div className="jump-card-footer">
                          <div className="timer">
                            <FiClock size={20} className="timer-icon" />
                            <div className="timer-info">
                              <span className="timer-label">TEMPO ESGOTADO</span>
                              <span className="timer-value">TEMPO ESGOTADO</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {activeJumps.filter((j) => {
                if (j.order_cash_register_id && j.order_cash_register_id !== currentCashRegister.id) return false;
                if (j.finished || j.is_paused) return false;
                const rem = calculateRemainingTime(j.start_time, j.contracted_hours, j.time_extension_at, j.is_paused, j.paused_at, j.total_paused_time);
                return rem === '00:00:00';
              }).length === 0 && (
                <div className="jumps-expand-modal__empty">Nenhum tempo esgotado</div>
              )}
            </div>
          </div>
          {/* Coluna 4: Finalizados */}
          <div className="jumps-expand-modal__col">
            <h3 className="jumps-expand-modal__col-title jumps-expand-modal__col-title--finished">
              Finalizados
            </h3>
            <div className="jumps-expand-modal__col-list jumps-expand-modal__col-list--grid">
              {modalLoading ? (
                <div className="jumps-expand-modal__empty">Carregando...</div>
              ) : (
                <>
                  {modalFinishedJumps
                    .slice()
                    .sort((a, b) => new Date(b.end_time || b.updated_at).getTime() - new Date(a.end_time || a.updated_at).getTime())
                    .slice(0, 50)
                    .map((jump) => (
                        <div
                          key={jump.id}
                          className="jump-card jump-card--finished-modal jump-card--compact"
                        >
                          <div className="card-status-bar" style={{ backgroundColor: '#22c55e' }}></div>
                          <div className="jump-card-content">
                            <div className="jump-card-header">
                              <h3 className="customer-name">{getDisplayName(jump)}</h3>
                            </div>
                            <div className="jump-card-body">
                              {jump.order_number && (
                                <div className="info-row">
                                  <FiShoppingCart className="info-icon" />
                                  <span className="info-label">Comanda:</span>
                                  <span className="info-value">#{jump.order_number}</span>
                                </div>
                              )}
                              <div className="info-row">
                                <FiCalendar className="info-icon" />
                                <span className="info-label">Tempo:</span>
                                <span className="info-value">{jump.total_hours || formatContractedHours(jump.contracted_hours)}</span>
                              </div>
                              <div className="info-row">
                                <FiPlay className="info-icon" />
                                <span className="info-label">Início:</span>
                                <span className="info-value">{formatTime(new Date(jump.start_time))}</span>
                              </div>
                              <div className="info-row">
                                <FiBarChart2 className="info-icon" />
                                <span className="info-label">Fim:</span>
                                <span className="info-value">{jump.end_time ? formatTime(new Date(jump.end_time)) : '-'}</span>
                              </div>
                            </div>
                            <div className="jump-card-footer">
                              <div className="timer">
                                <FiCheckCircle size={20} className="timer-icon" />
                                <div className="timer-info">
                                  <span className="timer-label">Finalizado</span>
                                  <span className="timer-value">{jump.total_hours || '-'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                    ))}
                  {!modalLoading && modalFinishedJumps.length === 0 && (
                    <div className="jumps-expand-modal__empty">Nenhum finalizado</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
</Layout>
);
};

export default Dashboard;