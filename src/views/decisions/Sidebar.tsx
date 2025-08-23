// src/views/decisions/Sidebar.tsx
import React, { useMemo } from "react";
import { isSceneNode, isChoiceNode } from "@/modules/flow/types";
import { Plus, X } from 'lucide-react';
import { 
  useNodes,
  useEdges,
  useSelectedNodeId,
  useVariables,
  useUpdateNode,
  useDeleteNode,
  useSelectNode,
  useAddSceneNode,
  useAppStore,
  START_NODE_ID
} from "@/store/useAppStore";

export const Sidebar: React.FC = () => {
  const nodes = useNodes();
  const edges = useEdges();
  const selectedNodeId = useSelectedNodeId();
  const variables = useVariables();
  
  const updateNode = useUpdateNode();
  const deleteNode = useDeleteNode();
  const selectNode = useSelectNode();
  const addSceneNode = useAddSceneNode();

  const selectedNode = useMemo(
    () => nodes.find(n => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  const addVariable = () => {
    const name = prompt("Variable name:");
    if (name && !variables.find(v => v.name === name)) {
      useAppStore.getState().addVariable(name);
    }
  };

  const removeVariable = (name: string) => {
    useAppStore.getState().removeVariable(name);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] text-[#ccc]">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Node Properties */}
        {selectedNode ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] mb-px">
            <div className="bg-[#252525] border-b border-[#0a0a0a] text-[#999] text-[11px] font-semibold uppercase tracking-wider px-3 py-2 h-8 flex items-center justify-between">
              <span>{isSceneNode(selectedNode) ? "SCENE" : "CHOICE"} PROPERTIES</span>
              {selectedNode.id !== START_NODE_ID && (
                <button
                  onClick={() => deleteNode(selectedNode.id)}
                  className="text-[#666] text-[11px] hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>

            <div className="p-3">
              {/* Name */}
              <div className="mb-3">
                <label className="text-[11px] text-[#666] block mb-1">
                  NAME
                </label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => updateNode(selectedNode.id, {
                    label: e.target.value
                  })}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs px-2 py-1 w-full outline-none focus:border-[#3a3a3a]"
                />
              </div>

              {isSceneNode(selectedNode) && (
                <>
                  {/* Description */}
                  <div className="mb-3">
                    <label className="text-[11px] text-[#666] block mb-1">
                      DESCRIPTION
                    </label>
                    <textarea
                      value={selectedNode.data.description || ''}
                      onChange={(e) => updateNode(selectedNode.id, {
                        description: e.target.value
                      })}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs px-2 py-1 w-full outline-none focus:border-[#3a3a3a] resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Duration */}
                  <div className="mb-3">
                    <label className="text-[11px] text-[#666] block mb-1">
                      DURATION (SECONDS)
                    </label>
                    <input
                      type="number"
                      value={selectedNode.data.durationSec}
                      onChange={(e) => {
                        const duration = parseInt(e.target.value);
                        if (!isNaN(duration) && duration >= 0) {
                          updateNode(selectedNode.id, {
                            durationSec: duration
                          });
                        }
                      }}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs px-2 py-1 w-full outline-none focus:border-[#3a3a3a]"
                    />
                  </div>
                </>
              )}

              {isChoiceNode(selectedNode) && (
                <div>
                  <label className="text-[11px] text-[#666] block mb-2">
                    VARIABLE EFFECTS
                  </label>
                  <div className="bg-[#0f0f0f] p-2 border border-[#2a2a2a]">
                    {variables.map(v => {
                      const effect = selectedNode.data.effects[v.name] ?? 0;
                      return (
                        <div key={v.name} className="flex items-center gap-2 mb-2 last:mb-0">
                          <span className="w-20 text-[11px] text-[#666] font-mono">
                            {v.name}
                          </span>
                          <button
                            onClick={() => updateNode(selectedNode.id, {
                              effects: { ...selectedNode.data.effects, [v.name]: effect - 1 }
                            })}
                            className="w-6 h-6 bg-[#2a2a2a] border border-[#3a3a3a] text-[#999] text-sm font-medium hover:bg-[#333] transition-colors"
                          >
                            -
                          </button>
                          <span className={`w-10 text-center text-xs font-mono ${
                            effect > 0 ? 'text-green-400' : effect < 0 ? 'text-red-400' : 'text-[#666]'
                          }`}>
                            {effect > 0 ? '+' : ''}{effect}
                          </span>
                          <button
                            onClick={() => updateNode(selectedNode.id, {
                              effects: { ...selectedNode.data.effects, [v.name]: effect + 1 }
                            })}
                            className="w-6 h-6 bg-[#2a2a2a] border border-[#3a3a3a] text-[#999] text-sm font-medium hover:bg-[#333] transition-colors"
                          >
                            +
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-[#666] text-xs mb-4">
              No node selected
            </p>
            <button
              onClick={addSceneNode}
              className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#999] text-xs font-medium py-1.5 px-3 hover:border-[#4a4a4a] hover:bg-[#333] transition-colors inline-flex items-center"
            >
              <Plus size={12} className="mr-2" />
              Add Scene
            </button>
          </div>
        )}

        {/* Variables Section */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] mb-px">
          <div className="bg-[#252525] border-b border-[#0a0a0a] text-[#999] text-[11px] font-semibold uppercase tracking-wider px-3 py-2 h-8 flex items-center justify-between">
            <span>VARIABLES</span>
            <button
              onClick={addVariable}
              className="text-[#666] text-base hover:text-[#999] transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
          
          <div className="p-2">
            {variables.map(v => (
              <div key={v.name} className="flex items-center justify-between p-1.5 px-2 bg-[#0f0f0f] mb-1 border border-[#2a2a2a]">
                <span className="text-xs text-[#999] font-mono">
                  {v.name}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removeVariable(v.name)}
                    className="text-[#666] text-[10px] hover:text-red-500 transition-colors"
                  >
                    <X size={10} />
                  </button>
                  <span className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs px-2 py-1 w-[60px] text-right font-mono">
                    {v.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="h-6 bg-[#1a1a1a] border-t border-[#0a0a0a] flex items-center justify-between px-3 text-[11px] text-[#666]">
        <span>{nodes.length} nodes • {edges.length} edges</span>
        <span>{selectedNodeId ? `ID: ${selectedNodeId}` : 'Ready'}</span>
      </div>
    </div>
  );
};