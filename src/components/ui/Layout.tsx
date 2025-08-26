// ------ src/components/ui/Layout.tsx ------
import React from "react";
import { Panel } from "./Panel";

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

interface LayoutSidebarProps extends ContainerProps {
  width?: string;
}

// Uwaga: Zmieniono nazwę z `Sidebar` na `LayoutSidebar`,
// aby nie kolidowała z komponentem o tej samej nazwie w `./Sidebar.tsx`.
export const LayoutSidebar: React.FC<LayoutSidebarProps> = ({ 
  children, 
  width = 'w-96',
  className = '' 
}) => (
  <Panel className={`${width} border-l border-zinc-800 ${className}`}>
    {children}
  </Panel>
);
