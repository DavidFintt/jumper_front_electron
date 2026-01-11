import { HTMLAttributes, ReactNode } from 'react';
import './Alert.css';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'error' | 'success' | 'warning' | 'info';
}

function Alert({
  children,
  variant = 'info',
  className = '',
  ...props
}: AlertProps) {
  return (
    <div
      className={`alert alert-${variant} ${className}`}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
}

export default Alert;











