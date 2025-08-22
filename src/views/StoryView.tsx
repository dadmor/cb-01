// src/views/StoryView.tsx
import React from 'react';
import { FlowCanvas } from '@/modules/flow/FlowCanvas';
import { GitBranch, Info } from 'lucide-react';

export const StoryView: React.FC = () => {
  return (
    <div className="h-full flex">
      {/* Main Canvas */}
      <div className="flex-1 flex flex-col bg-[#1a1a1a]">
        <div className="flex-1 relative">
          <FlowCanvas />
        </div>
      </div>

      {/* Right Panel - Empty for now */}
      <div className="w-[350px] bg-[#1e1e1e] border-l border-[#0a0a0a]">
        <div className="h-8 bg-[#252525] border-b border-[#0a0a0a] flex items-center px-3">
          <span className="text-xs text-[#999] font-medium">STORY OVERVIEW</span>
        </div>
        
        <div className="p-6 text-center">
          <GitBranch className="w-12 h-12 mx-auto mb-4 text-[#666]" />
          <p className="text-[#666] text-sm mb-4">
            Story flow visualization
          </p>
          
          <div className="bg-[#252525] border border-[#2a2a2a] p-4 text-left">
            <div className="flex items-start gap-2 mb-3">
              <Info className="w-4 h-4 text-[#999] mt-0.5" />
              <div>
                <p className="text-xs text-[#999] leading-relaxed">
                  This view shows your complete story structure. Add scenes and choices to build branching narratives.
                </p>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-zinc-800 border border-zinc-700"></div>
                <span className="text-xs text-[#999]">Scene nodes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-zinc-700 border border-zinc-600"></div>
                <span className="text-xs text-[#999]">Choice nodes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-orange-500"></div>
                <span className="text-xs text-[#999]">Conditional paths</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};