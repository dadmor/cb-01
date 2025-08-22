// ===== src/views/layout/TabNavigation.tsx =====
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

export interface Tab {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

interface TabNavigationProps {
  tabs: Tab[];
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ tabs }) => {
  const location = useLocation();
  const currentTab = tabs.find(tab => tab.path === location.pathname) || tabs[0];

  return (
    <div className="flex h-full">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          to={tab.path}
          className={`h-full px-8 flex items-center gap-3 transition-all border-r border-[#0a0a0a] ${
            currentTab.id === tab.id 
              ? 'bg-[#1a1a1a] text-[#E84E36] border-b-2 border-b-[#E84E36]' 
              : 'bg-transparent text-[#666] border-b-2 border-b-transparent'
          }`}
        >
          <tab.icon className="w-5 h-5" />
          <span className="font-medium text-sm">{tab.label}</span>
        </Link>
      ))}
    </div>
  );
};