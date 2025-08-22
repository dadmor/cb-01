import React from "react";
import { Handle, Position } from "@xyflow/react";
import { SceneNodeData } from "@/types";
import { useVideoStore } from "@/modules/video/store";
import { useGameStore } from "@/modules/game/store";
import { cn } from "@/lib/utils";
import { Lock, Video, Clock } from "lucide-react";

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
    videoSegmentId,
    durationSec,
    condition,
    hasCondition,
  } = data;

  const segments = useVideoStore((state) => state.segments);
  const mode = useGameStore((state) => state.mode);
  const videoSegment = segments.find((s) => s.id === videoSegmentId);

  const progress =
    remainingMs !== undefined && durationSec > 0
      ? ((durationSec * 1000 - remainingMs) / (durationSec * 1000)) * 100
      : 0;

  // In edit mode, show condition badge if node has condition
  const showConditionIndicator = mode === "edit" && (hasCondition || condition);
  const showLockedOverlay = mode === "play" && !isUnlocked;

  return (
    <div
      className={cn(
        "relative w-60 min-h-[80px] transition-all duration-150 ease-in-out",
        "border-2",
        isCurrent ? "bg-zinc-800 border-red-600" : "bg-zinc-900",
        selected && !isCurrent && "border-red-600",
        !selected && !isCurrent && "border-zinc-800",
        (showConditionIndicator || showLockedOverlay) && "opacity-90"
      )}
    >
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3
              className={cn(
                "text-[13px] font-semibold m-0 flex items-center gap-1.5",
                isCurrent ? "text-white" : "text-zinc-300"
              )}
            >
              {label}
              {showConditionIndicator && (
                <Lock 
                  className="w-3 h-3 text-orange-500" 
                  strokeWidth={2.5}
                />
              )}
            </h3>

            {videoSegment && (
              <div className="flex items-center gap-1 mt-1">
                <Video className="w-2.5 h-2.5 text-zinc-600" strokeWidth={2} />
                <span className="text-[10px] text-zinc-600">
                  {videoSegment.label ||
                    `Region ${segments.indexOf(videoSegment) + 1}`}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isCurrent && (
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
            )}

            {remainingMs !== undefined && remainingMs > 0 && (
              <span className="text-[10px] bg-zinc-950 px-1.5 py-0.5 text-red-600 font-mono">
                {Math.ceil(remainingMs / 1000)}s
              </span>
            )}
          </div>
        </div>

        {description && (
          <p className="text-[11px] leading-[1.4] text-zinc-600 m-0 mb-2 overflow-hidden text-ellipsis line-clamp-2">
            {description}
          </p>
        )}

        {/* Duration bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-zinc-600">Duration</span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {durationSec}s
            </span>
          </div>

          <div className="h-0.5 bg-zinc-950 relative overflow-hidden">
            {isCurrent && (
              <div
                className="h-full bg-red-600 transition-[width] duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            )}
          </div>
        </div>

        {/* Condition info in edit mode */}
        {mode === "edit" && condition && (
          <div className="mt-2 bg-zinc-950/50 border border-orange-600/30 px-2 py-1">
            <p className="text-[10px] text-orange-500 font-medium">
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
        className="!w-2 !h-4 !bg-zinc-800 !border !border-zinc-700 !rounded-none !left-[-5px]"
      />

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-4 !bg-zinc-800 !border !border-zinc-700 !rounded-none !right-[-5px]"
      />

      {/* Locked overlay in play mode */}
      {showLockedOverlay && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-3">
          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-zinc-600" strokeWidth={2.5} />
            <span className="text-[11px] text-zinc-600 font-medium">
              Locked
            </span>
          </div>

          {/* Show condition info if available */}
          {data.condition && (
            <div className="bg-zinc-950/90 border border-zinc-800 px-2 py-1 max-w-[90%]">
              <p className="text-[10px] text-zinc-500 text-center">
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