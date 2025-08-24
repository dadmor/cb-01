// src/views/ProjectsView.tsx
import React from 'react';
import { FolderOpen, Plus, Film } from 'lucide-react';

export const ProjectsView: React.FC = () => {
  return (
    <div className="h-full bg-[#1a1a1a] flex items-center justify-center">
      <div className="text-center">
        <FolderOpen className="w-24 h-24 mx-auto mb-6 text-[#444]" />
        <h1 className="text-2xl font-bold text-[#ccc] mb-2">Projects (MOCK YET)</h1>
        <p className="text-[#666] text-sm mb-8">
          TODO: Project management interface
        </p>
        
        <div className="space-y-4">
          <button className="flex items-center gap-3 px-6 py-3 bg-[#E84E36] text-white font-medium hover:bg-[#d63d2a] transition-colors mx-auto">
            <Plus className="w-5 h-5" />
            Create New Project
          </button>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-8">
            <div className="bg-[#252525] border border-[#2a2a2a] p-4 text-left hover:border-[#3a3a3a] transition-colors cursor-pointer">
              <Film className="w-8 h-8 text-[#666] mb-2" />
              <h3 className="text-sm font-medium text-[#ccc]">Recent Project 1</h3>
              <p className="text-xs text-[#666] mt-1">Last edited 2 hours ago</p>
            </div>
            
            <div className="bg-[#252525] border border-[#2a2a2a] p-4 text-left hover:border-[#3a3a3a] transition-colors cursor-pointer">
              <Film className="w-8 h-8 text-[#666] mb-2" />
              <h3 className="text-sm font-medium text-[#ccc]">Recent Project 2</h3>
              <p className="text-xs text-[#666] mt-1">Last edited yesterday</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};