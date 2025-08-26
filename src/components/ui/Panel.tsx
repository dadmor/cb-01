// ------ src/components/ui/Panel.tsx ------
interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({ children, className = '' }) => (
  <div className={`bg-zinc-950 flex flex-col ${className}`}>
    {children}
  </div>
);

interface PanelHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({ title, actions }) => (
  <div className="h-8 bg-zinc-800 border-b border-zinc-700 px-3 flex items-center justify-between">
    <span className="text-xs text-zinc-400 uppercase tracking-wider">{title}</span>
    {actions && <div className="flex items-center gap-1">{actions}</div>}
  </div>
);

interface PanelContentProps {
  children: React.ReactNode;
  className?: string;
}

export const PanelContent: React.FC<PanelContentProps> = ({ children, className = '' }) => (
  <div className={`flex-1 overflow-y-auto p-2 ${className}`}>
    {children}
  </div>
);

export const PanelFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-6 bg-zinc-900 border-t border-zinc-800 px-3 flex items-center text-zinc-600 text-xs">
    {children}
  </div>
);
