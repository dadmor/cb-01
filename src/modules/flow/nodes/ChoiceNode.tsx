import React, { useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ChoiceNodeData } from "@/types";
import { useGameMode } from "@/modules/game";
import { useVariables, VariablesManager } from "@/modules/variables";
import { useFlowStore } from "@/modules/flow/store";
import { cn } from "@/lib/utils";
import { isSceneNode } from "@/types";

interface ChoiceNodeProps {
  data: ChoiceNodeData;
  selected?: boolean;
}

export const ChoiceNode: React.FC<ChoiceNodeProps> = ({ data, selected }) => {
  const { label, effects, isAvailable, onClick } = data;
  const { variables } = useVariables();
  const mode = useGameMode();
  const edges = useFlowStore(state => state.edges);
  const nodes = useFlowStore(state => state.nodes);
  
  const canClick = isAvailable && onClick;
  
  const leadsToLockedNode = useMemo(() => {
    if (mode !== "play") return false;
    
    const outgoingEdge = edges.find(e => e.source === data.id);
    if (!outgoingEdge) return false;
    
    const targetNode = nodes.find(n => n.id === outgoingEdge.target);
    if (!targetNode || !isSceneNode(targetNode)) return false;
    
    return !VariablesManager.evaluate(variables, targetNode.data.condition);
  }, [mode, edges, nodes, data.id, variables]);
  
  const effectEntries = Object.entries(effects).filter(([_, value]) => value !== 0);
  const hasEffects = effectEntries.length > 0;
  
  return (
    <div className="relative group">
      <div 
        className={cn(
          "relative px-5 py-2.5 border-2 text-xs font-medium transition-all duration-150 ease-in-out",
          "inline-flex items-center gap-2 h-12",
          canClick && !leadsToLockedNode && "bg-zinc-700 border-zinc-600 text-zinc-200 cursor-pointer hover:bg-zinc-600 hover:border-red-500",
          canClick && leadsToLockedNode && "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed opacity-75",
          isAvailable && !canClick && "bg-zinc-800 text-zinc-500 cursor-default",
          !isAvailable && "bg-zinc-900 border-zinc-700 text-zinc-600 cursor-not-allowed",
          selected && "border-red-500"
        )}
        onMouseUp={canClick && !leadsToLockedNode ? onClick : undefined}
      >
        <span>{label}</span>
        
        {leadsToLockedNode && (
          <svg className="w-3 h-3 fill-zinc-500" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
        )}
        
        {hasEffects && (
          <div className="flex items-center gap-1 ml-1">
            {effectEntries.map(([varName, value]) => (
              <div
                key={varName}
                className={cn(
                  "w-4 h-4 bg-zinc-800 border border-zinc-700",
                  "flex items-center justify-center text-[9px] font-bold",
                  value > 0 ? "text-green-400" : "text-red-400"
                )}
                title={`${varName}: ${value > 0 ? '+' : ''}${value}`}
              >
                {value > 0 ? '↑' : '↓'}
              </div>
            ))}
          </div>
        )}
        
        {canClick && !leadsToLockedNode && (
          <svg 
            className="w-2.5 h-2.5 fill-current opacity-40"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        )}
        
        <Handle 
          type="target" 
          position={Position.Left}
          className="!w-2 !h-4 !bg-zinc-700 !border !border-zinc-600 !rounded-none !left-[-5px]" 
        />
        
        <Handle 
          type="source" 
          position={Position.Right}
          className="!w-2 !h-4 !bg-zinc-700 !border !border-zinc-600 !rounded-none !right-[-5px]" 
        />
      </div>
      
      {/* Effects tooltip on hover */}
      {hasEffects && !leadsToLockedNode && (
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 -bottom-[60px] z-10",
          "opacity-0 pointer-events-none transition-opacity duration-200",
          "group-hover:opacity-100"
        )}>
          <div className="bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-[10px] whitespace-nowrap">
            <div className="flex flex-col gap-0.5">
              {effectEntries.map(([varName, value]) => {
                const variable = variables.find(v => v.name === varName);
                if (!variable) return null;
                
                return (
                  <div key={varName} className="flex items-center gap-2">
                    <span className="text-zinc-500">{varName}:</span>
                    <span className={cn(
                      "font-mono font-medium",
                      value > 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {value > 0 ? '+' : ''}{value}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-zinc-700" />
          </div>
        </div>
      )}
      
      {/* Locked path tooltip */}
      {leadsToLockedNode && (
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 -bottom-[40px] z-10",
          "opacity-0 pointer-events-none transition-opacity duration-200",
          "group-hover:opacity-100"
        )}>
          <div className="bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-[10px] whitespace-nowrap">
            <span className="text-zinc-400">This path is locked</span>
            <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-zinc-700" />
          </div>
        </div>
      )}
    </div>
  );
};