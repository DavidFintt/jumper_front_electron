/// <reference types="../../../global" />
import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Card, Alert } from '../../../../components/ui';
import { api } from '../../../../services/api';
import { toast } from 'react-toastify';
import './Login.css';

interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    user: {
      is_admin: boolean;
      is_superuser: boolean;
      company: number | null;
      companies_managed_ids: number[];
      first_name: string;
      full_name: string;
    };
    tokens: {
      access: string;
      refresh: string;
    };
  };
  error?: string;
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (window.electronAPI?.getPrinters) {
      window.electronAPI
        .getPrinters()
        .then((printers) => {
          console.log('Impressoras instaladas:', printers);
        })
        .catch((err) => {
          console.error('Erro ao buscar impressoras:', err);
        });
    } else {
      console.log('electronAPI.getPrinters não disponível');
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const response = await api.get('/check-subscription/');
      
      if (response.success && response.data) {
        // Se for superuser ou admin, não verifica agora (deixa escolher empresa)
        if (response.data.is_superuser) {
          return { canAccess: true };
        }
        
        // Se não tem empresa, não precisa verificar
        if (!response.data.has_company || !response.data.companies || response.data.companies.length === 0) {
          return { canAccess: true };
        }
        
        // APENAS verificar se for usuário comum (uma única empresa)
        if (response.data.companies.length === 1) {
          const company = response.data.companies[0];
          
          // Se venceu, bloquear acesso
          if (company.is_expired) {
            toast.error(company.message || 'Assinatura vencida! Entre em contato com o suporte.', {
              autoClose: 10000,
              closeOnClick: true,
            });
            return { canAccess: false, message: company.message };
          }
        }
        
        // Admin com múltiplas empresas: permite acesso para escolher
        return { canAccess: true };
      }
      
      return { canAccess: true };
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      return { canAccess: true }; // Em caso de erro, permite acesso
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.data) {
        localStorage.setItem('accessToken', data.data.tokens.access);
        localStorage.setItem('refreshToken', data.data.tokens.refresh);
        localStorage.setItem('userData', JSON.stringify(data.data.user));

        if (!data.data.user.is_admin && !data.data.user.is_superuser && data.data.user.company) {
          localStorage.setItem('selectedCompany', data.data.user.company.toString());
        }

        // Verificar assinatura antes de redirecionar
        const subscriptionCheck = await checkSubscription();
        
        if (!subscriptionCheck.canAccess) {
          // Assinatura vencida - bloquear acesso
          setTimeout(() => {
            localStorage.clear();
            setError(subscriptionCheck.message || 'Assinatura vencida. Entre em contato com o suporte.');
            setLoading(false);
          }, 3000);
          return;
        }

        // Verificar tipo de usuário e redirecionar apropriadamente
        if (data.data.user.is_superuser) {
          // Superuser vai para tela de escolha de modo
          navigate('/superuser-mode');
        } else if (data.data.user.is_admin) {
          if (data.data.user.companies_managed_ids.length > 0) {
            navigate('/select-company');
          } else {
            setError('Você não possui empresas vinculadas. Entre em contato com o administrador do sistema.');
            localStorage.clear();
          }
        } else if (data.data.user.company) {
          navigate('/dashboard');
        } else {
          setError('Usuário sem empresa vinculada. Entre em contato com o administrador.');
          localStorage.clear();
        }
      } else {
        setError(data.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card variant="elevated" padding="large" className="login-box">
        <div className="login-header">
          <img src="./logo.png" alt="Jump System" className="login-logo" />
          <p>Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            type="email"
            id="email"
            label="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu e-mail"
            required
            autoComplete="email"
            disabled={loading}
          />

          <Input
            type="password"
            id="password"
            label="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
            required
            autoComplete="current-password"
            disabled={loading}
          />

          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            loading={loading}
          >
            Entrar
          </Button>
        </form>

        <div className="login-footer">
          <p>© 2024 Jump System - Todos os direitos reservados</p>
        </div>
      </Card>
    </div>
  );
}

export default Login;
