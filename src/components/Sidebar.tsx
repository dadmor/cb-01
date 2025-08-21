import React, { useMemo, useState } from "react";
import { useGameStore } from "@/modules/game/store";
import { useFlowStore, isSceneNode, isChoiceNode, START_NODE_ID } from "@/modules/flow/store";
import { useVideoStore } from "@/modules/video/store";
import { VariablesManager } from "@/modules/variables";
import { VideoPreview } from "@/modules/video/VideoPreview";
import { blockSnippets } from "@/modules/flow/blockSnippets";

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

  const videoUrl = useVideoStore(state => state.videoUrl);
  const segments = useVideoStore(state => state.segments);
  
  const [selectedVideoSegmentId, setSelectedVideoSegmentId] = useState<string | null>(null);

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
    <div className="w-96 bg-white border-l border-zinc-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            {mode === "edit" ? "Edit Mode" : "Play Mode"}
            {isGameOver && " - Game Over"}
          </h2>
          
          <div className="flex gap-2">
            {mode === "edit" ? (
              <button
                onClick={() => startGame(START_NODE_ID)}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Start Game
              </button>
            ) : (
              <>
                <button
                  onClick={() => resetGame(START_NODE_ID)}
                  className="px-3 py-1 bg-zinc-600 text-white rounded text-sm hover:bg-zinc-700"
                >
                  Reset
                </button>
                <button
                  onClick={stopGame}
                  className="px-3 py-1 border border-zinc-300 rounded text-sm hover:bg-zinc-50"
                >
                  Stop
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mode === "edit" ? (
          <>
            {/* Block snippets - only show when a scene node is selected */}
            {selectedNode && isSceneNode(selectedNode) && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-700">Add Blocks</h3>
                <div className="grid grid-cols-2 gap-2">
                  {blockSnippets.map(snippet => (
                    <button
                      key={snippet.id}
                      onClick={() => addBlockSnippet(snippet.id, selectedNode.id)}
                      className="p-3 border border-zinc-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{snippet.icon}</span>
                        <span className="text-sm font-medium">{snippet.name}</span>
                      </div>
                      <p className="text-xs text-zinc-600">{snippet.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Simple add scene button when nothing is selected */}
            {!selectedNode && (
              <button
                onClick={addSceneNode}
                className="w-full p-3 border-2 border-dashed border-zinc-300 rounded-lg text-zinc-600 hover:border-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <span className="text-2xl block mb-1">+</span>
                <span className="text-sm">Add First Scene</span>
              </button>
            )}

            {/* Node editor */}
            {selectedNode && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {isSceneNode(selectedNode) ? "Scene" : "Choice"} Properties
                  </h3>
                  {selectedNode.id !== START_NODE_ID && (
                    <button
                      onClick={() => deleteNode(selectedNode.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedNode.data.label}
                    onChange={(e) => updateNode(selectedNode.id, {
                      ...selectedNode.data,
                      label: e.target.value
                    })}
                    className="w-full px-3 py-1 border border-zinc-300 rounded"
                  />
                </div>

                {isSceneNode(selectedNode) && (
                  <>
                    {/* Video segment selector */}
                    {segments.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Video Segment</label>
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
                          className="w-full px-3 py-1 border border-zinc-300 rounded"
                        >
                          <option value="">None (manual duration)</option>
                          {segments.map((seg, i) => (
                            <option key={seg.id} value={seg.id}>
                              Segment {i + 1} ({formatTime(seg.start)} - {formatTime(seg.end)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Duration (seconds)</label>
                      <input
                        type="number"
                        value={selectedNode.data.durationSec}
                        onChange={(e) => updateNode(selectedNode.id, {
                          ...selectedNode.data,
                          durationSec: parseInt(e.target.value) || 0
                        })}
                        disabled={!!selectedNode.data.videoSegmentId}
                        className="w-full px-3 py-1 border border-zinc-300 rounded disabled:bg-zinc-100"
                      />
                    </div>

                    {/* Condition */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Access Condition</label>
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
                          className="flex-1 px-3 py-1 border border-zinc-300 rounded"
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
                              className="w-16 px-2 py-1 border border-zinc-300 rounded"
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
                              className="w-16 px-2 py-1 border border-zinc-300 rounded"
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
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Default Choice (after timer)
                          </label>
                          <select
                            value={selectedNode.data.defaultChoiceId || ""}
                            onChange={(e) => updateNode(selectedNode.id, {
                              ...selectedNode.data,
                              defaultChoiceId: e.target.value || undefined
                            })}
                            className="w-full px-3 py-1 border border-zinc-300 rounded"
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
                  <div>
                    <label className="block text-sm font-medium mb-1">Effects</label>
                    <div className="space-y-2">
                      {variables.map(v => {
                        const effect = selectedNode.data.effects[v.name] || 0;
                        return (
                          <div key={v.name} className="flex items-center gap-2">
                            <span className="w-20 text-sm">{v.name}:</span>
                            <button
                              onClick={() => updateNode(selectedNode.id, {
                                ...selectedNode.data,
                                effects: { ...selectedNode.data.effects, [v.name]: effect - 1 }
                              })}
                              className="w-8 h-8 border border-zinc-300 rounded hover:bg-zinc-50"
                            >
                              -
                            </button>
                            <span className="w-12 text-center">{effect}</span>
                            <button
                              onClick={() => updateNode(selectedNode.id, {
                                ...selectedNode.data,
                                effects: { ...selectedNode.data.effects, [v.name]: effect + 1 }
                              })}
                              className="w-8 h-8 border border-zinc-300 rounded hover:bg-zinc-50"
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
            )}
          </>
        ) : (
          /* Play mode display */
          <div className="space-y-4">
            {currentNode && isSceneNode(currentNode) && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium mb-1">{currentNode.data.label}</h3>
                {currentNode.data.description && (
                  <p className="text-sm text-zinc-600">{currentNode.data.description}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Variables section */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Variables</h3>
          <div className="space-y-2">
            {variables.map(v => (
              <div key={v.name} className="flex items-center justify-between">
                <span className="text-sm">{v.name}:</span>
                <div className="flex items-center gap-2">
                  {mode === "edit" && (
                    <button
                      onClick={() => removeVariable(v.name)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      ×
                    </button>
                  )}
                  <input
                    type="number"
                    value={v.value}
                    onChange={(e) => setVariable(v.name, parseInt(e.target.value) || 0)}
                    disabled={mode === "play"}
                    className="w-16 px-2 py-1 border border-zinc-300 rounded text-sm disabled:bg-zinc-100"
                  />
                  {mode === "play" && v.value !== v.initialValue && (
                    <span className="text-xs text-zinc-500">
                      (was {v.initialValue})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {mode === "edit" && (
            <button
              onClick={() => {
                const name = prompt("Variable name:");
                if (name) {
                  addVariable(VariablesManager.createVariable(name, 0));
                }
              }}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Variable
            </button>
          )}
        </div>

        {/* Video segments section */}
        {videoUrl && segments.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Video Preview & Segments</h3>
            <VideoPreview
              videoUrl={videoUrl}
              segments={segments}
              selectedSegmentId={selectedVideoSegmentId || undefined}
              onSegmentSelect={setSelectedVideoSegmentId}
            />
            {mode === "edit" && selectedNode && isSceneNode(selectedNode) && selectedVideoSegmentId && (
              <button
                onClick={() => {
                  const segment = segments.find(s => s.id === selectedVideoSegmentId);
                  if (segment) {
                    updateNode(selectedNode.id, {
                      ...selectedNode.data,
                      videoSegmentId: segment.id,
                      durationSec: Math.round(segment.duration)
                    });
                  }
                }}
                className="mt-2 w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Assign to Selected Scene
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};