// ------ src/components/panels/NodeEditor.tsx ------
import React from "react";
import { Input, Select, Label, Button } from "../ui";
import { useGameStore } from "@/gameStore";
import { FlowNode, FlowEdge, DecisionNode, MainNodeData, DecisionNodeData, Condition, Op } from "@/types";
import { isMainNode, isDecisionNode } from "@/flowStore";

interface NodeEditorProps {
  node: FlowNode;
  nodes: FlowNode[];
  edges: FlowEdge[];
  onUpdate: (data: MainNodeData | DecisionNodeData) => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  node,
  nodes,
  edges,
  onUpdate,
}) => {
  const variables = useGameStore((s) => s.variables);

  // Get decisions for current main node
  const currentDecisions = React.useMemo((): DecisionNode[] => {
    if (!isMainNode(node)) return [];
    
    return edges
      .filter(e => e.source === node.id)
      .map(e => nodes.find(n => n.id === e.target))
      .filter((n): n is DecisionNode => n !== undefined && isDecisionNode(n));
  }, [node, edges, nodes]);

  const handleMainNodeUpdate = (updates: Partial<MainNodeData>) => {
    if (isMainNode(node)) {
      onUpdate({ ...node.data, ...updates });
    }
  };

  const handleDecisionNodeUpdate = (updates: Partial<DecisionNodeData>) => {
    if (isDecisionNode(node)) {
      onUpdate({ ...node.data, ...updates });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium">
          {isMainNode(node) ? "Blok główny" : "Blok decyzyjny"}
        </h4>
        
        {/* Name */}
        <div>
          <Label htmlFor="nodeName">Nazwa</Label>
          <Input
            id="nodeName"
            value={node.data.label || ""}
            onChange={(e) => {
              if (isMainNode(node)) {
                handleMainNodeUpdate({ label: e.target.value });
              } else {
                handleDecisionNodeUpdate({ label: e.target.value });
              }
            }}
          />
        </div>

        {/* For main nodes */}
        {isMainNode(node) && (
          <>
            {/* Duration */}
            <div>
              <Label htmlFor="duration">Czas trwania (sekundy)</Label>
              <Input
                id="duration"
                type="number"
                value={node.data.durationSec || 0}
                onChange={(e) => handleMainNodeUpdate({ durationSec: Number(e.target.value) })}
              />
              <p className="text-xs text-zinc-500 mt-1">0 = natychmiastowa decyzja</p>
            </div>

            {/* Access condition */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Warunek dostępu</h4>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={node.data.condition?.varName || ""}
                  onChange={(e) => {
                    const varName = e.target.value;
                    const condition: Condition | undefined = varName 
                      ? { 
                          varName, 
                          op: node.data.condition?.op || "gte", 
                          value: node.data.condition?.value || 1 
                        } 
                      : undefined;
                    handleMainNodeUpdate({ condition });
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
                      onChange={(e) => {
                        const condition: Condition = { 
                          ...node.data.condition!, 
                          op: e.target.value as Op 
                        };
                        handleMainNodeUpdate({ condition });
                      }}
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
                      onChange={(e) => {
                        const condition: Condition = { 
                          ...node.data.condition!, 
                          value: Number(e.target.value) 
                        };
                        handleMainNodeUpdate({ condition });
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Default decision */}
            {currentDecisions.length > 0 && (
              <div>
                <Label htmlFor="defaultDecision">Domyślna decyzja (po czasie)</Label>
                <Select
                  id="defaultDecision"
                  value={node.data.defaultDecisionId || ""}
                  onChange={(e) =>
                    handleMainNodeUpdate({
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

        {/* For decision nodes */}
        {isDecisionNode(node) && (
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
                        handleDecisionNodeUpdate({
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
                        handleDecisionNodeUpdate({
                          deltas: { ...node.data.deltas, [v.name]: Number(e.target.value) }
                        })
                      }
                      className="w-16 text-center h-7"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        handleDecisionNodeUpdate({
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