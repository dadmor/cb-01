// src/components/ui/Panel.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-zinc-950 ${className}`}>
      {children}
    </div>
  );
};

// Panel Header
interface PanelHeaderProps {
  title?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  compact?: boolean;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  icon: Icon,
  actions,

}) => {
  return (
    <div className={`
      bg-zinc-600/50 border-b border-zinc-600/50 p-3 flex items-center justify-between
      
    `}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3 text-zinc-500" />}
        {title && (
          <span className="text-xs text-zinc-400 uppercase tracking-wider">
            {title}
          </span>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-1">
          {actions}
        </div>
      )}
    </div>
  );
};

// Panel Content
interface PanelContentProps {
  children: React.ReactNode;
  noPadding?: boolean;
  className?: string;
}

export const PanelContent: React.FC<PanelContentProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`
      ${className}
    `}>
      {children}
    </div>
  );
};

// Panel Footer  
interface PanelFooterProps {
  children: React.ReactNode;
}

export const PanelFooter: React.FC<PanelFooterProps> = ({ children }) => {
  return (
    <div className="h-6 bg-zinc-900 border-t border-zinc-800 px-2 flex items-center text-zinc-600">
      {children}
    </div>
  );
};

// Tabbed Panel
interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  content: React.ReactNode;
}

interface TabbedPanelProps {
  tabs: Tab[];
  defaultTab?: string;
}

export const TabbedPanel: React.FC<TabbedPanelProps> = ({ tabs, defaultTab }) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);
  const currentTab = tabs.find(t => t.id === activeTab);
  
  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="h-8 bg-zinc-800 border-b border-zinc-700 flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 flex items-center gap-2 text-xs transition-all
              ${activeTab === tab.id 
                ? 'bg-zinc-900 text-zinc-200 border-b-2 border-orange-500' 
                : 'text-zinc-500 hover:text-zinc-300 border-b-2 border-transparent'
              }
            `}
          >
            {tab.icon && React.createElement(tab.icon, { className: 'w-3 h-3' })}
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {currentTab?.content}
      </div>
    </div>
  );
};