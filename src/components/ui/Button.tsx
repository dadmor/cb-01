// ------ src/components/ui/Button.tsx ------
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'tool';
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
    default: 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700',
    primary: 'bg-red-600 text-white hover:bg-red-500 border border-red-700',
    ghost: 'bg-transparent text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200',
    tool: 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
  };
  
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-2 text-xs'
  };

  return (
    <button
      className={`
        transition-all duration-150 disabled:opacity-30
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