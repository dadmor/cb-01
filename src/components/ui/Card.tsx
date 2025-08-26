// src/components/ui/Card.tsx
import React from 'react';
import { LucideIcon, X } from 'lucide-react';

interface CardProps {
  title?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onClose?: () => void;
  selected?: boolean;
  compact?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  icon: Icon,
  children,
  actions,
  onClose,
  selected = false,
  compact = false,
  className = ''
}) => {
  return (
    <div className={`
      bg-zinc-900 border transition-all
      ${selected ? 'border-orange-500' : 'border-zinc-800'}
      ${className}
    `}>
      {/* Header */}
      {(title || actions || onClose) && (
        <div className={`
          bg-zinc-800 border-b border-zinc-700 flex items-center justify-between
          ${compact ? 'h-6 px-2' : 'h-8 px-3'}
        `}>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-3 h-3 text-zinc-500" />}
            {title && (
              <span className="text-xs text-zinc-400 uppercase tracking-wider">
                {title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {actions}
            {onClose && (
              <button
                onClick={onClose}
                className="p-0.5 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className={compact ? 'p-2' : 'p-3'}>
        {children}
      </div>
    </div>
  );
};

// Collapsible Card variant
interface CollapsibleCardProps extends Omit<CardProps, 'onClose'> {
  defaultOpen?: boolean;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title = '',
  icon,
  children,
  actions,
  defaultOpen = true,
  compact = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  
  return (
    <div className={`bg-zinc-900 border border-zinc-800 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full bg-zinc-800 border-b border-zinc-700 flex items-center justify-between
          hover:bg-zinc-700 transition-colors
          ${compact ? 'h-6 px-2' : 'h-8 px-3'}
        `}
      >
        <div className="flex items-center gap-2">
          <svg 
            className={`w-2 h-2 text-zinc-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            fill="currentColor" 
            viewBox="0 0 8 8"
          >
            <path d="M2 0 L6 4 L2 8 Z" />
          </svg>
          {icon && React.createElement(icon, { className: 'w-3 h-3 text-zinc-500' })}
          <span className="text-xs text-zinc-400 uppercase tracking-wider">
            {title}
          </span>
        </div>
        {actions && <div onClick={e => e.stopPropagation()}>{actions}</div>}
      </button>
      
      {isOpen && (
        <div className={compact ? 'p-2' : 'p-3'}>
          {children}
        </div>
      )}
    </div>
  );
};