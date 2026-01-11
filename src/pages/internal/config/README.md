# ⚙️ Página de Configurações

Página para admins e superusers configurarem a aparência e configurações da empresa.

## 🎯 Funcionalidades

### **🎨 Cores do Sistema**
- Seletor de cor primária (visual e hex)
- Seletor de cor secundária (visual e hex)
- Preview em tempo real das cores
- Aplicação imediata das cores no sistema

### **🏢 Informações do Negócio**
- Nome do negócio
- Descrição
- WhatsApp
- Instagram handle

### **💰 Precificação**
- Preço por minuto adicional

### **🔔 Notificações**
- Toggle para habilitar/desabilitar notificações
- Email para receber notificações

## 🎨 Preview de Cores

A página possui um card de preview que mostra em tempo real como as cores ficarão:

```tsx
<div style={{ 
  backgroundColor: primaryColor,
  color: secondaryColor 
}}>
  <h3>Preview</h3>
  <p>Este é um exemplo</p>
  <button style={{ 
    backgroundColor: secondaryColor,
    color: primaryColor 
  }}>
    Botão
  </button>
</div>
```

## 🔄 Fluxo

```
1. Admin acessa /config
   ↓
2. Sistema busca configurações da empresa
   ↓
3. Formulário é preenchido
   ↓
4. Admin altera cores/configurações
   ↓
5. Preview atualiza em tempo real
   ↓
6. Admin clica em "Salvar"
   ↓
7. Configurações são salvas no banco
   ↓
8. Cores são aplicadas em todo o sistema
   ↓
9. Cache é atualizado
```

## 📡 API Integration

```typescript
// Buscar configurações
const response = await companyConfigService.getByCompanyId(companyId);

// Salvar configurações
const response = await companyConfigService.update(companyId, {
  primary_color: '#001166',
  secondary_color: '#FFFFFF',
  business_name: 'Jump Park SP',
  additional_minute_price: '5.00',
  // ...
});
```

## 🎨 Componentes Usados

- `Layout` - Layout com sidebar
- `Card` - Cards para agrupar seções
- `Input` - Campos de texto, color picker, checkbox
- `Button` - Botões de ação
- `Alert` - Mensagens de erro/sucesso

## 🔐 Permissões

**Acesso:** Apenas admins e superusers

```typescript
// Verificação no carregamento
if (!user.is_admin && !user.is_superuser) {
  navigate('/dashboard');
  return;
}
```

## ⚙️ Campos do Formulário

### **Cores:**
- `primary_color`: Cor primária (hex) - obrigatório
- `secondary_color`: Cor secundária (hex) - obrigatório

### **Negócio:**
- `business_name`: Nome do negócio - opcional
- `business_description`: Descrição - opcional
- `whatsapp_number`: WhatsApp - opcional
- `instagram_handle`: Instagram - opcional

### **Preço:**
- `additional_minute_price`: Preço/minuto - obrigatório (decimal)

### **Notificações:**
- `send_notifications`: Enviar notificações - boolean
- `notification_email`: Email - opcional (obrigatório se notificações ativas)

## 🎯 Exemplo de Uso

```typescript
// Acessar
navigate('/config');

// Alterar cor primária
setPrimaryColor('#10b981');

// Preview atualiza automaticamente
document.documentElement.style.setProperty('--primary-color', '#10b981');

// Salvar
await companyConfigService.update(companyId, {
  primary_color: '#10b981',
  // ...outros campos
});

// Cores aplicadas em todo o sistema
```

## 🎨 Preview em Tempo Real

Ao alterar as cores, o preview é atualizado instantaneamente:

```typescript
const handleColorPreview = (color: string, type: 'primary' | 'secondary') => {
  if (type === 'primary') {
    document.documentElement.style.setProperty('--primary-color', color);
  } else {
    document.documentElement.style.setProperty('--secondary-color', color);
  }
};
```

## ✅ Validações

- Cor primária e secundária são obrigatórias
- Formato hex válido (#RRGGBB)
- Preço adicional deve ser numérico positivo
- Email de notificação válido (se notificações ativas)

## 📱 Responsivo

- Desktop: Grid 2 colunas
- Mobile: 1 coluna
- Botões full-width em mobile
- Color pickers adaptados

## 🚀 Melhorias Futuras

- [ ] Upload de logo
- [ ] Preview de logo
- [ ] Mais opções de cores (tertiary, accent, etc)
- [ ] Temas pré-definidos
- [ ] Dark mode
- [ ] Paleta de cores sugeridas
- [ ] Validação de contraste (acessibilidade)











