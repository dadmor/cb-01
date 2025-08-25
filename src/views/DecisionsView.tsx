// src/views/DecisionsView.tsx
import React from 'react';
import { FlowCanvas } from '@/modules/flow/FlowCanvas';
import { Sidebar } from './decisions/Sidebar';

export const DecisionsView: React.FC = () => {
  return (
    <div className="h-full flex">
      {/* Main Canvas */}
      <div className="flex-1 flex flex-col bg-zinc-900">
        <div className="flex-1 relative">
          <FlowCanvas />
        </div>
      </div>

      {/* Right Panel - Inspector/Decisions */}
      <div className="w-96 bg-zinc-800 border-l border-zinc-900">
        <div className="h-8 bg-zinc-600/20 border-b border-zinc-900 flex items-center px-3">
          <span className="text-xs text-zinc-400 font-medium">INSPECTOR</span>
        </div>
        <Sidebar />
      </div>
    </div>
  );
};
