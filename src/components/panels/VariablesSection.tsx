import React, { useState } from "react";
import { Input, Button } from "../ui";
import { useGameStore } from "@/gameStore";


export const VariablesSection: React.FC = () => {
  const mode = useGameStore((s) => s.mode);
  const variables = useGameStore((s) => s.variables);
  const [newVarName, setNewVarName] = useState("");
  const [newVarValue, setNewVarValue] = useState(0);

  return (
    <div className="space-y-3 border-t pt-4">
      <h4 className="text-sm font-medium">Zmienne globalne</h4>
      <div className="space-y-2">
        {variables.map((v) => (
          <div key={v.name} className="flex items-center gap-2">
            <span className="w-20 text-sm">{v.name}:</span>
            <Input
              type="number"
              value={v.value}
              onChange={(e) => useGameStore.getState().setVariableValue(v.name, Number(e.target.value))}
              disabled={mode === "play"}
              className="w-20"
            />
            <span className="text-xs text-zinc-500">
              {v.min !== undefined && `min: ${v.min}`} {v.max !== undefined && `max: ${v.max}`}
            </span>
          </div>
        ))}
        {mode === "edit" && (
          <div className="flex gap-2">
            <Input
              placeholder="nazwa"
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="0"
              value={newVarValue}
              onChange={(e) => setNewVarValue(Number(e.target.value))}
              className="w-20"
            />
            <Button
              size="sm"
              onClick={() => {
                if (newVarName.trim()) {
                  useGameStore.getState().upsertVariable(newVarName.trim(), newVarValue);
                  setNewVarName("");
                  setNewVarValue(0);
                }
              }}
            >
              Dodaj
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};