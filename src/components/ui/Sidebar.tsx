// src/components/ui/Sidebar.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarProps {
  position?: 'left' | 'right';
  width?: number;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  resizable?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  position = 'left',
  width = 320,
  title,
  children,
  footer,
  resizable = false
}) => {
  const [currentWidth, setCurrentWidth] = React.useState(width);
  const [isResizing, setIsResizing] = React.useState(false);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!resizable) return;
    e.preventDefault();
    setIsResizing(true);
  };
  
  React.useEffect(() => {
    if (!isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (position === 'left') {
        setCurrentWidth(Math.max(200, Math.min(600, e.clientX)));
      } else {
        setCurrentWidth(Math.max(200, Math.min(600, window.innerWidth - e.clientX)));
      }
    };
    
    const handleMouseUp = () => setIsResizing(false);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, position]);

  return (
    <div 
      className={`
        flex flex-col bg-zinc-900
        ${position === 'left' ? 'border-r' : 'border-l'}
        border-zinc-800
      `}
      style={{ width: `${currentWidth}px` }}
    >
      {/* Header */}
      {title && (
        <div className="h-8 bg-zinc-800 border-b border-zinc-700 px-3 flex items-center">
          <span className="text-xs text-zinc-400 uppercase tracking-wider">
            {title}
          </span>
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      
      {/* Footer */}
      {footer && (
        <div className="h-6 bg-zinc-950 border-t border-zinc-800 px-2 flex items-center">
          {footer}
        </div>
      )}
      
      {/* Resize Handle */}
      {resizable && (
        <div
          className={`
            absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-500 hover:bg-opacity-50
            ${position === 'left' ? '-right-0.5' : '-left-0.5'}
            ${isResizing ? 'bg-orange-500 bg-opacity-50' : ''}
          `}
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  );
};

// Sidebar Section Component
interface SidebarSectionProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  icon: Icon,
  children,
  collapsible = true,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  
  return (
    <div className="border-b border-zinc-800">
      <button
        onClick={() => collapsible && setIsOpen(!isOpen)}
        disabled={!collapsible}
        className={`
          w-full px-3 py-2 flex items-center justify-between
          ${collapsible ? 'hover:bg-zinc-800 transition-colors cursor-pointer' : 'cursor-default'}
        `}
      >
        <div className="flex items-center gap-2">
          {collapsible && (
            <svg 
              className={`w-2 h-2 text-zinc-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}
              fill="currentColor" 
              viewBox="0 0 8 8"
            >
              <path d="M2 0 L6 4 L2 8 Z" />
            </svg>
          )}
          {Icon && <Icon className="w-3 h-3 text-zinc-500" />}
          <span className="text-xs text-zinc-400">{title}</span>
        </div>
      </button>
      
      {isOpen && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  );
};