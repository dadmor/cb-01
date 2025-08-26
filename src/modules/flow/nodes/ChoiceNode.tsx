// ============================================
// src/modules/flow/nodes/ChoiceNode.tsx
// ============================================
import React, { useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { ChoiceNodeData } from "../types";
import { useVariablesStore } from "@/modules/variables/store/useVariablesStore";

interface ChoiceNodeProps {
  data: ChoiceNodeData;
  selected?: boolean;
}

export const ChoiceNode: React.FC<ChoiceNodeProps> = ({ data, selected }) => {
  const { label, effects } = data;
  const variables = useVariablesStore((state) => state.variables);

  const effectEntries = useMemo(
    () => Object.entries(effects).filter(([_, value]) => value !== 0),
    [effects]
  );
  const hasEffects = effectEntries.length > 0;

  // Mapka do O(1) lookup w tooltipie
  const variablesMap = useMemo(() => {
    const map = new Map<string, (typeof variables)[number]>();
    for (const v of variables) map.set(v.name, v);
    return map;
  }, [variables]);

  return (
    <div className="relative group">
      <div
        className={cn(
          "relative px-5 py-2.5 border-2 text-xs font-medium",
          "inline-flex items-center gap-2 h-12",
          "bg-zinc-700 border-zinc-600 text-zinc-200",
          selected && "border-red-500"
        )}
      >
        <span>{label}</span>

        {hasEffects && (
          <div className="flex items-center gap-1 ml-1">
            {effectEntries.map(([varName, value]) => (
              <div
                key={varName}
                className={cn(
                  "w-4 h-4 bg-zinc-800 border border-zinc-700",
                  "flex items-center justify-center text-[9px] font-bold",
                  value > 0 ? "text-green-400" : "text-red-400"
                )}
              >
                {value > 0 ? "↑" : "↓"}
              </div>
            ))}
          </div>
        )}

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

      {/* Effects tooltip on hover */}
      {hasEffects && (
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 -bottom-[60px] z-10",
            "opacity-0 pointer-events-none transition-opacity duration-200",
            "group-hover:opacity-100"
          )}
        >
          <div className="bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-[10px] whitespace-nowrap relative">
            <div className="flex flex-col gap-0.5">
              {effectEntries.map(([varName, value]) => {
                const variable = variablesMap.get(varName);
                if (!variable) return null;
                return (
                  <div key={varName} className="flex items-center gap-2">
                    <span className="text-zinc-500">{varName}:</span>
                    <span
                      className={cn(
                        "font-mono font-medium",
                        value > 0 ? "text-green-400" : "text-red-400"
                      )}
                    >
                      {value > 0 ? "+" : ""}
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-zinc-700" />
          </div>
        </div>
      )}
    </div>
  );
};
