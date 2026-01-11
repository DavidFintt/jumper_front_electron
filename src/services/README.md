# 🔌 Services - API Integration

Camada de serviços para integração com a API Django.

## 📦 Estrutura

```
services/
├── api.ts                      # Classe base com Axios e interceptors
├── types.ts                    # Interfaces e tipos compartilhados
├── authService.ts              # Autenticação
├── companyConfigService.ts     # Configurações da empresa
├── companyService.ts           # Empresas
├── customerService.ts          # Clientes e dependentes
├── jumpUsageService.ts         # Uso do Jump
├── userService.ts              # Usuários
└── index.ts                    # Exporta tudo
```

## 🎯 API Base (api.ts)

Classe que extende o Axios com funcionalidades:

### **Funcionalidades:**
- ✅ Interceptor de request (adiciona token automaticamente)
- ✅ Interceptor de response (trata erros e refresh token)
- ✅ Refresh token automático quando token expira
- ✅ Logout automático quando refresh falha
- ✅ Fila de requisições durante refresh
- ✅ Singleton pattern (instância única)

### **Uso:**
```typescript
import { api } from '@/services';

// GET
const data = await api.get('/endpoint/');

// POST
const result = await api.post('/endpoint/', { data });

// PUT
await api.put('/endpoint/1/', { data });

// DELETE
await api.delete('/endpoint/1/');
```

## 🔐 Auth Service

Gerenciamento de autenticação.

```typescript
import { authService } from '@/services';

// Login
const response = await authService.login({
  username: 'admin',
  password: '123456',
});

// Logout
authService.logout();

// Verificar se está autenticado
const isAuth = authService.isAuthenticated();

// Pegar usuário atual
const user = authService.getCurrentUser();
```

## 🏢 Company Config Service

Configurações da empresa (cores, logo, etc).

```typescript
import { companyConfigService } from '@/services';

// Buscar config
const response = await companyConfigService.getByCompanyId(1);

// Atualizar config
await companyConfigService.update(1, {
  primary_color: '#001166',
  secondary_color: '#FFFFFF',
});
```

## 🏢 Company Service

Gerenciamento de empresas.

```typescript
import { companyService } from '@/services';

// Listar empresas
const response = await companyService.list();

// Buscar por ID
const company = await companyService.getById(1);

// Criar empresa
await companyService.create({
  name: 'Jump Park SP',
  cnpj: '12.345.678/0001-90',
  // ...
});

// Atualizar
await companyService.update(1, { name: 'Novo Nome' });

// Deletar
await companyService.delete(1);
```

## 👥 Customer Service

Gerenciamento de clientes e dependentes.

```typescript
import { customerService } from '@/services';

// Clientes
const customers = await customerService.list(companyId);
const customer = await customerService.getById(1, companyId);
await customerService.create({ name: 'João Silva', ... }, companyId);
await customerService.update(1, { name: 'João' }, companyId);
await customerService.delete(1, companyId);

// Dependentes
const dependentes = await customerService.listDependentes(companyId);
const deps = await customerService.getCustomerDependentes(1, companyId);
await customerService.createDependente({ name: 'Maria', ... }, companyId);
await customerService.updateDependente(1, { name: 'Maria' }, companyId);
await customerService.deleteDependente(1, companyId);
```

## 🎯 Jump Usage Service

Gerenciamento do uso do Jump.

```typescript
import { jumpUsageService } from '@/services';

// Listar usos
const usages = await jumpUsageService.list(companyId);

// Listar apenas ativos
const active = await jumpUsageService.listActive(companyId);

// Iniciar uso
await jumpUsageService.create({
  customer: 1,
  dependente: 2,
}, companyId);

// Finalizar uso
await jumpUsageService.finish(1, {
  additional_minutes: 15,
}, companyId);
```

## 👤 User Service

Gerenciamento de usuários.

```typescript
import { userService } from '@/services';

// Listar usuários
const users = await userService.list(companyId);

// Criar usuário
await userService.create({
  username: 'joao',
  email: 'joao@email.com',
  password: '123456',
  first_name: 'João',
  last_name: 'Silva',
  is_admin: false,
  company: 1,
}, companyId);

// Atualizar
await userService.update(1, { first_name: 'João' }, companyId);

// Deletar
await userService.delete(1, companyId);

// Alterar senha
await userService.changePassword({
  old_password: '123456',
  new_password: '654321',
});
```

## 📦 Types

Interfaces TypeScript para todas as entidades:

```typescript
import {
  User,
  Company,
  CompanyConfig,
  Customer,
  Dependente,
  JumpUsage,
  ApiResponse,
} from '@/services';
```

## 🔄 Refresh Token

O refresh token é automático:

```
1. Requisição falha com 401
   ↓
2. Interceptor detecta
   ↓
3. Tenta refresh token
   ↓
4. Se sucesso: atualiza token e tenta requisição novamente
   ↓
5. Se falha: faz logout automático
```

## ⚙️ Configuração

### **Base URL:**
```typescript
// services/api.ts
baseURL: 'http://localhost:8000/api'
```

### **Headers padrão:**
```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {token}', // adicionado automaticamente
}
```

## 🎯 Padrão de Response

Todas as respostas seguem o padrão:

```typescript
{
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
```

## 🚀 Como usar nos componentes

```typescript
import { useState, useEffect } from 'react';
import { customerService, Customer } from '@/services';

function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const companyId = parseInt(localStorage.getItem('selectedCompany') || '');
      const response = await customerService.list(companyId);
      
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {customers.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
```

## ✅ Vantagens

1. **Centralizado** - Um lugar para todas as chamadas API
2. **Tipado** - TypeScript completo
3. **Automático** - Refresh token e logout automáticos
4. **Consistente** - Padrão único para todos os serviços
5. **Reutilizável** - Import e use em qualquer componente
6. **Testável** - Fácil de mockar e testar

## 🔧 Instalação do Axios

Execute o script:
```bash
.\install_axios.bat
```

Ou manualmente:
```bash
cd jump_front
npm install axios
```











