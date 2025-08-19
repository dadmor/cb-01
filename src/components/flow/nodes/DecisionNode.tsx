import { useGameStore } from "@/gameStore";
import React from "react";
import { Handle, Position } from "reactflow";

interface DecisionNodeProps {
  data: {
    label: string;
    isAvailable?: boolean;
    onClick?: () => void; // akcja w trybie gry (nie dotyka selekcji)
  };
  selected: boolean; // dostarczane przez React Flow (internal)
}

export const DecisionNode: React.FC<DecisionNodeProps> = ({ data, selected }) => {
  const mode = useGameStore((s) => s.mode);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const canClick = mode === "play" && !isGameOver && data.isAvailable;

  return (
    <div
      className={`px-3 py-2 shadow-md rounded-full transition-all ${
        canClick
          ? "bg-blue-500 text-white cursor-pointer hover:bg-blue-600 hover:shadow-lg"
          : data.isAvailable
          ? "bg-zinc-200 text-zinc-700"
          : "bg-zinc-100 text-zinc-400 border border-dashed border-zinc-300"
      } ${selected ? "ring-2 ring-zinc-900" : ""}`}
      style={{ minWidth: 120 }}
      // klik działa tylko w trybie gry; nie używamy tego do selekcji
      onClick={canClick ? data.onClick : undefined}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="text-xs font-medium text-center">{data.label}</div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
};
