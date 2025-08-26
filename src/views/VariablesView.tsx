// src/views/VariablesView.tsx
import React, { useMemo } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { useVariablesStore } from "@/modules/variables/store/useVariablesStore";
import type { Variable } from "@/modules/variables/types";
import { 
  Button, 
  NumberInput,
  Panel, 
  PanelContent, 
  PanelHeader,
  PanelFooter
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
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              {variables.length} items
            </span>
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
              <div key={v.name} className="mb-2">
                {/* Variable header */}
                <div className="bg-zinc-800 border border-zinc-700 px-2 py-1 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-300">{v.name}</span>
                  <button
                    onClick={() => removeVariable(v.name)}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                
                {/* Variable controls */}
                <div className="bg-zinc-950 border-x border-b border-zinc-700 p-2">
                  <div className="grid grid-cols-4 gap-2">
                    {/* Current - read only */}
                    <NumberInput
                      label="Current"
                      value={v.value}
                      onChange={() => {}} // read-only
                      disabled={true}
                    />

                    {/* Initial */}
                    <NumberInput
                      label="Initial"
                      value={v.initialValue}
                      onChange={(val) => patchVar(v.name, { 
                        initialValue: val,
                        value: val 
                      })}
                    />

                    {/* Min */}
                    <NumberInput
                      label="Min"
                      value={typeof v.min === "number" ? v.min : ""}
                      placeholder="—"
                      onChange={(val) => patchVar(v.name, { min: val })}
                    />

                    {/* Max */}
                    <NumberInput
                      label="Max"
                      value={typeof v.max === "number" ? v.max : ""}
                      placeholder="—"
                      onChange={(val) => patchVar(v.name, { max: val })}
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

      <PanelFooter>
        Variable System
      </PanelFooter>
    </Panel>
  );
};