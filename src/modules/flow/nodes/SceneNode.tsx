// src/modules/flow/nodes/SceneNode.tsx
import React from "react";
import { Handle, Position } from "@xyflow/react";
import { SceneNodeData } from "../types";
import { cn } from "@/lib/utils";

interface SceneNodeProps {
  data: SceneNodeData;
  selected?: boolean;
}

export const SceneNode: React.FC<SceneNodeProps> = ({ data, selected }) => {
  const { label, description, durationSec } = data;

  return (
    <div
      className={cn(
        "relative w-60 h-60 transition-all duration-150 ease-in-out",
        "border-2 bg-zinc-800",
        selected ? "border-red-500" : "border-zinc-700"
      )}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-200">
            {label}
          </h3>
        </div>

        {/* Description */}
        <div className="flex-1 mb-3">
          {description && (
            <p className="text-xs leading-relaxed text-zinc-500 overflow-hidden text-ellipsis line-clamp-6">
              {description}
            </p>
          )}
        </div>

        {/* Duration bar */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-500">Duration</span>
            <span className="text-xs text-zinc-300 font-mono">{durationSec}s</span>
          </div>

          <div className="h-1 bg-zinc-900 relative overflow-hidden rounded-sm" />
        </div>
      </div>

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
  );
};