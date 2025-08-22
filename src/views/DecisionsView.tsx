// src/views/DecisionsView.tsx
import React from 'react';
import { FlowCanvas } from '@/modules/flow/FlowCanvas';
import { Sidebar } from './decisions/Sidebar';


export const DecisionsView: React.FC = () => {
  return (
    <div className="h-full flex">
      {/* Main Canvas */}
      <div className="flex-1 flex flex-col bg-[#1a1a1a]">
        <div className="flex-1 relative">
          <FlowCanvas />
        </div>
      </div>

      {/* Right Panel - Inspector/Decisions */}
      <div className="w-[350px] bg-[#1e1e1e] border-l border-[#0a0a0a]">
        <div className="h-8 bg-[#252525] border-b border-[#0a0a0a] flex items-center px-3">
          <span className="text-xs text-[#999] font-medium">INSPECTOR</span>
        </div>
        <Sidebar />
      </div>
    </div>
  );
};