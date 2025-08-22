import React, { useMemo } from "react";
import { useGameMode, useIsGameOver, useCurrentNodeId, GameService } from "@/modules/game";
import { useVariables, useVariablesStore, VariablesManager } from "@/modules/variables";
import { useFlowStore, START_NODE_ID } from "@/modules/flow/store";
import { isSceneNode, isChoiceNode } from "@/modules/flow/types";
import { isConditionOperator } from "@/modules/variables/types";
import { useVideoStore } from "@/modules/video/store";
import { blockSnippets } from "@/modules/flow/blockSnippets";
import { Play, Square, RotateCcw, Plus, X } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const mode = useGameMode();
  const isGameOver = useIsGameOver();
  const currentNodeId = useCurrentNodeId();
  
  const { variables, setVariable } = useVariables();
  const variablesStore = useVariablesStore();
  
  const nodes = useFlowStore(state => state.nodes);
  const edges = useFlowStore(state => state.edges);
  const selectedNodeId = useFlowStore(state => state.selectedNodeId);
  const addSceneNode = useFlowStore(state => state.addSceneNode);
  const addBlockSnippet = useFlowStore(state => state.addBlockSnippet);
  const updateNode = useFlowStore(state => state.updateNode);
  const deleteNode = useFlowStore(state => state.deleteNode);

  const segments = useVideoStore(state => state.segments);
  const selectedSegmentId = useVideoStore(state => state.selectedSegmentId);

  const selectedNode = useMemo(
    () => nodes.find(n => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  const currentNode = useMemo(
    () => nodes.find(n => n.id === currentNodeId),
    [nodes, currentNodeId]
  );

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addVariable = () => {
    const name = prompt("Variable name:");
    if (name && !variables.find(v => v.name === name)) {
      variablesStore.setState(state => ({
        variables: [...state.variables, VariablesManager.createVariable(name, 0)]
      }));
    }
  };

  const removeVariable = (name: string) => {
    variablesStore.setState(state => ({
      variables: state.variables.filter(v => v.name !== name)
    }));
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] text-[#ccc]">
      {/* Play Controls */}
      {mode === "edit" && (
        <div className="p-3 border-b border-[#0a0a0a]">
          <button
            onClick={() => GameService.startGame(START_NODE_ID)}
            className="w-full flex items-center justify-center gap-2 bg-[#E84E36] border border-[#E84E36] text-white text-xs font-medium py-1.5 px-3 hover:bg-[#d63d2a] transition-colors"
          >
            <Play size={14} fill="currentColor" />
            <span>Preview Story</span>
          </button>
        </div>
      )}

      {mode === "play" && (
        <div className="p-3 border-b border-[#0a0a0a]">
          <div className="flex gap-2">
            <button
              onClick={() => GameService.startGame(START_NODE_ID)}
              className="flex-1 flex items-center justify-center gap-1 bg-[#2a2a2a] border border-[#3a3a3a] text-[#999] text-[11px] font-medium py-1.5 px-3 hover:bg-[#333] hover:text-white transition-colors"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
            <button
              onClick={() => GameService.stopGame()}
              className="flex-1 flex items-center justify-center gap-1 bg-[#2a2a2a] border border-[#3a3a3a] text-[#999] text-[11px] font-medium py-1.5 px-3 hover:bg-[#333] hover:text-white transition-colors"
            >
              <Square size={12} fill="currentColor" />
              <span>Stop</span>
            </button>
          </div>
          {currentNode && isSceneNode(currentNode) && (
            <div className="mt-3 p-2 bg-[#252525] border border-[#E84E36]">
              <div className="text-[11px] text-[#E84E36] mb-1">
                CURRENT SCENE
              </div>
              <div className="text-[13px] text-[#ccc]">
                {currentNode.data.label}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {mode === "edit" ? (
          <>
            {/* Add Blocks - only when scene selected */}
            {selectedNode && isSceneNode(selectedNode) && (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] mb-px">
                <div className="bg-[#252525] border-b border-[#0a0a0a] text-[#999] text-[11px] font-semibold uppercase tracking-wider px-3 py-2 h-8 flex items-center justify-between">
                  <span>ADD STORY BLOCKS</span>
                </div>
                <div className="p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {blockSnippets.map(snippet => (
                      <button
                        key={snippet.id}
                        onClick={() => addBlockSnippet(snippet.id, selectedNode.id)}
                        className="bg-[#2a2a2a] border border-[#3a3a3a] text-[#999] text-[11px] font-medium p-2 flex flex-col items-center gap-1 hover:border-[#4a4a4a] hover:bg-[#333] transition-colors"
                      >
                        <span className="text-base opacity-60">{snippet.icon}</span>
                        <span>{snippet.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
                        ...selectedNode.data,
                        label: e.target.value
                      })}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs px-2 py-1 w-full outline-none focus:border-[#3a3a3a]"
                    />
                  </div>

                  {isSceneNode(selectedNode) && (
                    <>
                      {/* Video segment */}
                      {segments.length > 0 && (
                        <div className="mb-3">
                          <label className="text-[11px] text-[#666] block mb-1">
                            VIDEO SEGMENT
                          </label>
                          <select
                            value={selectedNode.data.videoSegmentId || ""}
                            onChange={(e) => {
                              const segmentId = e.target.value;
                              const segment = segmentId ? segments.find(s => s.id === segmentId) : undefined;
                              
                              updateNode(selectedNode.id, {
                                ...selectedNode.data,
                                videoSegmentId: segment?.id,
                                durationSec: segment ? Math.round(segment.duration) : selectedNode.data.durationSec
                              });
                            }}
                            className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs px-2 py-1 w-full outline-none focus:border-[#3a3a3a]"
                          >
                            <option value="">None (manual duration)</option>
                            {segments.map((seg, i) => (
                              <option key={seg.id} value={seg.id}>
                                {seg.label || `Region ${String(i + 1).padStart(2, '0')}`} ({formatTime(seg.start)} - {formatTime(seg.end)})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

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
                                ...selectedNode.data,
                                durationSec: duration
                              });
                            }
                          }}
                          disabled={!!selectedNode.data.videoSegmentId}
                          className={`bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs px-2 py-1 w-full outline-none focus:border-[#3a3a3a] ${
                            selectedNode.data.videoSegmentId ? 'opacity-50' : ''
                          }`}
                        />
                      </div>

                      {/* Condition */}
                      <div className="mb-3">
                        <label className="text-[11px] text-[#666] block mb-1">
                          ACCESS CONDITION
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={selectedNode.data.condition?.varName || ""}
                            onChange={(e) => updateNode(selectedNode.id, {
                              ...selectedNode.data,
                              condition: e.target.value ? {
                                varName: e.target.value,
                                op: selectedNode.data.condition?.op || "gte",
                                value: selectedNode.data.condition?.value || 1
                              } : undefined
                            })}
                            className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs px-2 py-1 flex-1 outline-none focus:border-[#3a3a3a]"
                          >
                            <option value="">Always accessible</option>
                            {variables.map(v => (
                              <option key={v.name} value={v.name}>{v.name}</option>
                            ))}
                          </select>
                          
                          {selectedNode.data.condition && (
                            <>
                              <select
                                value={selectedNode.data.condition.op}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (isConditionOperator(value) && selectedNode.data.condition) {
                                    updateNode(selectedNode.id, {
                                      ...selectedNode.data,
                                      condition: {
                                        ...selectedNode.data.condition,
                                        op: value
                                      }
                                    });
                                  }
                                }}
                                className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs px-2 py-1 w-[60px] outline-none focus:border-[#3a3a3a]"
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
                                value={selectedNode.data.condition.value}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (!isNaN(value) && selectedNode.data.condition) {
                                    updateNode(selectedNode.id, {
                                      ...selectedNode.data,
                                      condition: {
                                        ...selectedNode.data.condition,
                                        value
                                      }
                                    });
                                  }
                                }}
                                className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs px-2 py-1 w-[60px] outline-none focus:border-[#3a3a3a]"
                              />
                            </>
                          )}
                        </div>
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
                                  ...selectedNode.data,
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
                                  ...selectedNode.data,
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
          </>
        ) : (
          /* Play mode - current state display */
          <div className="p-3">
            {/* Current state info would go here */}
          </div>
        )}

        {/* Variables Section */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] mb-px">
          <div className="bg-[#252525] border-b border-[#0a0a0a] text-[#999] text-[11px] font-semibold uppercase tracking-wider px-3 py-2 h-8 flex items-center justify-between">
            <span>VARIABLES</span>
            {mode === "edit" && (
              <button
                onClick={addVariable}
                className="text-[#666] text-base hover:text-[#999] transition-colors"
              >
                <Plus size={12} />
              </button>
            )}
          </div>
          
          <div className="p-2">
            {variables.map(v => (
              <div key={v.name} className="flex items-center justify-between p-1.5 px-2 bg-[#0f0f0f] mb-1 border border-[#2a2a2a]">
                <span className="text-xs text-[#999] font-mono">
                  {v.name}
                </span>
                <div className="flex items-center gap-2">
                  {mode === "edit" && (
                    <button
                      onClick={() => removeVariable(v.name)}
                      className="text-[#666] text-[10px] hover:text-red-500 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  )}
                  <input
                    type="number"
                    value={v.value}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value)) {
                        setVariable(v.name, value);
                      }
                    }}
                    disabled={mode === "play"}
                    className={`bg-[#1a1a1a] border border-[#2a2a2a] text-[#ccc] text-xs px-2 py-1 w-[60px] text-right font-mono outline-none focus:border-[#3a3a3a] ${
                      mode === "play" ? 'opacity-50' : ''
                    }`}
                  />
                  {mode === "play" && v.value !== v.initialValue && (
                    <span className="text-[11px] text-[#666]">
                      ({v.initialValue})
                    </span>
                  )}
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