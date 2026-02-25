// Response padrão da API
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Response de finalização de jump (inclui cupom fiscal)
export interface JumpFinishResponse {
  success: boolean;
  message?: string;
  data?: JumpUsage;
  cupom_fiscal?: string;
  error?: string;
}

// Response de fechamento de caixa (inclui comprovante fiscal)
export interface CashRegisterCloseResponse {
  success: boolean;
  message?: string;
  data?: CashRegister;
  comprovante_fiscal?: string;
  error?: string;
  pending_items?: {
    open_orders_count: number;
    active_jumps_count: number;
  };
}

// Cash Register
export interface CashRegister {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
  company: number;
  company_name: string;
  status: 'open' | 'closed';
  opening_amount: string;
  opened_at: string;
  closing_amount: string | null;
  closed_at: string | null;
  total_sales: string;
  total_orders: number;
  expected_closing_amount: string;
  difference: string | null;
  opening_notes: string;
  closing_notes: string;
  created_at: string;
  updated_at: string;
}

// User
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_admin: boolean;
  is_superuser: boolean;
  is_active: boolean;
  company: number | null;
  companies_managed_ids: number[];
  companies_managed_names: string[];
  user_type: string;
  created_at: string;
  updated_at: string;
}

// Company
export interface Company {
  id: number;
  name: string;
  legal_name: string;
  cnpj: string;
  inscricao_estadual?: string; // Inscrição Estadual (opcional para unidades)
  ie_isento?: boolean; // Indica se é isento de IE
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  is_active: boolean;
  due_date: number;
  unit_name?: string; // Nome da unidade (opcional)
  is_matriz: boolean; // Indica se é matriz ou unidade
  matriz: number | null; // ID da matriz (para unidades)
  matriz_name?: string; // Nome da matriz (apenas leitura)
  created_at: string;
  updated_at: string;
}

// Company Config
export interface CompanyConfig {
  id: string;
  company: number;
  company_legal_name: string;
  business_name: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  additional_minute_price: string;
  logo: string | null;
  business_description: string | null;
  whatsapp_number: string | null;
  instagram_handle: string | null;
  send_notifications: boolean;
  notification_email: string | null;
  created_at: string;
  updated_at: string;
}

// Customer
export interface Customer {
  id: string;
  company: number;
  company_name?: string;
  cpf: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  idade?: number;
  endereco: string;
  cidade: string;
  cep: string;
  is_active: boolean;
  pcd: boolean;
  estrangeiro: boolean;
  created_at: string;
  updated_at: string;
}

// Dependente
export interface Dependente {
  id: string;
  nome: string;
  data_nascimento: string;
  idade: number;
  cliente: string;
  cliente_nome: string;
  aprovacao_responsavel: boolean;
  pcd: boolean;
  created_at: string;
  updated_at: string;
}

// Jump Usage
export interface JumpUsage {
  id: string;
  company: number;
  customer: string;
  customer_name: string;
  customer_telefone?: string;
  dependente: string | null;
  dependente_name: string | null;
  company_name: string;
  contracted_hours: number;
  contracted_hours_display: string;
  start_time: string;
  end_time: string | null;
  additional_time: string;
  additional_time_formatted: string;
  total_hours: string;
  finished: boolean;
  is_paused: boolean;
  paused_at: string | null;
  total_paused_time: string;
  time_extension_at: string | null;
  time_extra_hours: number | null;
  created_at: string;
  updated_at: string;
  order?: string | null;
  order_number?: number | null;
  order_closed?: boolean;
  order_cash_register_id?: string | null;
  user_id?: string | null;
}

// Login
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

// Pagination
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Product Types
export interface ProductType {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  product_type: string;
  product_type_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EquipmentUnit {
  id: string;
  product: string;
  product_name: string;
  number: string;
  status: 'available' | 'in_use' | 'maintenance';
  status_display: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Orders
export interface OrderItem {
  id: string;
  order: string;
  product: string;
  product_name: string;
  product_type_name: string;
  item_type: 'jump_time' | 'consumable' | 'additional_time';
  quantity: number;
  unit_price: string;
  subtotal: string;
  description?: string;
  pago: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number?: number;
  company: number;
  customer: string;
  customer_name: string;
  customer_cpf?: string;
  customer_pcd?: boolean;
  dependente: string | null;
  dependente_name: string | null;
  dependente_pcd?: boolean | null;
  is_pcd?: boolean;
  cash_register: string | null;
  transferred_to_user: string | null;
  status: 'open' | 'closed' | 'cancelled';
  total_amount: string;
  total?: string;
  items: OrderItem[];
  created_at: string;
  closed_at: string | null;
  updated_at: string;
  jump_usages_count?: number;
  jump_usages?: JumpUsage[];
}
