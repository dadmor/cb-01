import React from "react";
import { Handle, Position } from "reactflow";
import { ChoiceNodeData } from "@/types";

interface ChoiceNodeProps {
  data: ChoiceNodeData;
  selected?: boolean;
}

export const ChoiceNode: React.FC<ChoiceNodeProps> = ({ data, selected }) => {
  const { label, isAvailable, onClick } = data;
  const canClick = isAvailable && onClick;
  
  return (
    <div 
      className={`
        px-4 py-2 rounded-full shadow-md transition-all cursor-pointer
        ${canClick 
          ? "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg" 
          : isAvailable 
          ? "bg-zinc-200 text-zinc-700" 
          : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
        }
        ${selected ? "ring-2 ring-zinc-700" : ""}
      `}
      onClick={canClick ? onClick : undefined}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-2 h-2 bg-transparent border-0" 
      />
      
      <span className="text-sm font-medium">{label}</span>
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-2 h-2 bg-transparent border-0" 
      />
    </div>
  );
};