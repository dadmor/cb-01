import { Panel } from "./Panel";

// ------ src/components/ui/Layout.tsx ------
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ children, className = '' }) => (
  <div className={`flex h-full ${className}`}>
    {children}
  </div>
);

export const Canvas: React.FC<ContainerProps> = ({ children, className = '' }) => (
  <div className={`flex-1 bg-zinc-950 ${className}`}>
    {children}
  </div>
);

export const Sidebar: React.FC<ContainerProps & { width?: string }> = ({ 
  children, 
  width = 'w-96',
  className = '' 
}) => (
  <Panel className={`${width} border-l border-zinc-800 ${className}`}>
    {children}
  </Panel>
);