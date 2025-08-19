// ------ src/components/flow/nodes/MainNode.tsx ------
import React from "react";
import { Handle, Position } from "reactflow";
import { MainNodeProps } from "@/types";

// Wysokość węzła głównego - wielokrotność 16 (siatki)
// 16 * 6 = 96px dla tytułu, 3 linii opisu, timera i paddingów
const NODE_HEIGHT = 96;

export const MainNode: React.FC<MainNodeProps> = ({ data, selected }) => {
  const isUnlocked = data.isUnlocked ?? true;
  const isCurrent = data.isCurrent ?? false;

  return (
    <div
      className={`shadow-md rounded-md bg-white border-2 transition-all flex flex-col ${
        isCurrent
          ? "border-blue-500 shadow-lg ring-4 ring-blue-500/20"
          : selected
          ? "border-zinc-900"
          : isUnlocked
          ? "border-zinc-300"
          : "border-red-400 border-dashed bg-red-50"
      }`}
      style={{ 
        width: 256, // 16 * 16 = 256px - wielokrotność siatki
        height: NODE_HEIGHT,
        padding: 12 // pozostaw 4px marginesu do krawędzi (16-12=4)
      }}
    >
      {/* Handle umieszczony dokładnie w połowie wysokości */}
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ 
          top: NODE_HEIGHT / 2,
          left: 0,
          transform: 'translateY(-50%)'
        }} 
      />
      
      {/* Nagłówek z tytułem i ikoną */}
      <div className="flex items-center justify-between mb-1">
        <div className="font-medium text-sm truncate">{data.label}</div>
        {!isUnlocked && <span className="text-xs">🔒</span>}
      </div>
      
      {/* Miejsce na 3 linijki opisu */}
      <div className="flex-1 overflow-hidden">
        <div className="text-xs text-zinc-600 line-clamp-3">
          {data.description || "Tutaj będzie opis węzła. Może mieć maksymalnie 3 linie tekstu..."}
        </div>
      </div>
      
      {/* Timer na dole */}
      {data.durationSec > 0 && (
        <div className="text-xs text-zinc-500 mt-1">
          {data.remainingMs !== undefined
            ? `${Math.ceil(data.remainingMs / 1000)}s`
            : `${data.durationSec}s`}
        </div>
      )}
      
      {/* Handle umieszczony dokładnie w połowie wysokości */}
      <Handle 
        type="source" 
        position={Position.Right}
        style={{ 
          top: NODE_HEIGHT / 2,
          right: 0,
          transform: 'translateY(-50%)'
        }} 
      />
    </div>
  );
};