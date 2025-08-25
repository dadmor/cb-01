// ============================================
// src/views/decisions/Sidebar.tsx
// ============================================
import React, { useMemo } from "react";
import { isSceneNode, isChoiceNode } from "@/modules/flow/types";
import { Plus } from "lucide-react";
import { useFlowStore, START_NODE_ID } from "@/modules/flow/store/useFlowStore";
import { useVariablesStore } from "@/modules/variables/store/useVariablesStore";
import type { ConditionOperator } from "@/modules/variables/types";

export const Sidebar: React.FC = () => {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
  const updateNode = useFlowStore((state) => state.updateNode);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const addSceneNode = useFlowStore((state) => state.addSceneNode);
  const addChoiceNode = useFlowStore((state) => state.addChoiceNode); // <<< NOWE

  const variables = useVariablesStore((state) => state.variables);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] text-[#ccc]">
      <div className="flex-1 overflow-y-auto">
        {selectedNode ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] mb-px">
            <div className="bg-[#252525] border-b border-[#0a0a0a] text-[#999] text-[11px] font-semibold uppercase tracking-wider px-3 py-2 h-8 flex items-center justify-between">
              <span>{isSceneNode(selectedNode) ? "SCENE" : "CHOICE"} PROPERTIES</span>
              <div className="flex items-center gap-3">
                {isSceneNode(selectedNode) && (
                  <button
                    onClick={() => addChoiceNode({ connectFromId: selectedNode.id })}
                    className="text-[#666] text-[11px] hover:text-[#bbb] transition-colors"
                    title="Add choice and connect from this scene"
                  >
                    + Choice from here
                  </button>
                )}
                {selectedNode.id !== START_NODE_ID && (
                  <button
                    onClick={() => deleteNode(selectedNode.id)}
                    className="text-[#666] text-[11px] hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="p-3">
              <div className="mb-3">
                <label className="text-[11px] text-[#666] block mb-1">NAME</label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      label: e.target.value,
                    })
                  }
                  className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs px-2 py-1 w-full outline-none focus:border-[#3a3a3a]"
                />
              </div>

              {isSceneNode(selectedNode) && (
                <>
                  <div className="mb-3">
                    <label className="text-[11px] text-[#666] block mb-1">DESCRIPTION</label>
                    <textarea
                      value={selectedNode.data.description || ""}
                      onChange={(e) =>
                        updateNode(selectedNode.id, {
                          description: e.target.value,
                        })
                      }
                      className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs px-2 py-1 w-full outline-none focus:border-[#3a3a3a] resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="text-[11px] text-[#666] block mb-1">DURATION (SECONDS)</label>
                    <input
                      type="number"
                      value={selectedNode.data.durationSec}
                      onChange={(e) => {
                        const duration = parseInt(e.target.value);
                        if (!isNaN(duration) && duration >= 0) {
                          updateNode(selectedNode.id, { durationSec: duration });
                        }
                      }}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs px-2 py-1 w-full outline-none focus:border-[#3a3a3a]"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="text-[11px] text-[#666] block mb-2">CONDITIONS</label>
                    <div className="space-y-2">
                      {(selectedNode.data.conditions ?? []).map((cond, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <select
                            value={cond.varName}
                            onChange={(e) => {
                              const conds = [...(selectedNode.data.conditions ?? [])];
                              conds[idx] = { ...cond, varName: e.target.value };
                              updateNode(selectedNode.id, { conditions: conds });
                            }}
                            className="bg-[#1a1a1a] border border-[#2a2a2a] text-xs px-2 py-1 text-[#ccc] w-28"
                          >
                            <option value="">(none)</option>
                            {variables.map((v) => (
                              <option key={v.name} value={v.name}>
                                {v.name}
                              </option>
                            ))}
                          </select>

                          <select
                            value={cond.op}
                            onChange={(e) => {
                              const conds = [...(selectedNode.data.conditions ?? [])];
                              conds[idx] = { ...cond, op: e.target.value as ConditionOperator };
                              updateNode(selectedNode.id, { conditions: conds });
                            }}
                            className="bg-[#1a1a1a] border border-[#2a2a2a] text-xs px-2 py-1 text-[#ccc] w-16"
                          >
                            <option value="lt">&lt;</option>
                            <option value="lte">≤</option>
                            <option value="eq">=</option>
                            <option value="neq">≠</option>
                            <option value="gte">≥</option>
                            <option value="gt">&gt;</option>
                          </select>

                          <input
                            type="number"
                            value={cond.value}
                            onChange={(e) => {
                              const num = parseFloat(e.target.value);
                              const conds = [...(selectedNode.data.conditions ?? [])];
                              conds[idx] = { ...cond, value: isNaN(num) ? 0 : num };
                              updateNode(selectedNode.id, { conditions: conds });
                            }}
                            className="bg-[#1a1a1a] border border-[#2a2a2a] text-xs px-2 py-1 text-[#ccc] w-20 text-right"
                          />

                          <button
                            onClick={() => {
                              const conds = (selectedNode.data.conditions ?? []).filter(
                                (_c, i) => i !== idx
                              );
                              updateNode(selectedNode.id, { conditions: conds });
                            }}
                            className="px-2 py-1 text-[11px] bg-[#2a2a2a] border border-[#3a3a3a] text-[#bbb] hover:bg-[#333]"
                            aria-label="Remove condition"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      <button
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
                        className="px-2 py-1 text-[11px] bg-[#2a2a2a] border border-[#3a3a3a] text-[#bbb] hover:bg-[#333]"
                      >
                        + Add condition
                      </button>
                    </div>
                  </div>
                </>
              )}

              {isChoiceNode(selectedNode) && (
                <div>
                  <label className="text-[11px] text-[#666] block mb-2">VARIABLE EFFECTS</label>
                  <div className="bg-[#0f0f0f] p-2 border border-[#2a2a2a]">
                    {variables.map((v) => {
                      const effect = selectedNode.data.effects[v.name] ?? 0;
                      return (
                        <div key={v.name} className="flex items-center gap-2 mb-2 last:mb-0">
                          <span className="w-20 text-[11px] text-[#666] font-mono">{v.name}</span>
                          <button
                            onClick={() =>
                              updateNode(selectedNode.id, {
                                effects: { ...selectedNode.data.effects, [v.name]: effect - 1 },
                              })
                            }
                            className="w-6 h-6 bg-[#2a2a2a] border border-[#3a3a3a] text-[#999] text-sm font-medium hover:bg-[#333]"
                          >
                            -
                          </button>
                          <span
                            className={`w-10 text-center text-xs font-mono ${
                              effect > 0
                                ? "text-green-400"
                                : effect < 0
                                ? "text-red-400"
                                : "text-[#666]"
                            }`}
                          >
                            {effect > 0 ? "+" : ""}
                            {effect}
                          </span>
                          <button
                            onClick={() =>
                              updateNode(selectedNode.id, {
                                effects: { ...selectedNode.data.effects, [v.name]: effect + 1 },
                              })
                            }
                            className="w-6 h-6 bg-[#2a2a2a] border border-[#3a3a3a] text-[#999] text-sm font-medium hover:bg-[#333]"
                          >
                            +
                          </button>
                        </div>
                      );
                    })}
                    {variables.length === 0 && (
                      <p className="text-[11px] text-[#777]">Brak zarejestrowanych zmiennych.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-[#666] text-xs mb-4">No node selected</p>
            <div className="flex items-center gap-2 justify-center">
              <button
                onClick={addSceneNode}
                className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#999] text-xs font-medium py-1.5 px-3 hover:border-[#4a4a4a] hover:bg-[#333] transition-colors inline-flex items-center"
              >
                <Plus size={12} className="mr-2" />
                Add Scene
              </button>
              <button
                onClick={() => addChoiceNode()}
                className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#999] text-xs font-medium py-1.5 px-3 hover:border-[#4a4a4a] hover:bg-[#333] transition-colors inline-flex items-center"
              >
                <Plus size={12} className="mr-2" />
                Add Choice
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-6 bg-[#1a1a1a] border-t border-[#0a0a0a] flex items-center justify-between px-3 text-[11px] text-[#666]">
        <span>
          {nodes.length} nodes • {edges.length} edges
        </span>
        <span>{selectedNodeId ? `ID: ${selectedNodeId}` : "Ready"}</span>
      </div>
    </div>
  );
};
