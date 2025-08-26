// ===== src/views/layout/Header.tsx =====
import React from 'react';

import { Plus, Home, Settings } from 'lucide-react';
import { Logo } from './Logo';

interface HeaderProps {
  projectTitle: string;
  setProjectTitle: (title: string) => void;
  mode: 'edit' | 'play';
  lastAutoSave: Date | null;
  onNewProject: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectTitle,
  setProjectTitle,
  mode,
  lastAutoSave,
  onNewProject
}) => {
  return (
    <header className="flex-shrink-0 h-10 bg-gradient-to-b from-[#2a2a2a] to-[#242424] border-b border-[#0a0a0a]">
      <div className="h-full flex items-center">
        {/* Logo */}
        <div className="px-3 h-full flex items-center border-r border-[#0a0a0a]">
          <Logo />
        </div>

        {/* File Menu Bar */}
        <div className="flex items-center h-full">
          {['File', 'Edit', 'Timeline', 'Workspace', 'Help'].map((menu) => (
            <button
              key={menu}
              className="px-4 h-full hover:bg-white/5 text-sm text-[#999]"
            >
              {menu}
            </button>
          ))}
        </div>

        {/* Project Title */}
        <div className="flex-1 flex items-center justify-center">
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            disabled={mode === "play"}
            className="bg-transparent text-center font-medium text-[#ccc] text-[13px] outline-none border-none"
          />
          {lastAutoSave && (
            <span className="ml-2 text-[10px] text-[#666]">
              (auto-zapis: {lastAutoSave.toLocaleTimeString()})
            </span>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 px-3">
          <button 
            onClick={onNewProject}
            className="p-1.5 hover:bg-white/5 rounded" 
            title="Nowy projekt"
          >
            <Plus className="w-4 h-4 text-[#999]" />
          </button>
          <button className="p-1.5 hover:bg-white/5 rounded">
            <Home className="w-4 h-4 text-[#999]" />
          </button>
          <button className="p-1.5 hover:bg-white/5 rounded">
            <Settings className="w-4 h-4 text-[#999]" />
          </button>
        </div>
      </div>
    </header>
  );
};