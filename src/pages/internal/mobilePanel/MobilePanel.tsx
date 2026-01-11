/// <reference types="../../../global" />
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiUser, FiAlertCircle, FiCheckCircle, FiPause, FiActivity } from 'react-icons/fi';
import { jumpUsageService } from '../../../services';
import type { JumpUsage } from '../../../services/types';
import './MobilePanel.css';

const MobilePanel: React.FC = () => {
  const navigate = useNavigate();
  const [activeJumps, setActiveJumps] = useState<JumpUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [companyId, setCompanyId] = useState<number | null>(null);

  useEffect(() => {
    // Verificar autenticação e empresa
    const token = localStorage.getItem('accessToken');
    const selectedCompany = localStorage.getItem('selectedCompany');
    
    if (!token) {
      navigate('/login');
      return;
    }

    if (selectedCompany) {
      setCompanyId(parseInt(selectedCompany));
    }

    // Atualizar o relógio a cada segundo
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    if (companyId) {
      loadActiveJumps();
      
      // Recarregar jumps a cada 10 segundos
      const interval = setInterval(() => {
        loadActiveJumps();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [companyId]);

  const loadActiveJumps = async () => {
    try {
      if (!companyId) return;
      
      const response = await jumpUsageService.getActive(companyId);
      if (response.data) {
        setActiveJumps(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar jumps:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (jump: JumpUsage): string => {
    if (jump.dependente_name) {
      return jump.dependente_name;
    }
    if (jump.customer_name) {
      return jump.customer_name;
    }
    return 'Cliente';
  };

  const calculateScheduledEndTime = (startTime: string, contractedHours: number, timeExtensionAt: string | null = null): Date => {
    if (timeExtensionAt) {
      return new Date(timeExtensionAt);
    }
    
    const start = new Date(startTime);
    const end = new Date(start.getTime() + contractedHours * 60 * 60 * 1000);
    return end;
  };

  const calculateElapsedTime = (startTime: string, isPaused: boolean = false, pausedAt: string | null = null, totalPausedTime: string = 'PT0S'): string => {
    const start = new Date(startTime);
    let endTime = currentTime;
    
    if (isPaused && pausedAt) {
      endTime = new Date(pausedAt);
    }
    
    let elapsed = endTime.getTime() - start.getTime();
    
    // Subtrair tempo pausado
    const pausedMs = parseDuration(totalPausedTime);
    elapsed -= pausedMs;
    
    if (elapsed < 0) elapsed = 0;
    
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateRemainingTime = (startTime: string, contractedHours: number, isPaused: boolean = false, pausedAt: string | null = null, totalPausedTime: string = 'PT0S', timeExtensionAt: string | null = null): string => {
    const scheduledEnd = calculateScheduledEndTime(startTime, contractedHours, timeExtensionAt);
    const start = new Date(startTime);
    let now = currentTime;
    
    if (isPaused && pausedAt) {
      now = new Date(pausedAt);
    }
    
    const totalDuration = scheduledEnd.getTime() - start.getTime();
    let elapsed = now.getTime() - start.getTime();
    
    const pausedMs = parseDuration(totalPausedTime);
    elapsed -= pausedMs;
    
    let remaining = totalDuration - elapsed;
    
    if (remaining < 0) {
      const abs = Math.abs(remaining);
      const hours = Math.floor(abs / (1000 * 60 * 60));
      const minutes = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((abs % (1000 * 60)) / 1000);
      return `-${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const parseDuration = (duration: string): number => {
    if (!duration || duration === 'PT0S') return 0;
    
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/;
    const matches = duration.match(regex);
    
    if (!matches) return 0;
    
    const hours = parseInt(matches[1] || '0');
    const minutes = parseInt(matches[2] || '0');
    const seconds = parseFloat(matches[3] || '0');
    
    return (hours * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000);
  };

  const getJumpStatus = (jump: JumpUsage): 'expired' | 'warning' | 'active' | 'paused' => {
    if (jump.is_paused) return 'paused';
    
    const scheduledEnd = calculateScheduledEndTime(jump.start_time, jump.contracted_hours, jump.time_extension_at);
    const start = new Date(jump.start_time);
    const totalDuration = scheduledEnd.getTime() - start.getTime();
    let elapsed = currentTime.getTime() - start.getTime();
    
    const pausedMs = parseDuration(jump.total_paused_time || 'PT0S');
    elapsed -= pausedMs;
    
    const percentageElapsed = (elapsed / totalDuration) * 100;
    
    if (percentageElapsed >= 100) return 'expired';
    if (percentageElapsed >= 50) return 'warning';
    return 'active';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'expired': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'paused': return '#6b7280';
      case 'active': return '#10b981';
      default: return '#10b981';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'expired': return <FiAlertCircle />;
      case 'warning': return <FiClock />;
      case 'paused': return <FiPause />;
      case 'active': return <FiCheckCircle />;
      default: return <FiActivity />;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'expired': return 'ESGOTADO';
      case 'warning': return 'ATENÇÃO';
      case 'paused': return 'PAUSADO';
      case 'active': return 'ATIVO';
      default: return 'ATIVO';
    }
  };

  if (loading) {
    return (
      <div className="mobile-panel">
        <div className="mobile-loading">
          <div className="spinner"></div>
          <p>Carregando jumps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-panel">
      <div className="mobile-header">
        <h1>Jumps em Uso</h1>
        <div className="mobile-stats">
          <div className="stat-item">
            <FiActivity />
            <span>{activeJumps.length} jumps</span>
          </div>
        </div>
      </div>

      {activeJumps.length === 0 ? (
        <div className="mobile-empty">
          <FiActivity size={64} />
          <h2>Nenhum jump em uso</h2>
          <p>Quando houver jumps ativos, eles aparecerão aqui.</p>
        </div>
      ) : (
        <div className="mobile-jumps-grid">
          {activeJumps.map((jump) => {
            const status = getJumpStatus(jump);
            const statusColor = getStatusColor(status);
            const statusLabel = getStatusLabel(status);
            const elapsedTime = calculateElapsedTime(jump.start_time, jump.is_paused, jump.paused_at, jump.total_paused_time);
            const remainingTime = calculateRemainingTime(jump.start_time, jump.contracted_hours, jump.is_paused, jump.paused_at, jump.total_paused_time, jump.time_extension_at);

            return (
              <div key={jump.id} className="mobile-jump-card">
                <div className="mobile-card-header">
                  <div className="mobile-customer-info">
                    <FiUser />
                    <span className="mobile-customer-name">{getDisplayName(jump)}</span>
                    {jump.is_pcd && <span className="mobile-pcd-badge">PCD</span>}
                  </div>
                  <div className="mobile-status-badge" style={{ backgroundColor: statusColor }}>
                    {getStatusIcon(status)}
                    <span>{statusLabel}</span>
                  </div>
                </div>

                <div className="mobile-card-body">
                  <div className="mobile-time-info">
                    <div className="mobile-time-block">
                      <span className="mobile-time-label">Tempo Decorrido</span>
                      <span className="mobile-time-value">{elapsedTime}</span>
                    </div>
                    <div className="mobile-time-block">
                      <span className="mobile-time-label">
                        {remainingTime.startsWith('-') ? 'Tempo Excedido' : 'Tempo Restante'}
                      </span>
                      <span className={`mobile-time-value ${remainingTime.startsWith('-') ? 'negative' : ''}`}>
                        {remainingTime}
                      </span>
                    </div>
                  </div>

                  <div className="mobile-jump-details">
                    <div className="mobile-detail-item">
                      <span className="mobile-detail-label">Início:</span>
                      <span className="mobile-detail-value">
                        {new Date(jump.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="mobile-detail-item">
                      <span className="mobile-detail-label">Término previsto:</span>
                      <span className="mobile-detail-value">
                        {calculateScheduledEndTime(jump.start_time, jump.contracted_hours, jump.time_extension_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {jump.operator_name && (
                      <div className="mobile-detail-item">
                        <span className="mobile-detail-label">Operador:</span>
                        <span className="mobile-detail-value">{jump.operator_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MobilePanel;





