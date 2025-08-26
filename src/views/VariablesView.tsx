// src/views/VariablesView.tsx - FIXED
import React, { useMemo } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { useVariablesStore } from "@/modules/variables/store/useVariablesStore";
import type { Variable } from "@/modules/variables/types";
import { 
  Button, 
  Input, 
  NumberInput, 
  Panel, 
  PanelContent, 
  PanelHeader,
  StatusText
} from "@/components/ui";

export const VariablesView: React.FC = () => {
  const variables = useVariablesStore((s) => s.variables);
  const removeVariable = useVariablesStore((s) => s.removeVariable);
  const reset = useVariablesStore((s) => s.reset);
  const loadVariables = useVariablesStore((s) => s.loadVariables);

  const byName = useMemo(() => new Map(variables.map(v => [v.name, v] as const)), [variables]);

  const patchVar = (varName: string, patch: Partial<Variable>) => {
    loadVariables(variables.map(v => (v.name === varName ? { ...v, ...patch } : v)));
  };

  const handleAddVariable = () => {
    const varName = prompt("Variable name:");
    if (!varName) return;
    if (byName.has(varName)) {
      alert("Variable with this name already exists.");
      return;
    }
    
    const newVar: Variable = {
      name: varName,
      value: 10,
      initialValue: 10,
      min: undefined,
      max: undefined
    };
    loadVariables([...variables, newVar]);
  };

  return (
    <Panel className="h-full bg-zinc-900">
      <PanelHeader 
        title="Variables"
        compact
        actions={
          <div className="flex items-center gap-2">
            <StatusText variant="muted" size="xs">
              {variables.length} items
            </StatusText>
            <Button
              variant="default"
              size="xs"
              icon={Plus}
              onClick={handleAddVariable}
            >
              Add
            </Button>
            <Button
              variant="default"
              size="xs"
              icon={RotateCcw}
              onClick={reset}
            >
              Reset
            </Button>
          </div>
        }
      />

      <PanelContent className="p-2">
        {variables.length > 0 ? (
          <>
            {variables.map((v) => (
              <div key={v.name}>
                {/* Variable section header - DaVinci style */}
                <div className="bg-zinc-800 border border-zinc-700 px-2 py-1 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-300">{v.name}</span>
                  <button
                    onClick={() => removeVariable(v.name)}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    <span className="text-xs">×</span>
                  </button>
                </div>
                
                {/* Variable controls - tight spacing */}
                <div className="bg-zinc-950 border-x border-b border-zinc-700 p-2 mb-1">
                  <div className="grid grid-cols-4 gap-2">
                    {/* Current Value - highlighted */}
                    <div>
                      <label className="block text-zinc-500 mb-0.5" style={{ fontSize: '10px' }}>
                        CURRENT
                      </label>
                      <div className="bg-zinc-900 border border-zinc-700 px-2 py-1 text-center">
                        <span className="text-sm font-bold text-orange-500">
                          {v.value}
                        </span>
                      </div>
                    </div>

                    {/* Initial Value */}
                    <NumberInput
                      label="Initial"
                      value={v.initialValue}
                      onChange={(e) =>
                        patchVar(v.name, { 
                          initialValue: parseInt(e.target.value) || 0,
                          value: parseInt(e.target.value) || 0 
                        })
                      }
                      compact
                    />

                    {/* Min */}
                    <Input
                      label="Min"
                      type="number"
                      value={typeof v.min === "number" ? v.min : ""}
                      placeholder="—"
                      onChange={(e) =>
                        patchVar(v.name, {
                          min: e.target.value === "" ? undefined : parseInt(e.target.value) || 0,
                        })
                      }
                      compact
                    />

                    {/* Max */}
                    <Input
                      label="Max"
                      type="number"
                      value={typeof v.max === "number" ? v.max : ""}
                      placeholder="—"
                      onChange={(e) =>
                        patchVar(v.name, {
                          max: e.target.value === "" ? undefined : parseInt(e.target.value) || 0,
                        })
                      }
                      compact
                    />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-zinc-600 italic text-xs mb-4">
              No variables defined
            </div>
            <Button
              variant="default"
              icon={Plus}
              onClick={handleAddVariable}
            >
              Add Variable
            </Button>
          </div>
        )}
      </PanelContent>

      {/* Status bar */}
      <div className="h-5 bg-zinc-950 border-t border-zinc-800 px-2 flex items-center text-zinc-600">
        <span style={{ fontSize: '10px' }}>
          Variable System
        </span>
      </div>
    </Panel>
  );
};