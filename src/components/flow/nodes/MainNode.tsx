import React from "react";
import { Handle, Position } from "reactflow";

interface MainNodeProps {
  data: {
    label: string;
    isUnlocked?: boolean;
    isCurrent?: boolean;
    durationSec?: number;
    remainingMs?: number;
  };
  selected: boolean;
}

export const MainNode: React.FC<MainNodeProps> = ({ data, selected }) => {
  const isUnlocked = data.isUnlocked ?? true;
  const isCurrent = data.isCurrent ?? false;
  
  return (
    <div
      className={`px-4 py-3 shadow-md rounded-md bg-white border-2 transition-all ${
        isCurrent
          ? "border-blue-500 shadow-lg ring-4 ring-blue-500/20"
          : selected
          ? "border-zinc-900"
          : isUnlocked
          ? "border-zinc-300"
          : "border-red-400 border-dashed bg-red-50"
      }`}
      style={{ width: 230 }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">{data.label}</div>
        {!isUnlocked && <span className="text-xs">🔒</span>}
      </div>
      {data.durationSec > 0 && (
        <div className="text-xs text-zinc-500 mt-1">
          {data.remainingMs !== undefined
            ? `${Math.ceil(data.remainingMs / 1000)}s`
            : `${data.durationSec}s`}
        </div>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};