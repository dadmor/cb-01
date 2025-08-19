import React from "react";
import { Input, Select, Label, Button } from "../ui";
import { useGameStore } from "@/gameStore";


interface NodeEditorProps {
  node: any;
  nodes: any[];
  edges: any[];
  onUpdate: (data: any) => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  node,
  nodes,
  edges,
  onUpdate,
}) => {
  const variables = useGameStore((s) => s.variables);

  // Get decisions for current main node
  const currentDecisions = React.useMemo(() => {
    if (node.type !== "main") return [];
    return edges
      .filter(e => e.source === node.id)
      .map(e => nodes.find(n => n.id === e.target))
      .filter(n => n && n.type === "decision");
  }, [node, edges, nodes]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium">
          {node.type === "main" ? "Blok główny" : "Blok decyzyjny"}
        </h4>
        
        {/* Nazwa */}
        <div>
          <Label htmlFor="nodeName">Nazwa</Label>
          <Input
            id="nodeName"
            value={node.data.label || ""}
            onChange={(e) => onUpdate({ ...node.data, label: e.target.value })}
          />
        </div>

        {/* Dla bloków głównych */}
        {node.type === "main" && (
          <>
            {/* Czas trwania */}
            <div>
              <Label htmlFor="duration">Czas trwania (sekundy)</Label>
              <Input
                id="duration"
                type="number"
                value={node.data.durationSec || 0}
                onChange={(e) => onUpdate({ ...node.data, durationSec: Number(e.target.value) })}
              />
              <p className="text-xs text-zinc-500 mt-1">0 = natychmiastowa decyzja</p>
            </div>

            {/* Warunek dostępu */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Warunek dostępu</h4>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={node.data.condition?.varName || ""}
                  onChange={(e) => {
                    const varName = e.target.value;
                    onUpdate({
                      ...node.data,
                      condition: varName ? { 
                        varName, 
                        op: node.data.condition?.op || "gte", 
                        value: node.data.condition?.value || 1 
                      } : undefined
                    });
                  }}
                >
                  <option value="">Zawsze dostępny</option>
                  {variables.map((v) => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </Select>
                {node.data.condition && (
                  <>
                    <Select
                      value={node.data.condition.op}
                      onChange={(e) =>
                        onUpdate({
                          ...node.data,
                          condition: { ...node.data.condition, op: e.target.value }
                        })
                      }
                    >
                      <option value="lt">&lt;</option>
                      <option value="lte">≤</option>
                      <option value="eq">=</option>
                      <option value="neq">≠</option>
                      <option value="gte">≥</option>
                      <option value="gt">&gt;</option>
                    </Select>
                    <Input
                      type="number"
                      value={node.data.condition.value}
                      onChange={(e) =>
                        onUpdate({
                          ...node.data,
                          condition: { ...node.data.condition, value: Number(e.target.value) }
                        })
                      }
                    />
                  </>
                )}
              </div>
            </div>

            {/* Domyślna decyzja */}
            {currentDecisions.length > 0 && (
              <div>
                <Label htmlFor="defaultDecision">Domyślna decyzja (po czasie)</Label>
                <Select
                  id="defaultDecision"
                  value={node.data.defaultDecisionId || ""}
                  onChange={(e) =>
                    onUpdate({
                      ...node.data,
                      defaultDecisionId: e.target.value || undefined
                    })
                  }
                >
                  <option value="">Brak (koniec gry)</option>
                  {currentDecisions.map(n => (
                    <option key={n.id} value={n.id}>{n.data.label}</option>
                  ))}
                </Select>
              </div>
            )}
          </>
        )}

        {/* Dla bloków decyzyjnych */}
        {node.type === "decision" && (
          <div>
            <Label>Efekty decyzji</Label>
            <div className="mt-2 space-y-2">
              {variables.map((v) => {
                const delta = node.data.deltas?.[v.name] || 0;
                return (
                  <div key={v.name} className="flex items-center gap-2">
                    <span className="w-16 text-sm">{v.name}:</span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        onUpdate({
                          ...node.data,
                          deltas: { ...node.data.deltas, [v.name]: delta - 1 }
                        })
                      }
                      className="h-7 w-7"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={delta}
                      onChange={(e) =>
                        onUpdate({
                          ...node.data,
                          deltas: { ...node.data.deltas, [v.name]: Number(e.target.value) }
                        })
                      }
                      className="w-16 text-center h-7"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        onUpdate({
                          ...node.data,
                          deltas: { ...node.data.deltas, [v.name]: delta + 1 }
                        })
                      }
                      className="h-7 w-7"
                    >
                      +
                    </Button>
                    <span className="text-xs text-zinc-500 ml-1">
                      {delta === 0 ? "bez zmian" : delta > 0 ? `+${delta}` : `${delta}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};