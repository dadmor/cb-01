// ============================================
// src/modules/flow/nodes/SceneNode.tsx
// ============================================
import React, { useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
import { SceneNodeData } from "../types";
import { cn } from "@/lib/utils";
import { useVariablesStore } from "@/modules/variables/store/useVariablesStore";
import { evalConditions, conditionLabel } from "@/modules/variables/logic";
import { Lock } from "lucide-react";

interface SceneNodeProps {
  data: SceneNodeData;
  selected?: boolean;
}

export const SceneNode: React.FC<SceneNodeProps> = ({ data, selected }) => {
  const { label, description, durationSec, conditions } = data;
  const variables = useVariablesStore((s) => s.variables);

  // Wyliczanie stanu odblokowania on-the-fly (bez runtime flag w data)
  const isUnlocked = useMemo(
    () => evalConditions(conditions, variables),
    [conditions, variables]
  );

  return (
    <div
      className={cn(
        "relative w-60 h-60 transition-all duration-150 ease-in-out",
        "border-2 bg-zinc-800",
        selected ? "border-red-500" : "border-zinc-700",
        !isUnlocked && "opacity-60"
      )}
    >
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-1 text-xs text-zinc-300">
            <Lock className="w-5 h-5 text-zinc-400" />
            {conditions?.map((c, i) => (
              <span key={i} className="font-mono">
                {conditionLabel(c)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-200">{label}</h3>
        </div>

        <div className="flex-1 mb-3">
          {description && (
            <p className="text-xs leading-relaxed text-zinc-500 overflow-hidden text-ellipsis line-clamp-6">
              {description}
            </p>
          )}
        </div>

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
