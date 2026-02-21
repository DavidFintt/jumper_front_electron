import React, { useState, useRef, useEffect } from 'react';
import { activationService } from '../../services/activationService';
import './ActivationScreen.css';

interface ActivationScreenProps {
  onActivationSuccess: () => void;
}

const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivationSuccess }) => {
  const [codeParts, setCodeParts] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const newParts = [...codeParts];
    newParts[index] = cleanValue;
    setCodeParts(newParts);
    setError(null);

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
      setError(null);
      setProgress('Validando codigo e sincronizando dados...');

      // O backend local cuida de tudo:
      // 1. Valida o codigo na nuvem
      // 2. Baixa os dados da empresa
      // 3. Salva no SQLite local
      const response = await activationService.activate(getFullCode());

      if (!response.success) {
        setError(response.error || 'Codigo invalido');
        setProgress(null);
        return;
      }

      // Mostra resumo dos dados salvos
      if (response.data) {
        const d = response.data;
        setProgress(`PDV ativado! Dados sincronizados: ${d.users} usuarios, ${d.products} produtos, ${d.customers} clientes`);
      } else {
        setProgress('PDV ativado com sucesso!');
      }
      
      setTimeout(() => {
        onActivationSuccess();
      }, 2000);

    } catch (err: any) {
      console.error('Erro na ativacao:', err);
      setError(err.message || 'Erro ao ativar PDV');
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="activation-screen">
      <div className="activation-container">
        <div className="activation-logo">
          <img src="./logo.png" alt="Jump" className="logo-image" />
        </div>

        <h1 className="activation-title">Ativacao do Terminal</h1>
        <p className="activation-subtitle">
          Digite o codigo de ativacao fornecido pelo administrador da empresa
        </p>

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
            placeholder="XXXX"
            maxLength={4}
            disabled={loading}
            autoComplete="off"
          />
          <span className="code-separator">-</span>
          <input
            ref={inputRefs[1]}
            type="text"
            className="code-input"
            value={codeParts[1]}
            onChange={(e) => handleCodeChange(1, e.target.value)}
            onKeyDown={(e) => handleKeyDown(1, e)}
            placeholder="XXXX"
            maxLength={4}
            disabled={loading}
            autoComplete="off"
          />
        </div>

        {error && (
          <div className="activation-error">
            {error}
          </div>
        )}

        {progress && (
          <div className="activation-progress">
            {progress}
          </div>
        )}

        <button
          className="activation-button"
          onClick={handleActivate}
          disabled={!isCodeComplete() || loading}
        >
          {loading ? 'Ativando...' : 'Ativar Terminal'}
        </button>

        <p className="activation-help">
          Nao tem um codigo? Entre em contato com o administrador da sua empresa.
        </p>
      </div>
    </div>
  );
};

export default ActivationScreen;
