import React from "react";
import { Handle, Position } from "@xyflow/react";
import { SceneNodeData } from "@/types";
import { useGameMode } from "@/modules/game";
import { cn } from "@/lib/utils";
import { Lock, Clock } from "lucide-react";

interface SceneNodeProps {
  data: SceneNodeData;
  selected?: boolean;
}

export const SceneNode: React.FC<SceneNodeProps> = ({ data, selected }) => {
  const {
    label,
    description,
    isUnlocked = true,
    isCurrent,
    remainingMs,
    durationSec,
    condition,
    hasCondition,
  } = data;

  const mode = useGameMode();

  const progress =
    remainingMs !== undefined && durationSec > 0
      ? ((durationSec * 1000 - remainingMs) / (durationSec * 1000)) * 100
      : 0;

  const showConditionIndicator = mode === "edit" && (hasCondition || condition);
  const showLockedOverlay = mode === "play" && !isUnlocked;

  return (
    <div
      className={cn(
        "relative w-60 h-60 transition-all duration-150 ease-in-out",
        "border-2",
        isCurrent ? "bg-zinc-700 border-red-500" : "bg-zinc-800",
        selected && !isCurrent && "border-red-500",
        !selected && !isCurrent && "border-zinc-700",
        (showConditionIndicator || showLockedOverlay) && "opacity-90"
      )}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3
              className={cn(
                "text-sm font-semibold m-0 flex items-center gap-1.5",
                isCurrent ? "text-white" : "text-zinc-200"
              )}
            >
              {label}
              {showConditionIndicator && (
                <Lock className="w-3.5 h-3.5 text-orange-500" strokeWidth={2.5} />
              )}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {isCurrent && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}

            {remainingMs !== undefined && remainingMs > 0 && (
              <span className="text-xs bg-zinc-900 px-2 py-1 text-red-500 font-mono">
                {Math.ceil(remainingMs / 1000)}s
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="flex-1 mb-3">
          {description && (
            <p className="text-xs leading-relaxed text-zinc-500 m-0 overflow-hidden text-ellipsis line-clamp-6">
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

          <div className="h-1 bg-zinc-900 relative overflow-hidden rounded-sm">
            {isCurrent && (
              <div
                className="h-full bg-red-500 transition-[width] duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            )}
          </div>
        </div>

        {/* Condition info in edit mode */}
        {mode === "edit" && condition && (
          <div className="mt-3 bg-zinc-900/50 border border-orange-600/30 px-2.5 py-1.5 rounded">
            <p className="text-xs text-orange-500 font-medium">
              Condition: {condition.varName}{" "}
              {condition.op === "eq"
                ? "="
                : condition.op === "gt"
                ? ">"
                : condition.op === "gte"
                ? "≥"
                : condition.op === "lt"
                ? "<"
                : condition.op === "lte"
                ? "≤"
                : condition.op === "neq"
                ? "≠"
                : ""}{" "}
              {condition.value}
            </p>
          </div>
        )}
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

      {/* Locked overlay in play mode */}
      {showLockedOverlay && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-3">
          <div className="bg-zinc-800 border border-zinc-700 px-3 py-1.5 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-zinc-500" strokeWidth={2.5} />
            <span className="text-[11px] text-zinc-500 font-medium">Locked</span>
          </div>

          {data.condition && (
            <div className="bg-zinc-900/90 border border-zinc-700 px-2 py-1 max-w-[90%]">
              <p className="text-[10px] text-zinc-400 text-center">
                Requires: {data.condition.varName}{" "}
                {data.condition.op === "eq"
                  ? "="
                  : data.condition.op === "gt"
                  ? ">"
                  : data.condition.op === "gte"
                  ? "≥"
                  : data.condition.op === "lt"
                  ? "<"
                  : data.condition.op === "lte"
                  ? "≤"
                  : data.condition.op === "neq"
                  ? "≠"
                  : ""}{" "}
                {data.condition.value}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};