import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface CompanyStatus {
  company_id: number;
  company_name: string;
  due_day: number;
  is_expired: boolean;
  days_to_expire: number;
  show_warning: boolean;
  has_payment_this_month: boolean;
  message: string | null;
  due_date: string;
}

interface SubscriptionData {
  is_superuser?: boolean;
  has_company: boolean;
  companies: CompanyStatus[];
  has_expired?: boolean;
  has_warning?: boolean;
}

export const useSubscriptionCheck = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkSubscription = async () => {
    try {
      setLoading(true);
      const response = await api.get('/check-subscription/');
      
      if (response.success && response.data) {
        setSubscriptionStatus(response.data);
        
        // Se for superuser, não precisa verificar
        if (response.data.is_superuser) {
          setLoading(false);
          return;
        }
        
        // Se não tem empresa, não precisa verificar
        if (!response.data.has_company || !response.data.companies || response.data.companies.length === 0) {
          setLoading(false);
          return;
        }
        
        // Verificar se alguma empresa está com assinatura vencida
        const expiredCompanies = response.data.companies.filter((c: CompanyStatus) => c.is_expired);
        
        if (expiredCompanies.length > 0) {
          // Bloquear acesso
          expiredCompanies.forEach((company: CompanyStatus) => {
            toast.error(company.message || 'Assinatura vencida!', {
              autoClose: false,
              closeOnClick: false,
            });
          });
          
          // Redirecionar para uma página de bloqueio ou fazer logout
          setTimeout(() => {
            localStorage.clear();
            navigate('/login');
          }, 3000);
          
          setLoading(false);
          return;
        }
        
        // Verificar se alguma empresa está perto de vencer (avisos)
        const warningCompanies = response.data.companies.filter((c: CompanyStatus) => c.show_warning);
        
        if (warningCompanies.length > 0) {
          warningCompanies.forEach((company: CompanyStatus) => {
            if (company.message) {
              toast.warning(company.message, {
                autoClose: 10000,
                position: 'top-center',
              });
            }
          });
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verificar ao montar o componente
    checkSubscription();
    
    // Verificar periodicamente (a cada 1 hora)
    const interval = setInterval(() => {
      checkSubscription();
    }, 60 * 60 * 1000); // 1 hora
    
    return () => clearInterval(interval);
  }, []);

  return {
    subscriptionStatus,
    loading,
    checkSubscription,
  };
};





