// src/components/ui/Layout.tsx
import React from 'react';

interface FlexContainerProps {
  children: React.ReactNode;
  direction?: 'row' | 'col';
  flex?: boolean;
  fullHeight?: boolean;
  className?: string;
}

export const FlexContainer: React.FC<FlexContainerProps> = ({
  children,
  direction = 'row',
  flex = false,
  fullHeight = false,
  className = ''
}) => {
  return (
    <div className={`
      ${fullHeight ? 'h-full' : ''}
      ${direction === 'row' ? 'flex' : 'flex flex-col'}
      ${flex ? 'flex-1' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

interface CanvasContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const CanvasContainer: React.FC<CanvasContainerProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`flex-1 relative ${className}`}>
      {children}
    </div>
  );
};

interface VideoContainerProps {
  children: React.ReactNode;
  height?: string;
  className?: string;
}

export const VideoContainer: React.FC<VideoContainerProps> = ({
  children,
  height = 'h-[280px]',
  className = ''
}) => {
  return (
    <div className={`${height} border-b border-zinc-800 flex flex-col min-h-0 ${className}`}>
      {children}
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-8 ${className}`}>
      {icon && <div className="mb-4">{icon}</div>}
      <div className="text-zinc-600 italic text-xs">
        {title}
      </div>
      {description && <div className="text-zinc-600 text-xs mt-2">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

interface StatusTextProps {
  children: React.ReactNode;
  variant?: 'default' | 'muted' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const StatusText: React.FC<StatusTextProps> = ({
  children,
  variant = 'default',
  size = 'xs',
  className = ''
}) => {
  const variantClasses = {
    default: 'text-zinc-400',
    muted: 'text-zinc-600',
    success: 'text-green-400',
    warning: 'text-yellow-500',
    error: 'text-red-400'
  };

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base'
  };

  return (
    <span className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
};