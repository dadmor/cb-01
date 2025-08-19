// ------ src/components/panels/VariablesSection.tsx ------
import React, { useState } from "react";
import { Input, Button, Label } from "../ui";
import { useGameStore } from "@/gameStore";

export const VariablesSection: React.FC = () => {
  const mode = useGameStore((s) => s.mode);
  const variables = useGameStore((s) => s.variables);
  const setVariableValue = useGameStore((s) => s.setVariableValue);
  const upsertVariable = useGameStore((s) => s.upsertVariable);
  const deleteVariable = useGameStore((s) => s.deleteVariable);
  
  const [newVarName, setNewVarName] = useState("");
  const [newVarValue, setNewVarValue] = useState(0);
  const [newVarInitialValue, setNewVarInitialValue] = useState(0);

  return (
    <div className="space-y-3 border-t pt-4">
      <h4 className="text-sm font-medium">Zmienne globalne</h4>
      <div className="space-y-2">
        {variables.map((v) => (
          <div key={v.name} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-20 text-sm font-medium">{v.name}:</span>
              <div className="flex-1 flex items-center gap-2">
                {mode === "play" ? (
                  <>
                    <Input
                      type="number"
                      value={v.value}
                      disabled
                      className="w-20"
                    />
                    <span className="text-xs text-zinc-500">
                      (początkowa: {v.initialValue})
                    </span>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-xs text-zinc-500">Aktualna</Label>
                      <Input
                        type="number"
                        value={v.value}
                        onChange={(e) => setVariableValue(v.name, Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-500">Początkowa</Label>
                      <Input
                        type="number"
                        value={v.initialValue}
                        onChange={(e) => upsertVariable(v.name, v.value, Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteVariable(v.name)}
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </>
                )}
              </div>
            </div>
            {(v.min !== undefined || v.max !== undefined) && (
              <span className="text-xs text-zinc-500 ml-24">
                {v.min !== undefined && `min: ${v.min}`} 
                {v.min !== undefined && v.max !== undefined && ", "}
                {v.max !== undefined && `max: ${v.max}`}
              </span>
            )}
          </div>
        ))}
        
        {mode === "edit" && (
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs">Dodaj nową zmienną</Label>
            <div className="space-y-2">
              <Input
                placeholder="Nazwa zmiennej"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-zinc-500">Wartość początkowa</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newVarInitialValue}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewVarInitialValue(val);
                      setNewVarValue(val);
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newVarName.trim()) {
                        upsertVariable(newVarName.trim(), newVarInitialValue, newVarInitialValue);
                        setNewVarName("");
                        setNewVarValue(0);
                        setNewVarInitialValue(0);
                      }
                    }}
                  >
                    Dodaj
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};