# CloseCashRegisterModal

Modal para fechamento de caixa com suporte a transferência de comandas e jumps ativos.

## Funcionalidades

- Fechamento de caixa com valor final e observações
- Detecção automática de comandas abertas e jumps em uso
- Modal de transferência quando há itens pendentes
- Seleção de usuário para transferir os itens
- Impressão automática do comprovante fiscal
- Validação de formulário
- Estados de loading e erro

## Como Usar

### 1. Import o componente

```tsx
import CloseCashRegisterModal from '../components/CloseCashRegisterModal';
import { cashRegisterService } from '../services';
```

### 2. Configure o estado

```tsx
const [showCloseModal, setShowCloseModal] = useState(false);
const [currentCashRegister, setCurrentCashRegister] = useState<CashRegister | null>(null);

// Carregar o caixa atual
useEffect(() => {
  loadCurrentCashRegister();
}, []);

const loadCurrentCashRegister = async () => {
  const response = await cashRegisterService.getCurrent(companyId);
  if (response.success && response.data) {
    setCurrentCashRegister(response.data);
  }
};
```

### 3. Adicione o botão para abrir o modal

```tsx
<button onClick={() => setShowCloseModal(true)}>
  Fechar Caixa
</button>
```

### 4. Renderize o modal

```tsx
<CloseCashRegisterModal
  isOpen={showCloseModal}
  onClose={() => setShowCloseModal(false)}
  cashRegister={currentCashRegister}
  onSuccess={() => {
    // Atualizar lista de caixas ou redirecionar
    loadCashRegisters();
  }}
/>
```

## Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `isOpen` | `boolean` | Sim | Controla a visibilidade do modal |
| `onClose` | `() => void` | Sim | Função chamada ao fechar o modal |
| `cashRegister` | `CashRegister \| null` | Sim | Dados do caixa a ser fechado |
| `onSuccess` | `() => void` | Não | Função chamada após fechar com sucesso |

## Fluxo de Funcionamento

1. **Usuário clica em "Fechar Caixa"**
   - Modal é exibido com informações do caixa
   - Valor esperado é pré-preenchido

2. **Usuário preenche o valor final e observações**
   - Clica em "Fechar Caixa"

3. **Sistema verifica itens pendentes**
   - **Se NÃO houver itens pendentes:**
     - Caixa é fechado normalmente
     - Comprovante fiscal é impresso
     - Modal é fechado
   
   - **Se HOUVER comandas abertas ou jumps ativos:**
     - API retorna erro com contagem de itens pendentes
     - Modal exibe seção de transferência
     - Lista usuários disponíveis
     - Usuário seleciona para quem transferir

4. **Usuário seleciona usuário de transferência**
   - Clica em "Fechar Caixa" novamente
   - Sistema transfere os itens para o usuário selecionado
   - Cria ou usa caixa aberto do usuário de destino
   - Fecha o caixa atual
   - Imprime comprovante fiscal

## Exemplo Completo

```tsx
import React, { useState, useEffect } from 'react';
import { cashRegisterService } from '../services';
import type { CashRegister } from '../services/cashRegisterService';
import CloseCashRegisterModal from '../components/CloseCashRegisterModal';

const CaixaPage: React.FC = () => {
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const selectedCompany = localStorage.getItem('selectedCompany');
  const companyId = selectedCompany ? parseInt(selectedCompany) : userData.company;

  useEffect(() => {
    loadCashRegister();
  }, []);

  const loadCashRegister = async () => {
    setLoading(true);
    const response = await cashRegisterService.getCurrent(companyId);
    if (response.success && response.data) {
      setCashRegister(response.data);
    }
    setLoading(false);
  };

  const handleCloseSuccess = () => {
    setShowCloseModal(false);
    loadCashRegister(); // Recarregar dados
  };

  return (
    <div>
      {loading ? (
        <p>Carregando...</p>
      ) : cashRegister ? (
        <div>
          <h1>Caixa #{cashRegister.id}</h1>
          <p>Status: {cashRegister.status}</p>
          <p>Total: R$ {cashRegister.total_sales}</p>
          
          {cashRegister.status === 'open' && (
            <button onClick={() => setShowCloseModal(true)}>
              Fechar Caixa
            </button>
          )}
        </div>
      ) : (
        <p>Nenhum caixa aberto</p>
      )}

      <CloseCashRegisterModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        cashRegister={cashRegister}
        onSuccess={handleCloseSuccess}
      />
    </div>
  );
};

export default CaixaPage;
```

## Notas Importantes

1. **Impressão de Comprovante**: O modal tenta imprimir o comprovante usando `window.electronAPI.printFiscal`. Se não estiver disponível, abre em uma nova janela.

2. **Validações**: 
   - Valor de fechamento é obrigatório e deve ser >= 0
   - Se houver itens pendentes, a seleção de usuário é obrigatória

3. **Lista de Usuários**: 
   - Mostra apenas usuários da mesma empresa
   - Exclui o usuário atual
   - Indica quem é admin/superuser

4. **Tratamento de Erros**: 
   - Erros são exibidos no próprio modal
   - Toast notifications são mostradas para feedback

## Requisitos

- React 17+
- react-toastify
- react-icons
- Services: cashRegisterService, userService









