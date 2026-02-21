import React from 'react';
import './Loader.css';

export interface LoaderProps {
  /** Tamanho do loader */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Variante visual */
  variant?: 'spinner' | 'dots' | 'pulse';
  /** Cor do loader (padrão: primary) */
  color?: 'primary' | 'secondary' | 'white' | 'dark';
  /** Texto opcional abaixo do loader */
  text?: string;
  /** Se deve ocupar tela cheia com overlay */
  fullScreen?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  text,
  fullScreen = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'loader-sm',
    md: 'loader-md',
    lg: 'loader-lg',
    xl: 'loader-xl',
  };

  const colorClasses = {
    primary: 'loader-primary',
    secondary: 'loader-secondary',
    white: 'loader-white',
    dark: 'loader-dark',
  };

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={`loader-dots ${sizeClasses[size]} ${colorClasses[color]}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        );
      case 'pulse':
        return (
          <div className={`loader-pulse ${sizeClasses[size]} ${colorClasses[color]}`}></div>
        );
      case 'spinner':
      default:
        return (
          <div className={`loader-spinner ${sizeClasses[size]} ${colorClasses[color]}`}>
            <svg viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="4"
              />
            </svg>
          </div>
        );
    }
  };

  if (fullScreen) {
    return (
      <div className={`loader-overlay ${className}`}>
        <div className="loader-container">
          {renderLoader()}
          {text && <p className="loader-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`loader-wrapper ${className}`}>
      {renderLoader()}
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;
