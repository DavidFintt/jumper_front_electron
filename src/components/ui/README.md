# 🎨 UI Components

Biblioteca de componentes reutilizáveis do Jump System.

## 📦 Componentes Disponíveis

### **Input**
Campo de entrada de texto com label e mensagem de erro.

```typescript
import { Input } from '@/components/ui';

<Input
  label="Usuário"
  type="text"
  placeholder="Digite seu usuário"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  error={error}
  disabled={loading}
/>
```

**Props:**
- Todos os atributos de `HTMLInputElement`
- `label?: string` - Label do campo
- `error?: string` - Mensagem de erro

---

### **Button**
Botão com múltiplas variantes e estados.

```typescript
import { Button } from '@/components/ui';

<Button
  variant="primary"
  size="large"
  fullWidth
  loading={loading}
  onClick={handleClick}
>
  Entrar
</Button>
```

**Props:**
- Todos os atributos de `HTMLButtonElement`
- `variant?: 'primary' | 'secondary' | 'danger' | 'outline'` - Estilo do botão
- `size?: 'small' | 'medium' | 'large'` - Tamanho do botão
- `fullWidth?: boolean` - Ocupar toda a largura
- `loading?: boolean` - Estado de carregamento

---

### **Card**
Container com sombra e bordas arredondadas.

```typescript
import { Card } from '@/components/ui';

<Card variant="elevated" padding="large">
  <h1>Conteúdo do Card</h1>
</Card>
```

**Props:**
- Todos os atributos de `HTMLDivElement`
- `variant?: 'default' | 'elevated' | 'outlined'` - Estilo do card
- `padding?: 'none' | 'small' | 'medium' | 'large'` - Padding interno

---

### **Alert**
Mensagem de alerta/notificação.

```typescript
import { Alert } from '@/components/ui';

<Alert variant="error">
  Erro ao fazer login
</Alert>
```

**Props:**
- Todos os atributos de `HTMLDivElement`
- `variant?: 'error' | 'success' | 'warning' | 'info'` - Tipo de alerta

---

## 🎨 Cores Padrão

- **Primária**: `#001166` (Azul escuro)
- **Secundária**: `#FFFFFF` (Branco)
- **Erro**: `#c33` (Vermelho)
- **Sucesso**: `#3c3` (Verde)
- **Warning**: `#cc6600` (Laranja)

## 📁 Estrutura

```
components/ui/
├── Input/
│   ├── Input.tsx
│   ├── Input.css
│   └── index.ts
├── Button/
│   ├── Button.tsx
│   ├── Button.css
│   └── index.ts
├── Card/
│   ├── Card.tsx
│   ├── Card.css
│   └── index.ts
├── Alert/
│   ├── Alert.tsx
│   ├── Alert.css
│   └── index.ts
└── index.ts (exporta todos)
```

## 🚀 Como usar

### **Importação única:**
```typescript
import { Input, Button, Card, Alert } from '@/components/ui';
```

### **Importação individual:**
```typescript
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
```

## 🎯 Exemplo Completo

```typescript
import { Input, Button, Card, Alert } from '@/components/ui';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <Card variant="elevated" padding="large">
      <h1>Login</h1>
      
      {error && <Alert variant="error">{error}</Alert>}
      
      <Input
        label="Usuário"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={loading}
      />
      
      <Input
        type="password"
        label="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />
      
      <Button
        variant="primary"
        fullWidth
        loading={loading}
      >
        Entrar
      </Button>
    </Card>
  );
}
```

## ✅ Vantagens

1. **Reutilizáveis** - Use em qualquer página
2. **Consistentes** - Design padronizado
3. **Acessíveis** - Atributos semânticos
4. **Customizáveis** - Props flexíveis
5. **Tipados** - TypeScript completo











