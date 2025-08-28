// ------ src/views/storymap/StorymapSidebar.tsx ------
import { PanelContent, Button, Card, Select, PanelFooter, Input } from "@/components/ui";
import { isSceneNode, isChoiceNode } from "@/modules/flow";
import { useFlowStore, START_NODE_ID } from "@/modules/flow/store/useFlowStore";
import { useVariablesStore } from "@/modules/variables/store/useVariablesStore";
import { ConditionOperator } from "@/modules/variables/types";
import { Plus, Star } from "lucide-react";
import { useMemo } from "react";

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

  if (!selectedNode) {
    return (
      <PanelContent>
        <div className="text-center py-8">
          <p className="text-zinc-600 text-xs mb-4">No node selected</p>
          <div className="flex gap-2 justify-center">
            <Button icon={Plus} onClick={addSceneNode}>Add Scene</Button>
            <Button icon={Plus} onClick={() => addChoiceNode()}>Add Choice</Button>
          </div>
        </div>
      </PanelContent>
    );
  }

  return (
    <>
      <PanelContent>
        <Card title={isSceneNode(selectedNode) ? "Scene" : "Choice"}>
          <div className="space-y-3">
            <Input
              label="Name"
              value={selectedNode.data.label}
              onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
            />

            {isSceneNode(selectedNode) && (
              <>
                <div>
                  <label className="block text-zinc-500 mb-1 text-[10px] uppercase">
                    Description
                  </label>
                  <textarea
                    value={selectedNode.data.description || ""}
                    onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none resize-none rounded"
                    rows={3}
                  />
                </div>

                <Input
                  label="Duration (sec)"
                  type="number"
                  value={selectedNode.data.durationSec}
                  min={0}
                  onChange={(e) => {
                    const duration = parseInt(e.target.value);
                    if (!isNaN(duration) && duration >= 0) {
                      updateNode(selectedNode.id, { durationSec: duration });
                    }
                  }}
                />

                {/* Priority toggle for Scene nodes */}
                <div className="flex items-center justify-between py-2 px-2 bg-zinc-950 border border-zinc-800 rounded">
                  <div className="flex items-center gap-2">
                    <Star 
                      className={`w-4 h-4 ${
                        selectedNode.data.isPriority 
                          ? "text-yellow-400 fill-yellow-400" 
                          : "text-zinc-600"
                      }`}
                    />
                    <span className="text-xs text-zinc-400">Priority Scene</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedNode.data.isPriority || false}
                      onChange={(e) => updateNode(selectedNode.id, { isPriority: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-600"></div>
                  </label>
                </div>

                {selectedNode.data.isPriority && (
                  <div className="p-2 bg-yellow-900/20 border border-yellow-800/30 rounded">
                    <p className="text-[10px] text-yellow-200/80 leading-relaxed">
                      This scene will be chosen automatically when multiple scenes are available after playback ends.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between">
              {isSceneNode(selectedNode) && (
                <div className="flex gap-1">
                 
                  <Button size="xs"  onClick={() => addSceneNode()}>
                    + Scene
                  </Button>
                  <Button size="xs" onClick={() => addChoiceNode({ connectFromId: selectedNode.id })}>
                    + Choice
                  </Button>
                </div>
              )}
              {selectedNode.id !== START_NODE_ID && (
                <Button size="xs" variant="ghost" onClick={() => deleteNode(selectedNode.id)}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Conditions for Scenes */}
        {isSceneNode(selectedNode) && (
          <Card title="Conditions">
            <div className="space-y-2">
              {(selectedNode.data.conditions ?? []).map((cond, idx) => (
                <div key={idx} className="flex gap-1">
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
                    className="flex-1"
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
                    className="w-16"
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
                    className="w-16 bg-zinc-950 border border-zinc-800 px-1 py-0.5 text-xs text-zinc-200 text-center focus:border-zinc-600 focus:outline-none rounded"
                  />
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      const conds = (selectedNode.data.conditions ?? []).filter((_, i) => i !== idx);
                      updateNode(selectedNode.id, { conditions: conds });
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button size="xs" onClick={() => {
                const conds = [
                  ...(selectedNode.data.conditions ?? []),
                  { varName: variables[0]?.name ?? "", op: "gte" as ConditionOperator, value: 0 }
                ];
                updateNode(selectedNode.id, { conditions: conds });
              }}>
                + Add Condition
              </Button>
            </div>
          </Card>
        )}

        {/* Effects for Choices */}
        {isChoiceNode(selectedNode) && (
          <Card title="Variable Effects"  >
            <div className="space-y-2">
              {variables.map((v) => {
                const effect = selectedNode.data.effects[v.name] ?? 0;
                return (
                  <div key={v.name} className="flex items-center gap-2">
                    <span className="w-20 text-xs text-zinc-400 font-mono">{v.name}</span>
                    <Button size="xs" onClick={() =>
                      updateNode(selectedNode.id, {
                        effects: { ...selectedNode.data.effects, [v.name]: effect - 1 }
                      })
                    }>−</Button>
                    <span className={`w-10 text-center text-xs font-mono ${
                      effect > 0 ? "text-green-400" : effect < 0 ? "text-red-400" : "text-zinc-600"
                    }`}>
                      {effect > 0 ? "+" : ""}{effect}
                    </span>
                    <Button size="xs" onClick={() =>
                      updateNode(selectedNode.id, {
                        effects: { ...selectedNode.data.effects, [v.name]: effect + 1 }
                      })
                    }>+</Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </PanelContent>
      
      <PanelFooter>
        {nodes.length} nodes • {edges.length} edges
        <span className="ml-auto">{selectedNodeId ? `ID: ${selectedNodeId}` : "Ready"}</span>
      </PanelFooter>
    </>
  );
};
