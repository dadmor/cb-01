// ------ src/components/ui/Button.tsx ------
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'xs' | 'sm';
  icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'sm',
  icon: Icon,
  children,
  className = '',
  ...props
}) => {
  const variantClasses = {
    default: 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700',
    primary: 'bg-orange-600 text-white hover:bg-orange-500',
    ghost: 'bg-transparent text-zinc-400 hover:bg-zinc-800'
  };
  
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-3 py-1 text-xs'
  };

  return (
    <button
      className={`
        transition-colors disabled:opacity-50
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      <span className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {children}
      </span>
    </button>
  );
};