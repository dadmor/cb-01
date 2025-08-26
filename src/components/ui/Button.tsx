// src/components/ui/Button.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'toolbar';
  size?: 'sm' | 'md' | 'xs';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'sm',
  icon: Icon,
  iconPosition = 'left',
  active = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'transition-all outline-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    default: 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100',
    primary: 'bg-orange-600 text-white hover:bg-orange-500 border border-orange-500',
    ghost: 'bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
    toolbar: active 
      ? 'bg-zinc-700 text-zinc-200' 
      : 'bg-transparent text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
  };
  
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm'
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      <span className="flex items-center gap-1.5">
        {Icon && iconPosition === 'left' && <Icon className="w-3 h-3" />}
        {children}
        {Icon && iconPosition === 'right' && <Icon className="w-3 h-3" />}
      </span>
    </button>
  );
};