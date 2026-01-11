import { InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label htmlFor={props.id} className="input-label">
          {label}
        </label>
      )}
      <input
        className={`input-field ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
}

export default Input;











