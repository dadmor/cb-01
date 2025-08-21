import React, { useMemo } from "react";
import { useGameStore } from "@/modules/game/store";
import { useFlowStore, isSceneNode, isChoiceNode, START_NODE_ID } from "@/modules/flow/store";
import { useVideoStore } from "@/modules/video/store";
import { VariablesManager } from "@/modules/variables";
import { blockSnippets } from "@/modules/flow/blockSnippets";
import { Play, Square, RotateCcw, Plus, X } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const mode = useGameStore(state => state.mode);
  const isGameOver = useGameStore(state => state.isGameOver);
  const currentNodeId = useGameStore(state => state.currentNodeId);
  const variables = useGameStore(state => state.variables);
  const startGame = useGameStore(state => state.startGame);
  const stopGame = useGameStore(state => state.stopGame);
  const resetGame = useGameStore(state => state.resetGame);
  const setVariable = useGameStore(state => state.setVariable);
  const addVariable = useGameStore(state => state.addVariable);
  const removeVariable = useGameStore(state => state.removeVariable);

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

  return (
    <div className="w-full bg-zinc-900 border-l border-zinc-800 flex flex-col h-full text-zinc-200">
      {/* Header */}
      <div className="h-10 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xs font-medium text-zinc-400">
          {mode === "edit" ? "Inspector" : "Play Mode"}
          {isGameOver && " - Game Over"}
        </h2>
        
        <div className="flex gap-1">
          {mode === "edit" ? (
            <button
              onClick={() => startGame(START_NODE_ID)}
              className="px-2 py-1 bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Play size={12} fill="currentColor" />
              Play
            </button>
          ) : (
            <>
              <button
                onClick={() => resetGame(START_NODE_ID)}
                className="px-2 py-1 text-zinc-500 text-xs hover:text-zinc-300 transition-colors flex items-center gap-1"
              >
                <RotateCcw size={12} />
                Reset
              </button>
              <button
                onClick={stopGame}
                className="px-2 py-1 text-zinc-500 text-xs hover:text-zinc-300 transition-colors flex items-center gap-1"
              >
                <Square size={12} fill="currentColor" />
                Stop
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {mode === "edit" ? (
          <>
            {/* Block snippets - only show when a scene node is selected */}
            {selectedNode && isSceneNode(selectedNode) && (
              <div className="border-b border-zinc-800/50">
                <div className="px-4 py-2 border-b border-zinc-800/50">
                  <h3 className="text-xs font-medium text-zinc-600 uppercase tracking-wider">Add Blocks</h3>
                </div>
                <div className="p-2 grid grid-cols-2 gap-1">
                  {blockSnippets.map(snippet => (
                    <button
                      key={snippet.id}
                      onClick={() => addBlockSnippet(snippet.id, selectedNode.id)}
                      className="p-2 text-left hover:bg-zinc-850 transition-colors group"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm opacity-50 group-hover:opacity-100">{snippet.icon}</span>
                        <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300">{snippet.name}</span>
                      </div>
                      <p className="text-xs text-zinc-700 line-clamp-1">{snippet.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Node editor */}
            {selectedNode ? (
              <div>
                <div className="px-4 py-2 border-b border-zinc-800/50 flex items-center justify-between">
                  <h3 className="text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    {isSceneNode(selectedNode) ? "Scene" : "Choice"} Properties
                  </h3>
                  {selectedNode.id !== START_NODE_ID && (
                    <button
                      onClick={() => deleteNode(selectedNode.id)}
                      className="text-xs text-zinc-700 hover:text-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div className="space-y-px">
                  {/* Name */}
                  <div className="px-4 py-2 border-b border-zinc-800/50">
                    <label className="block text-xs text-zinc-600 mb-1">Name</label>
                    <input
                      type="text"
                      value={selectedNode.data.label}
                      onChange={(e) => updateNode(selectedNode.id, {
                        ...selectedNode.data,
                        label: e.target.value
                      })}
                      className="w-full px-0 py-0.5 bg-transparent border-b border-zinc-800 text-xs text-zinc-300 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  {isSceneNode(selectedNode) && (
                    <>
                      {/* Video segment selector */}
                      {segments.length > 0 && (
                        <div className="px-4 py-2 border-b border-zinc-800/50">
                          <label className="block text-xs text-zinc-600 mb-1">Video Segment</label>
                          <select
                            value={selectedNode.data.videoSegmentId || ""}
                            onChange={(e) => {
                              const segment = segments.find(s => s.id === e.target.value);
                              updateNode(selectedNode.id, {
                                ...selectedNode.data,
                                videoSegmentId: segment?.id,
                                durationSec: segment ? Math.round(segment.duration) : selectedNode.data.durationSec
                              });
                            }}
                            className="w-full px-0 py-0.5 bg-transparent border-b border-zinc-800 text-xs text-zinc-300 focus:border-blue-600 focus:outline-none"
                          >
                            <option value="">None (manual duration)</option>
                            {segments.map((seg, i) => (
                              <option key={seg.id} value={seg.id}>
                                {seg.label || `Region ${String(i + 1).padStart(2, '0')}`} ({formatTime(seg.start)} - {formatTime(seg.end)})
                              </option>
                            ))}
                          </select>
                          
                          {/* Quick assign button if segment is selected in regions panel */}
                          {selectedSegmentId && !selectedNode.data.videoSegmentId && (
                            <button
                              onClick={() => {
                                const segment = segments.find(s => s.id === selectedSegmentId);
                                if (segment) {
                                  updateNode(selectedNode.id, {
                                    ...selectedNode.data,
                                    videoSegmentId: segment.id,
                                    durationSec: Math.round(segment.duration)
                                  });
                                }
                              }}
                              className="mt-1.5 w-full px-2 py-1 text-xs text-blue-500 hover:text-blue-400 transition-colors"
                            >
                              ← Use Selected Region
                            </button>
                          )}
                        </div>
                      )}

                      {/* Duration */}
                      <div className="px-4 py-2 border-b border-zinc-800/50">
                        <label className="block text-xs text-zinc-600 mb-1">Duration (seconds)</label>
                        <input
                          type="number"
                          value={selectedNode.data.durationSec}
                          onChange={(e) => updateNode(selectedNode.id, {
                            ...selectedNode.data,
                            durationSec: parseInt(e.target.value) || 0
                          })}
                          disabled={!!selectedNode.data.videoSegmentId}
                          className="w-full px-0 py-0.5 bg-transparent border-b border-zinc-800 text-xs text-zinc-300 focus:border-blue-600 focus:outline-none disabled:opacity-50"
                        />
                      </div>

                      {/* Condition */}
                      <div className="px-4 py-2 border-b border-zinc-800/50">
                        <label className="block text-xs text-zinc-600 mb-1">Access Condition</label>
                        <div className="flex gap-1">
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
                            className="flex-1 px-0 py-0.5 bg-transparent border-b border-zinc-800 text-xs text-zinc-300 focus:border-blue-600 focus:outline-none"
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
                                onChange={(e) => updateNode(selectedNode.id, {
                                  ...selectedNode.data,
                                  condition: {
                                    ...selectedNode.data.condition!,
                                    op: e.target.value as any
                                  }
                                })}
                                className="w-12 px-0 py-0.5 bg-transparent border-b border-zinc-800 text-xs text-zinc-300 focus:border-blue-600 focus:outline-none text-center"
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
                                onChange={(e) => updateNode(selectedNode.id, {
                                  ...selectedNode.data,
                                  condition: {
                                    ...selectedNode.data.condition!,
                                    value: parseInt(e.target.value) || 0
                                  }
                                })}
                                className="w-12 px-0 py-0.5 bg-transparent border-b border-zinc-800 text-xs text-zinc-300 focus:border-blue-600 focus:outline-none text-center"
                              />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Default choice */}
                      {(() => {
                        const choices = edges
                          .filter(e => e.source === selectedNode.id)
                          .map(e => nodes.find(n => n.id === e.target))
                          .filter(n => n && isChoiceNode(n));
                        
                        return choices.length > 0 && (
                          <div className="px-4 py-3 border-b border-zinc-800">
                            <label className="block text-xs text-zinc-500 mb-1.5">
                              Default Choice (after timer)
                            </label>
                            <select
                              value={selectedNode.data.defaultChoiceId || ""}
                              onChange={(e) => updateNode(selectedNode.id, {
                                ...selectedNode.data,
                                defaultChoiceId: e.target.value || undefined
                              })}
                              className="w-full px-2 py-1 bg-zinc-900 border-b border-zinc-700 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">End game</option>
                              {choices.map(c => c && (
                                <option key={c.id} value={c.id}>{c.data.label}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {isChoiceNode(selectedNode) && (
                    <div className="px-4 py-2 border-b border-zinc-800/50">
                      <label className="block text-xs text-zinc-600 mb-1">Effects</label>
                      <div className="space-y-1">
                        {variables.map(v => {
                          const effect = selectedNode.data.effects[v.name] || 0;
                          return (
                            <div key={v.name} className="flex items-center gap-2">
                              <span className="w-16 text-xs text-zinc-500 font-mono">{v.name}</span>
                              <button
                                onClick={() => updateNode(selectedNode.id, {
                                  ...selectedNode.data,
                                  effects: { ...selectedNode.data.effects, [v.name]: effect - 1 }
                                })}
                                className="w-5 h-5 text-zinc-600 hover:text-zinc-400 transition-colors"
                              >
                                -
                              </button>
                              <span className="w-10 text-center text-xs font-mono text-zinc-400">{effect}</span>
                              <button
                                onClick={() => updateNode(selectedNode.id, {
                                  ...selectedNode.data,
                                  effects: { ...selectedNode.data.effects, [v.name]: effect + 1 }
                                })}
                                className="w-5 h-5 text-zinc-600 hover:text-zinc-400 transition-colors"
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
              /* No selection */
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-zinc-700 mb-3">No node selected</p>
                <button
                  onClick={addSceneNode}
                  className="px-3 py-1.5 text-xs text-zinc-600 border border-dashed border-zinc-800 hover:border-zinc-700 hover:text-zinc-500 transition-colors"
                >
                  <Plus size={12} className="inline mr-1" />
                  Add Scene
                </button>
              </div>
            )}
          </>
        ) : (
          /* Play mode display */
          <div className="px-4 py-3">
            {currentNode && isSceneNode(currentNode) && (
              <div className="p-2 bg-zinc-850 border-l-2 border-blue-600/50">
                <h3 className="font-medium text-xs mb-0.5 text-zinc-300">{currentNode.data.label}</h3>
                {currentNode.data.description && (
                  <p className="text-xs text-zinc-600">{currentNode.data.description}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Variables section */}
        <div className="border-t border-zinc-800/50">
          <div className="px-4 py-2 border-b border-zinc-800/50 flex items-center justify-between">
            <h3 className="text-xs font-medium text-zinc-600 uppercase tracking-wider">Variables</h3>
            {mode === "edit" && (
              <button
                onClick={() => {
                  const name = prompt("Variable name:");
                  if (name && !variables.find(v => v.name === name)) {
                    addVariable(VariablesManager.createVariable(name, 0));
                  }
                }}
                className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors"
              >
                <Plus size={12} className="inline" />
              </button>
            )}
          </div>
          
          <div className="py-1">
            {variables.map(v => (
              <div key={v.name} className="px-4 py-1 flex items-center justify-between hover:bg-zinc-850/30">
                <span className="text-xs text-zinc-500 font-mono">{v.name}</span>
                <div className="flex items-center gap-1">
                  {mode === "edit" && (
                    <button
                      onClick={() => removeVariable(v.name)}
                      className="text-xs text-zinc-700 hover:text-red-500 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  )}
                  <input
                    type="number"
                    value={v.value}
                    onChange={(e) => setVariable(v.name, parseInt(e.target.value) || 0)}
                    disabled={mode === "play"}
                    className="w-12 px-1 py-0 bg-transparent border-b border-zinc-800 text-xs font-mono text-zinc-400 text-right focus:border-blue-600 focus:outline-none disabled:opacity-50"
                  />
                  {mode === "play" && v.value !== v.initialValue && (
                    <span className="text-xs text-zinc-700">
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
      <div className="h-6 bg-zinc-900 border-t border-zinc-800 px-4 flex items-center justify-between flex-shrink-0">
        <span className="text-xs text-zinc-600">
          {nodes.length} nodes • {edges.length} edges
        </span>
        <span className="text-xs text-zinc-700">
          {selectedNodeId ? `ID: ${selectedNodeId}` : 'Ready'}
        </span>
      </div>
    </div>
  );
};