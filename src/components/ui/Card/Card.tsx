import { HTMLAttributes, ReactNode } from 'react';
import './Card.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

function Card({
  children,
  variant = 'default',
  padding = 'medium',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        card 
        card-${variant} 
        card-padding-${padding}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;











