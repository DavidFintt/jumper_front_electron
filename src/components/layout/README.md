# 🎨 Layout Components

Componentes de layout para páginas internas do Jump System.

## 📦 Componentes Disponíveis

### **Layout**
Container principal que envolve todas as páginas internas com Sidebar.

```typescript
import { Layout } from '@/components/layout';

function Dashboard() {
  return (
    <Layout>
      <div>Conteúdo da página</div>
    </Layout>
  );
}
```

**Props:**
- `children: ReactNode` - Conteúdo da página

---

### **Sidebar**
Menu lateral com navegação, informações do usuário e empresa.

```typescript
import { Sidebar } from '@/components/layout';

<Sidebar />
```

**Funcionalidades:**
- ✅ Menu de navegação com ícones
- ✅ Informações da empresa selecionada
- ✅ Avatar e perfil do usuário
- ✅ Botão de trocar empresa (para admins)
- ✅ Botão de logout
- ✅ Modo expandido/retraído
- ✅ Responsivo (mobile com overlay)
- ✅ Itens de menu baseados em permissões

**Menu items:**
- 📊 Dashboard - Todos os usuários
- 👥 Clientes - Todos os usuários
- 🎯 Uso do Jump - Todos os usuários
- 👤 Usuários - Apenas admins e superusers
- 🏢 Empresas - Apenas superusers
- ⚙️ Configurações - Apenas admins e superusers

---

## 🎨 Estrutura

```
components/layout/
├── Layout/
│   ├── Layout.tsx
│   ├── Layout.css
│   └── index.ts
├── Sidebar/
│   ├── Sidebar.tsx
│   ├── Sidebar.css
│   └── index.ts
└── index.ts (exporta todos)
```

## 🚀 Como usar

### **Exemplo completo:**

```typescript
import { Layout } from '@/components/layout';
import { Card } from '@/components/ui';

function MyPage() {
  return (
    <Layout>
      <div className="page-container">
        <h1>Minha Página</h1>
        
        <Card>
          <p>Conteúdo da página</p>
        </Card>
      </div>
    </Layout>
  );
}
```

## 🎯 Estados do Sidebar

### **Expandido (Desktop):**
- Largura: 280px
- Mostra labels completos
- Mostra informações da empresa
- Mostra informações do usuário

### **Retraído (Desktop):**
- Largura: 80px
- Mostra apenas ícones
- Tooltips nos itens

### **Mobile:**
- Overlay escuro sobre o conteúdo
- Sidebar desliza da esquerda
- Botão de menu hamburguer
- Fecha ao clicar fora

## 🎨 Customização

O Sidebar usa a cor primária da empresa para:
- Header do sidebar
- Indicador de cor da empresa
- Avatar do usuário
- Item de menu ativo (com opacidade)

## 📱 Responsividade

### **Desktop (> 768px):**
- Sidebar fixa na lateral
- Conteúdo ajusta margem automaticamente
- Toggle entre expandido/retraído

### **Mobile (≤ 768px):**
- Sidebar oculta por padrão
- Abre com overlay
- Botão hamburguer flutuante
- Fecha ao clicar no overlay

## ✅ Acessibilidade

- ✅ Botões com `aria-label`
- ✅ Tooltips para modo retraído
- ✅ Foco visível nos elementos
- ✅ Navegação por teclado

## 🎯 Permissões

O menu adapta-se automaticamente baseado no tipo de usuário:

```typescript
// Usuário comum
- Dashboard
- Clientes
- Uso do Jump

// Admin
+ Usuários
+ Configurações

// Superuser
+ Empresas
```

## 📋 Integração

Para adicionar uma nova página ao menu:

```typescript
// Sidebar.tsx
const menuItems: MenuItem[] = [
  // ... itens existentes
  {
    id: 'nova-pagina',
    label: 'Nova Página',
    icon: '🎨',
    path: '/nova-pagina',
    adminOnly: true, // opcional
  },
];
```











