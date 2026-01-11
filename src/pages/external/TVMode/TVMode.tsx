import React, { useState, useEffect, useMemo } from 'react';
import { jumpUsageService } from '../../../services';
import type { JumpUsage } from '../../../services/types';
import { FiClock, FiPause, FiCalendar, FiPlay, FiBarChart2, FiWifiOff } from 'react-icons/fi';
import './TVMode.css';

const TVMode: React.FC = () => {
  const [activeJumps, setActiveJumps] = useState<JumpUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Carrega os jumps na montagem do componente
    loadActiveJumps();
    
    // Atualiza o timer a cada segundo
    const timerInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Recarrega os jumps a cada 30 segundos para manter os dados atualizados
    const dataInterval = setInterval(() => {
        loadActiveJumps();
    }, 30000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const loadActiveJumps = async () => {
    try {
      // Pega o company_id do localStorage (se o usuário for admin)
      const selectedCompany = localStorage.getItem('selectedCompany');
      const companyId = selectedCompany ? parseInt(selectedCompany) : undefined;
      
      // Usa o endpoint específico para modo TV
      const response = await jumpUsageService.listTV(companyId);
      if (response.success) {
        setActiveJumps(response.data || []);
        setError(null);
      } else {
        throw new Error(response.error || 'Erro ao carregar jumps');
      }
    } catch (err: any) {
      console.error('Error loading active jumps for TV mode:', err);
      setError('Não foi possível conectar ao servidor. Tentando novamente...');
    } finally {
      setLoading(false);
    }
  };

  // Helper para retornar o nome correto (dependente ou cliente)
  const getDisplayName = (jump: JumpUsage): string => {
    return jump.dependente_name || jump.customer_name || 'Cliente não identificado';
  };
  
  const getStatus = (jump: JumpUsage, remainingTime: string) => {
    if (jump.is_paused) {
      return { bgColor: '#6c757d', label: 'Pausado', cardClassName: '' };
    }

    // Se o tempo esgotou (00:00:00)
    if (remainingTime === '00:00:00') {
      return { bgColor: '#c92127', label: 'Tempo esgotado', cardClassName: 'jump-card--expired' };
    }

    // Calcula a porcentagem de tempo restante para determinar o status
    const [hoursStr, minutesStr, secondsStr] = remainingTime.split(':');
    const remainingSeconds = parseInt(hoursStr) * 3600 + parseInt(minutesStr) * 60 + parseInt(secondsStr);
    
    // Calcula o tempo total contratado em segundos
    const totalSeconds = jump.contracted_hours * 3600;
    const percentageRemaining = (remainingSeconds / totalSeconds) * 100;

    // Se restam menos de 50% do tempo, mostra alerta
    if (percentageRemaining < 50) {
      return { bgColor: '#ff9500', label: 'Alerta', cardClassName: 'jump-card--warning' };
    }
    
    return { bgColor: '#00ff88', label: 'Em Andamento', cardClassName: 'jump-card--success' };
  };

  // Função para parse de duration ISO 8601
  const parseDuration = (duration: string): number => {
    let totalSeconds = 0;
    const hoursMatch = duration.match(/(\d+)H/);
    const minutesMatch = duration.match(/(\d+)M/);
    const secondsMatch = duration.match(/(\d+)S/);
    
    if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;
    if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;
    if (secondsMatch) totalSeconds += parseInt(secondsMatch[1]);
    
    return totalSeconds;
  };

  // Função para calcular o fim programado
  const calculateScheduledEndTime = (jump: JumpUsage): Date => {
    // Se há uma extensão de tempo após expiração, time_extension_at JÁ É o novo fim programado
    if (jump.time_extension_at) {
      return new Date(jump.time_extension_at);
    }
    
    // Caso contrário, calcula normalmente a partir do start_time
    const start = new Date(jump.start_time);
    const end = new Date(start.getTime() + jump.contracted_hours * 60 * 60 * 1000);
    return end;
  };

  // Nova função para calcular tempo restante (countdown)
  const calculateRemainingTime = (jump: JumpUsage): string => {
    const scheduledEnd = calculateScheduledEndTime(jump);
    let currentTimeForCalc = currentTime;
    
    // Se está pausado, usa o momento da pausa como "tempo atual"
    if (jump.is_paused && jump.paused_at) {
      currentTimeForCalc = new Date(jump.paused_at);
    }
    
    let diff: number;
    
    // Se há extensão de tempo (time_extension_at), usa uma lógica diferente
    if (jump.time_extension_at) {
      // time_extension_at já é o novo fim programado calculado pelo backend
      const extensionEnd = new Date(jump.time_extension_at);
      diff = extensionEnd.getTime() - currentTimeForCalc.getTime();
    } else {
      // Lógica normal: calcula baseado no tempo contratado
      const start = new Date(jump.start_time);
      const scheduledEnd = new Date(start.getTime() + jump.contracted_hours * 60 * 60 * 1000);
      diff = scheduledEnd.getTime() - currentTimeForCalc.getTime();
      
      // Adiciona o tempo pausado de volta (só para jumps sem extensão)
      if (jump.total_paused_time && jump.total_paused_time !== 'PT0S') {
        const pausedSeconds = parseDuration(jump.total_paused_time);
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
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  
  const sortedJumps = useMemo(() => {
    return [...activeJumps].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [activeJumps]);

  if (loading) {
    return <div className="tv-mode-loading">Carregando Jumps...</div>;
  }
  
  return (
    <div className="tv-mode-container">
      {error && (
        <div className="tv-mode-error">
          <FiWifiOff />
          <p>{error}</p>
        </div>
      )}
      <div className="jumps-grid">
        {sortedJumps.length === 0 && !error ? (
          <div className="empty-jumps-tv">
            <FiClock />
            <p>Nenhum jump em andamento</p>
          </div>
        ) : (
          sortedJumps.map((jump) => {
            // Calcula o fim programado - se há extensão, time_extension_at JÁ É o fim programado
            const scheduledEnd = calculateScheduledEndTime(jump);
            
            // Calcula o tempo restante (countdown)
            const remainingTime = calculateRemainingTime(jump);
            
            // Obtém o status do jump baseado no tempo restante
            const status = getStatus(jump, remainingTime);
            
            // Verifica se o tempo esgotou
            const isTimeExhausted = !jump.finished && !jump.is_paused && remainingTime === '00:00:00';

            return (
              <div key={jump.id} className={`jump-card ${status.cardClassName} ${jump.is_paused ? 'jump-card--paused' : ''}`}>
                {jump.is_paused && (
                  <div className="paused-overlay">
                    <FiPause /> PAUSADO
                  </div>
                )}
                <div className="card-status-bar" style={{ backgroundColor: status.bgColor }}></div>
                <div className="jump-card-content">
                  <div className="jump-card-header">
                    <h3 className="customer-name">{getDisplayName(jump)}</h3>
                  </div>
                  <div className="jump-card-body">
                    <div className="info-row"><FiPlay className="info-icon" /><span className="info-label">Início:</span><span className="info-value">{formatTime(new Date(jump.start_time))}</span></div>
                    <div className="info-row"><FiBarChart2 className="info-icon" /><span className="info-label">Fim Programado:</span><span className="info-value">{formatTime(scheduledEnd)}</span></div>
                    <div className="info-row"><FiCalendar className="info-icon" /><span className="info-label">Horas:</span><span className="info-value">{jump.contracted_hours}h</span></div>
                  </div>
                  <div className="jump-card-footer">
                    <div className="timer">
                      <FiClock size={20} className="timer-icon" />
                      <div className="timer-info">
                        <span className="timer-label">Tempo Restante</span>
                        <span className="timer-value">{isTimeExhausted ? 'TEMPO ESGOTADO' : remainingTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TVMode;
