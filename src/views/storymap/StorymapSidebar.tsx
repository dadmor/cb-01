// src/views/storymap/StorymapSidebar.tsx - DAVINCI STYLE
import React, { useMemo } from "react";
import { isSceneNode, isChoiceNode } from "@/modules/flow/types";
import { Plus, Film, Link2, Trash2 } from "lucide-react";
import { useFlowStore, START_NODE_ID } from "@/modules/flow/store/useFlowStore";
import { useVariablesStore } from "@/modules/variables/store/useVariablesStore";
import type { ConditionOperator } from "@/modules/variables/types";
import { Button, Input, NumberInput, Panel, PanelContent, Select } from "@/components/ui";

export const StorymapSidebar: React.FC = () => {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
  const updateNode = useFlowStore((state) => state.updateNode);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const addSceneNode = useFlowStore((state) => state.addSceneNode);
  const addChoiceNode = useFlowStore((state) => state.addChoiceNode);

  const variables = useVariablesStore((state) => state.variables);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  return (
    <Panel className="h-full bg-zinc-900">
      <PanelContent className="h-full overflow-y-auto p-0">
        {selectedNode ? (
          <>
            {/* Node Type Section - Tight header like DaVinci */}
            <div className="bg-zinc-800 border-b border-zinc-700 px-2 py-1 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {isSceneNode(selectedNode) ? 
                  <Film className="w-3 h-3 text-zinc-500" /> : 
                  <Link2 className="w-3 h-3 text-zinc-500" />
                }
                <span className="text-xs text-zinc-400 uppercase tracking-wider">
                  {isSceneNode(selectedNode) ? "Scene" : "Choice"}
                </span>
              </div>
              <div className="flex items-center">
                {isSceneNode(selectedNode) && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => addChoiceNode({ connectFromId: selectedNode.id })}
                  >
                    + Choice
                  </Button>
                )}
                {selectedNode.id !== START_NODE_ID && (
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Trash2}
                    onClick={() => deleteNode(selectedNode.id)}
                  />
                )}
              </div>
            </div>

            {/* Properties - No spacing, tight like DaVinci */}
            <div className="p-2">
              <Input
                label="Name"
                value={selectedNode.data.label}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                compact
              />

              {isSceneNode(selectedNode) && (
                <>
                  <div className="mt-2">
                    <label className="block text-zinc-500 mb-1" style={{ fontSize: '10px' }}>
                      DESCRIPTION
                    </label>
                    <textarea
                      value={selectedNode.data.description || ""}
                      onChange={(e) =>
                        updateNode(selectedNode.id, { description: e.target.value })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="mt-2">
                    <NumberInput
                      label="Duration"
                      value={selectedNode.data.durationSec}
                      unit="sec"
                      min={0}
                      onChange={(e) => {
                        const duration = parseInt(e.target.value);
                        if (!isNaN(duration) && duration >= 0) {
                          updateNode(selectedNode.id, { durationSec: duration });
                        }
                      }}
                      compact
                    />
                  </div>
                </>
              )}
            </div>

            {/* Conditions Section - DaVinci style collapsible */}
            {isSceneNode(selectedNode) && (
              <>
                <div className="bg-zinc-800 border-t border-b border-zinc-700 px-2 py-1">
                  <span className="text-xs text-zinc-400 uppercase tracking-wider">
                    Conditions
                  </span>
                </div>
                <div className="p-2">
                  {(selectedNode.data.conditions ?? []).map((cond, idx) => (
                    <div key={idx} className="flex items-center gap-1 mb-1">
                      <Select
                        value={cond.varName}
                        options={[
                          { value: "", label: "(none)" },
                          ...variables.map(v => ({ value: v.name, label: v.name }))
                        ]}
                        onChange={(e) => {
                          const conds = [...(selectedNode.data.conditions ?? [])];
                          conds[idx] = { ...cond, varName: e.target.value };
                          updateNode(selectedNode.id, { conditions: conds });
                        }}
                        compact
                      />

                      <Select
                        value={cond.op}
                        options={[
                          { value: "lt", label: "<" },
                          { value: "lte", label: "≤" },
                          { value: "eq", label: "=" },
                          { value: "neq", label: "≠" },
                          { value: "gte", label: "≥" },
                          { value: "gt", label: ">" }
                        ]}
                        onChange={(e) => {
                          const conds = [...(selectedNode.data.conditions ?? [])];
                          conds[idx] = { ...cond, op: e.target.value as ConditionOperator };
                          updateNode(selectedNode.id, { conditions: conds });
                        }}
                        compact
                      />

                      <input
                        type="number"
                        value={cond.value}
                        onChange={(e) => {
                          const num = parseFloat(e.target.value);
                          const conds = [...(selectedNode.data.conditions ?? [])];
                          conds[idx] = { ...cond, value: isNaN(num) ? 0 : num };
                          updateNode(selectedNode.id, { conditions: conds });
                        }}
                        className="w-20 bg-zinc-950 border border-zinc-800 px-1 py-0.5 text-xs text-zinc-200 text-center focus:border-zinc-600 focus:outline-none"
                      />

                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          const conds = (selectedNode.data.conditions ?? []).filter((_c, i) => i !== idx);
                          updateNode(selectedNode.id, { conditions: conds });
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="default"
                    size="xs"
                    onClick={() => {
                      const conds = [
                        ...(selectedNode.data.conditions ?? []),
                        {
                          varName: variables[0]?.name ?? "",
                          op: "gte" as ConditionOperator,
                          value: 0,
                        },
                      ];
                      updateNode(selectedNode.id, { conditions: conds });
                    }}
                    className="mt-1"
                  >
                    + Add condition
                  </Button>
                </div>
              </>
            )}

            {/* Effects Section for Choices - DaVinci style */}
            {isChoiceNode(selectedNode) && (
              <>
                <div className="bg-zinc-800 border-t border-b border-zinc-700 px-2 py-1">
                  <span className="text-xs text-zinc-400 uppercase tracking-wider">
                    Variable Effects
                  </span>
                </div>
                <div className="p-2">
                  {variables.map((v) => {
                    const effect = selectedNode.data.effects[v.name] ?? 0;
                    return (
                      <div key={v.name} className="flex items-center gap-1 mb-1">
                        <span className="w-20 text-xs text-zinc-400 font-mono">{v.name}</span>
                        <Button
                          variant="default"
                          size="xs"
                          onClick={() =>
                            updateNode(selectedNode.id, {
                              effects: { ...selectedNode.data.effects, [v.name]: effect - 1 },
                            })
                          }
                        >
                          −
                        </Button>
                        <span
                          className={`w-10 text-center text-xs font-mono ${
                            effect > 0
                              ? "text-green-400"
                              : effect < 0
                              ? "text-red-400"
                              : "text-zinc-600"
                          }`}
                        >
                          {effect > 0 ? "+" : ""}
                          {effect}
                        </span>
                        <Button
                          variant="default"
                          size="xs"
                          onClick={() =>
                            updateNode(selectedNode.id, {
                              effects: { ...selectedNode.data.effects, [v.name]: effect + 1 },
                            })
                          }
                        >
                          +
                        </Button>
                      </div>
                    );
                  })}
                  {variables.length === 0 && (
                    <p className="text-xs text-zinc-600">No variables registered.</p>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="p-6 text-center">
            <p className="text-zinc-600 text-xs mb-4">No node selected</p>
            <div className="flex items-center gap-2 justify-center">
              <Button
                variant="default"
                icon={Plus}
                onClick={addSceneNode}
              >
                Add Scene
              </Button>
              <Button
                variant="default"
                icon={Plus}
                onClick={() => addChoiceNode()}
              >
                Add Choice
              </Button>
            </div>
          </div>
        )}
      </PanelContent>

      {/* Status bar - tight like DaVinci */}
      <div className="h-5 bg-zinc-950 border-t border-zinc-800 px-2 flex items-center text-zinc-600">
        <span style={{ fontSize: '10px' }}>
          {nodes.length} nodes • {edges.length} edges
        </span>
        <span style={{ fontSize: '10px' }} className="ml-auto">
          {selectedNodeId ? `ID: ${selectedNodeId}` : "Ready"}
        </span>
      </div>
    </Panel>
  );
};