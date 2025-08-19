// ------ src/components/flow/nodes/DecisionNode.tsx ------
import React from "react";
import { Handle, Position } from "reactflow";
import { useGameStore } from "@/gameStore";
import { DecisionNodeProps } from "@/types";

// Wysokość węzła decyzyjnego - taka sama jak punkt połączenia głównego węzła
const DECISION_HEIGHT = 32; // 16 * 2

export const DecisionNode: React.FC<DecisionNodeProps> = ({ data, selected }) => {
  const mode = useGameStore((s) => s.mode);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const canClick = mode === "play" && !isGameOver && data.isAvailable;

  return (
    <div
      className={`shadow-md rounded-full transition-all flex items-center justify-center ${
        canClick
          ? "bg-blue-500 text-white cursor-pointer hover:bg-blue-600 hover:shadow-lg"
          : data.isAvailable
          ? "bg-zinc-200 text-zinc-700"
          : "bg-zinc-100 text-zinc-400 border border-dashed border-zinc-300"
      } ${selected ? "ring-2 ring-zinc-900" : ""}`}
      style={{ 
        minWidth: 128, // 16 * 8
        height: DECISION_HEIGHT,
        paddingLeft: 16,
        paddingRight: 16
      }}
      onClick={canClick ? data.onClick : undefined}
    >
      {/* Handle dokładnie w połowie wysokości */}
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ 
          opacity: 0,
          top: DECISION_HEIGHT / 2,
          left: 0,
          transform: 'translateY(-50%)'
        }} 
      />
      
      <div className="text-xs font-medium text-center truncate">{data.label}</div>
      
      {/* Handle dokładnie w połowie wysokości */}
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          opacity: 0,
          top: DECISION_HEIGHT / 2,
          right: 0,
          transform: 'translateY(-50%)'
        }} 
      />
    </div>
  );
};