import React from "react";
import { Handle, Position } from "reactflow";
import { ChoiceNodeData } from "@/types";
import { useGameStore } from "@/modules/game/store";

interface ChoiceNodeProps {
  data: ChoiceNodeData;
  selected?: boolean;
}

export const ChoiceNode: React.FC<ChoiceNodeProps> = ({ data, selected }) => {
  const { label, effects, isAvailable, onClick } = data;
  const variables = useGameStore(state => state.variables);
  const canClick = isAvailable && onClick;
  
  const effectEntries = Object.entries(effects).filter(([_, value]) => value !== 0);
  const hasPositiveEffects = effectEntries.some(([_, value]) => value > 0);
  const hasNegativeEffects = effectEntries.some(([_, value]) => value < 0);
  
  return (
    <div className="relative">
      <div 
        className={`
          relative px-6 py-3 rounded-full shadow-lg transition-all duration-200 cursor-pointer
          ${canClick 
            ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100" 
            : isAvailable 
            ? "bg-zinc-900 text-zinc-400" 
            : "bg-black text-zinc-600 cursor-not-allowed"
          }
          ${selected ? "ring-2 ring-zinc-600 ring-offset-2 ring-offset-black" : ""}
        `}
        onClick={canClick ? onClick : undefined}
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm">{label}</span>
          
          {effectEntries.length > 0 && (
            <div className="flex items-center gap-1">
              {hasPositiveEffects && (
                <div className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}
              {hasNegativeEffects && (
                <div className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}
            </div>
          )}
          
          {canClick && (
            <svg className="w-4 h-4 opacity-40" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          )}
        </div>
        
        <Handle 
          type="target" 
          position={Position.Left} 
          className="w-2 h-2 border-2 bg-zinc-800 border-zinc-600"
          style={{ left: '-5px' }}
        />
        
        <Handle 
          type="source" 
          position={Position.Right} 
          className="w-2 h-2 border-2 bg-zinc-800 border-zinc-600"
          style={{ right: '-5px' }}
        />
      </div>
      
      {effectEntries.length > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-20 opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-10">
          <div className="bg-black border border-zinc-800 rounded-lg px-3 py-2 shadow-xl">
            <div className="text-xs space-y-1">
              {effectEntries.map(([varName, value]) => {
                const variable = variables.find(v => v.name === varName);
                if (!variable) return null;
                
                return (
                  <div key={varName} className="flex items-center gap-2">
                    <span className="text-zinc-500">{varName}:</span>
                    <span className={`font-mono font-medium ${
                      value > 0 ? "text-zinc-400" : "text-zinc-500"
                    }`}>
                      {value > 0 ? '+' : ''}{value}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-zinc-800" />
          </div>
        </div>
      )}
    </div>
  );
};