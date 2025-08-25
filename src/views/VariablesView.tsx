// src/views/VariablesView.tsx
import React, { useMemo } from "react";
import { Plus, X, RotateCcw } from "lucide-react";
import { useVariablesStore } from "@/modules/variables/store/useVariablesStore";
import type { Variable } from "@/modules/variables/types";

export const VariablesView: React.FC = () => {
  const variables = useVariablesStore((s) => s.variables);
  const addVariable = useVariablesStore((s) => s.addVariable);
  const removeVariable = useVariablesStore((s) => s.removeVariable);
  const reset = useVariablesStore((s) => s.reset);
  const loadVariables = useVariablesStore((s) => s.loadVariables);

  const byName = useMemo(() => new Map(variables.map(v => [v.name, v] as const)), [variables]);

  const patchVar = (name: string, patch: Partial<Variable>) => {
    loadVariables(variables.map(v => (v.name === name ? { ...v, ...patch } : v)));
  };

  const handleAddVariable = () => {
    const name = prompt("Variable name:");
    if (!name) return;
    if (byName.has(name)) {
      alert("Variable with this name already exists.");
      return;
    }
    addVariable(name);
  };

  return (
    <div className="h-full bg-zinc-950">
      {/* Pasek nagłówka – spójny z resztą UI */}
      <div className="h-12 px-4 border-b border-zinc-900 bg-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-zinc-200">Variables</h1>
          <span className="text-[11px] text-zinc-500">{variables.length} items</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddVariable}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="w-3 h-3" /> Add
            </span>
          </button>
          <button
            onClick={reset}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <RotateCcw className="w-3 h-3" /> Reset to defaults
            </span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {variables.map((v) => (
          <div key={v.name} className="bg-zinc-900 border border-zinc-800 p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs px-2 py-1 bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono">
                {v.name}
              </span>
              <button
                onClick={() => removeVariable(v.name)}
                className="text-zinc-600 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Initial</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => patchVar(v.name, { initialValue: v.initialValue - 1 })}
                    className="w-7 h-7 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                  >
                    –
                  </button>
                  <input
                    type="number"
                    value={v.initialValue}
                    onChange={(e) =>
                      patchVar(v.name, { initialValue: parseInt(e.target.value) || 0 })
                    }
                    className="w-20 text-xs bg-zinc-950 border border-zinc-800 px-2 py-1 text-right text-zinc-200 outline-none"
                  />
                  <button
                    onClick={() => patchVar(v.name, { initialValue: v.initialValue + 1 })}
                    className="w-7 h-7 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Min</label>
                <input
                  type="number"
                  value={typeof v.min === "number" ? v.min : ""}
                  placeholder="(none)"
                  onChange={(e) =>
                    patchVar(v.name, {
                      min: e.target.value === "" ? undefined : parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-20 text-xs bg-zinc-950 border border-zinc-800 px-2 py-1 text-right text-zinc-200 placeholder-zinc-600 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Max</label>
                <input
                  type="number"
                  value={typeof v.max === "number" ? v.max : ""}
                  placeholder="(none)"
                  onChange={(e) =>
                    patchVar(v.name, {
                      max: e.target.value === "" ? undefined : parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-20 text-xs bg-zinc-950 border border-zinc-800 px-2 py-1 text-right text-zinc-200 placeholder-zinc-600 outline-none"
                />
              </div>
            </div>
          </div>
        ))}

        {variables.length === 0 && (
          <div className="text-[11px] text-zinc-600 italic">No variables defined</div>
        )}
      </div>
    </div>
  );
};
