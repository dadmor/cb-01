// ------ src/components/flow/nodes/DecisionNode.tsx ------
import React from "react";
import { Handle, Position } from "reactflow";
import { useGameStore } from "@/gameStore";
import { DecisionNodeProps } from "@/types";

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
      // Click only works in play mode; we don't use this for selection
      onClick={canClick ? data.onClick : undefined}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="text-xs font-medium text-center">{data.label}</div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
};