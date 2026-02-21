import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../components/layout';
import { Card, Button, Alert } from '../../../components/ui';
import { activationService } from '../../../services';
import './ActivatePdv.css';

function ActivatePdv() {
  const navigate = useNavigate();
  const [codeParts, setCodeParts] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [isAlreadyActivated, setIsAlreadyActivated] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    checkActivationStatus();
  }, []);

  const checkActivationStatus = async () => {
    try {
      const bootstrapped = await activationService.isBootstrapped();
      setIsAlreadyActivated(bootstrapped);
    } catch (err) {
      console.error('Erro ao verificar status:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const newParts = [...codeParts];
    newParts[index] = cleanValue;
    setCodeParts(newParts);
    setError('');

    if (cleanValue.length === 4 && index < 1) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && codeParts[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'Enter') {
      handleActivate();
    }
  };

  const getFullCode = () => {
    return `JUMP-${codeParts[0]}-${codeParts[1]}`;
  };

  const isCodeComplete = () => {
    return codeParts.every(part => part.length === 4);
  };

  const handleActivate = async () => {
    if (!isCodeComplete()) {
      setError('Digite o codigo completo');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setProgress('Validando codigo e sincronizando dados...');

      // O backend local cuida de tudo:
      // 1. Valida o codigo na nuvem
      // 2. Baixa os dados da empresa
      // 3. Salva no SQLite local
      const response = await activationService.activate(getFullCode());

      if (!response.success) {
        setError(response.error || 'Codigo invalido');
        setProgress('');
        return;
      }

      // Mostra resumo dos dados salvos
      if (response.data) {
        const d = response.data;
        setProgress(`PDV ativado! ${d.users} usuarios, ${d.products} produtos, ${d.customers} clientes`);
      } else {
        setProgress('PDV ativado com sucesso!');
      }
      
      setTimeout(() => {
        navigate('/dashboard');
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      console.error('Erro na ativacao:', err);
      setError(err.message || 'Erro ao ativar PDV');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const handleClearActivation = async () => {
    if (window.confirm('Tem certeza que deseja limpar a ativacao? Todos os dados locais serao removidos.')) {
      try {
        await activationService.clearBootstrap();
        setIsAlreadyActivated(false);
        setCodeParts(['', '']);
        window.location.reload();
      } catch (err) {
        console.error('Erro ao limpar ativacao:', err);
        setError('Erro ao limpar ativacao');
      }
    }
  };

  if (checking) {
    return (
      <Layout>
        <div className="activate-pdv-loading">Verificando status...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="activate-pdv-container">
        <div className="activate-pdv-header">
          <h1>Ativar PDV</h1>
          <p className="activate-pdv-subtitle">
            Vincule este PDV a uma empresa usando um codigo de ativacao
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {progress && <Alert variant="info">{progress}</Alert>}

        {isAlreadyActivated ? (
          <Card className="activate-pdv-status">
            <div className="status-content">
              <div className="status-icon status-active">&#10003;</div>
              <h2>PDV Ativado</h2>
              <p>Este PDV ja esta vinculado a uma empresa.</p>
              <p className="status-warning">
                Para vincular a outra empresa, e necessario limpar a ativacao atual.
                Isso removera todos os dados locais.
              </p>
              <div className="status-actions">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  Voltar ao Dashboard
                </Button>
                <Button
                  variant="danger"
                  onClick={handleClearActivation}
                >
                  Limpar Ativacao
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="activate-pdv-form">
            <div className="form-content">
              <h2>Digite o Codigo de Ativacao</h2>
              <p>Solicite o codigo ao administrador da empresa</p>

              <div className="code-input-container">
                <span className="code-prefix">JUMP</span>
                <span className="code-separator">-</span>
                <input
                  ref={inputRefs[0]}
                  type="text"
                  className="code-input"
                  value={codeParts[0]}
                  onChange={(e) => handleCodeChange(0, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(0, e)}
                  maxLength={4}
                  placeholder="XXXX"
                  disabled={loading}
                  autoFocus
                />
                <span className="code-separator">-</span>
                <input
                  ref={inputRefs[1]}
                  type="text"
                  className="code-input"
                  value={codeParts[1]}
                  onChange={(e) => handleCodeChange(1, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(1, e)}
                  maxLength={4}
                  placeholder="XXXX"
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleActivate}
                  disabled={loading || !isCodeComplete()}
                >
                  {loading ? 'Ativando...' : 'Ativar PDV'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="activate-pdv-info">
          <h3>Como obter o codigo?</h3>
          <ol>
            <li>O administrador acessa o painel web (jump_web)</li>
            <li>Menu: Configuracoes &gt; Ativacao de PDV</li>
            <li>Clica em "Gerar Novo Codigo"</li>
            <li>Envia o codigo para voce (WhatsApp, email, etc)</li>
          </ol>
          <p className="info-note">
            O codigo expira em 24 horas e so pode ser usado uma vez.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default ActivatePdv;
