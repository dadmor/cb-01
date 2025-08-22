import React, { useMemo } from "react";
import { useGameStore } from "@/modules/game/store";
import { useFlowStore, START_NODE_ID } from "@/modules/flow/store";
import { useVideoStore } from "@/modules/video/store";
import { VariablesManager } from "@/modules/variables";
import { blockSnippets } from "@/modules/flow/blockSnippets";
import { Play, Square, RotateCcw, Plus, X } from 'lucide-react';
import { isConditionOperator, isSceneNode, isChoiceNode } from "@/types";

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

  const davinciPanelStyle = {
    backgroundColor: '#1e1e1e',
    color: '#ccc'
  };

  const davinciHeaderStyle = {
    backgroundColor: '#252525',
    borderBottom: '1px solid #0a0a0a',
    color: '#999',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    padding: '8px 12px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const davinciSectionStyle = {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    marginBottom: '1px'
  };

  const davinciInputStyle = {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    color: '#ccc',
    fontSize: '12px',
    padding: '4px 8px',
    width: '100%',
    outline: 'none'
  };

  const davinciButtonStyle = {
    backgroundColor: '#2a2a2a',
    border: '1px solid #3a3a3a',
    color: '#999',
    fontSize: '12px',
    fontWeight: 500,
    padding: '6px 12px',
    cursor: 'pointer'
  };

  const davinciButtonPrimaryStyle = {
    ...davinciButtonStyle,
    backgroundColor: '#E84E36',
    border: '1px solid #E84E36',
    color: 'white'
  };

  return (
    <div style={davinciPanelStyle} className="w-full h-full flex flex-col">
      {/* Play Controls */}
      {mode === "edit" && (
        <div style={{ padding: '12px', borderBottom: '1px solid #0a0a0a' }}>
          <button
            onClick={() => startGame(START_NODE_ID)}
            style={davinciButtonPrimaryStyle}
            className="w-full flex items-center justify-center gap-2"
          >
            <Play size={14} fill="currentColor" />
            <span>Preview Story</span>
          </button>
        </div>
      )}

      {mode === "play" && (
        <div style={{ padding: '12px', borderBottom: '1px solid #0a0a0a' }}>
          <div className="flex gap-2">
            <button
              onClick={() => resetGame(START_NODE_ID)}
              style={davinciButtonStyle}
              className="flex-1 flex items-center justify-center gap-1"
            >
              <RotateCcw size={12} />
              <span style={{ fontSize: '11px' }}>Reset</span>
            </button>
            <button
              onClick={stopGame}
              style={davinciButtonStyle}
              className="flex-1 flex items-center justify-center gap-1"
            >
              <Square size={12} fill="currentColor" />
              <span style={{ fontSize: '11px' }}>Stop</span>
            </button>
          </div>
          {currentNode && isSceneNode(currentNode) && (
            <div style={{ 
              marginTop: '12px', 
              padding: '8px', 
              backgroundColor: '#252525',
              border: '1px solid #E84E36'
            }}>
              <div style={{ fontSize: '11px', color: '#E84E36', marginBottom: '4px' }}>
                CURRENT SCENE
              </div>
              <div style={{ fontSize: '13px', color: '#ccc' }}>
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
              <div style={davinciSectionStyle}>
                <div style={davinciHeaderStyle}>
                  <span>ADD STORY BLOCKS</span>
                </div>
                <div style={{ padding: '8px' }}>
                  <div className="grid grid-cols-2 gap-2">
                    {blockSnippets.map(snippet => (
                      <button
                        key={snippet.id}
                        onClick={() => addBlockSnippet(snippet.id, selectedNode.id)}
                        style={{
                          ...davinciButtonStyle,
                          fontSize: '11px',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        className="hover:border-[#4a4a4a] hover:bg-[#333]"
                      >
                        <span style={{ fontSize: '16px', opacity: 0.6 }}>{snippet.icon}</span>
                        <span>{snippet.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Node Properties */}
            {selectedNode ? (
              <div style={davinciSectionStyle}>
                <div style={davinciHeaderStyle}>
                  <span>{isSceneNode(selectedNode) ? "SCENE" : "CHOICE"} PROPERTIES</span>
                  {selectedNode.id !== START_NODE_ID && (
                    <button
                      onClick={() => deleteNode(selectedNode.id)}
                      style={{ color: '#666', fontSize: '11px' }}
                      className="hover:text-red-500"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div style={{ padding: '12px' }}>
                  {/* Name */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>
                      NAME
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.label}
                      onChange={(e) => updateNode(selectedNode.id, {
                        ...selectedNode.data,
                        label: e.target.value
                      })}
                      style={davinciInputStyle}
                    />
                  </div>

                  {isSceneNode(selectedNode) && (
                    <>
                      {/* Video segment */}
                      {segments.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>
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
                            style={davinciInputStyle}
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
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>
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
                          style={{
                            ...davinciInputStyle,
                            opacity: selectedNode.data.videoSegmentId ? 0.5 : 1
                          }}
                        />
                      </div>

                      {/* Condition */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>
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
                            style={{ ...davinciInputStyle, flex: 1 }}
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
                                style={{ ...davinciInputStyle, width: '60px' }}
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
                                style={{ ...davinciInputStyle, width: '60px' }}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {isChoiceNode(selectedNode) && (
                    <div>
                      <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '8px' }}>
                        VARIABLE EFFECTS
                      </label>
                      <div style={{ backgroundColor: '#0f0f0f', padding: '8px', border: '1px solid #2a2a2a' }}>
                        {variables.map(v => {
                          const effect = selectedNode.data.effects[v.name] ?? 0;
                          return (
                            <div key={v.name} className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                              <span style={{ width: '80px', fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>
                                {v.name}
                              </span>
                              <button
                                onClick={() => updateNode(selectedNode.id, {
                                  ...selectedNode.data,
                                  effects: { ...selectedNode.data.effects, [v.name]: effect - 1 }
                                })}
                                style={{
                                  ...davinciButtonStyle,
                                  width: '24px',
                                  height: '24px',
                                  padding: 0,
                                  fontSize: '14px'
                                }}
                              >
                                -
                              </button>
                              <span style={{ 
                                width: '40px', 
                                textAlign: 'center', 
                                fontSize: '12px', 
                                fontFamily: 'monospace',
                                color: effect > 0 ? '#4ade80' : effect < 0 ? '#ef4444' : '#666'
                              }}>
                                {effect > 0 ? '+' : ''}{effect}
                              </span>
                              <button
                                onClick={() => updateNode(selectedNode.id, {
                                  ...selectedNode.data,
                                  effects: { ...selectedNode.data.effects, [v.name]: effect + 1 }
                                })}
                                style={{
                                  ...davinciButtonStyle,
                                  width: '24px',
                                  height: '24px',
                                  padding: 0,
                                  fontSize: '14px'
                                }}
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
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ color: '#666', fontSize: '12px', marginBottom: '16px' }}>
                  No node selected
                </p>
                <button
                  onClick={addSceneNode}
                  style={davinciButtonStyle}
                  className="hover:border-[#4a4a4a] hover:bg-[#333]"
                >
                  <Plus size={12} className="inline mr-2" />
                  Add Scene
                </button>
              </div>
            )}
          </>
        ) : (
          /* Play mode - current state display */
          <div style={{ padding: '12px' }}>
            {/* Current state info would go here */}
          </div>
        )}

        {/* Variables Section */}
        <div style={davinciSectionStyle}>
          <div style={davinciHeaderStyle}>
            <span>VARIABLES</span>
            {mode === "edit" && (
              <button
                onClick={() => {
                  const name = prompt("Variable name:");
                  if (name && !variables.find(v => v.name === name)) {
                    addVariable(VariablesManager.createVariable(name, 0));
                  }
                }}
                style={{ color: '#666', fontSize: '16px' }}
                className="hover:text-[#999]"
              >
                <Plus size={12} />
              </button>
            )}
          </div>
          
          <div style={{ padding: '8px' }}>
            {variables.map(v => (
              <div key={v.name} className="flex items-center justify-between" style={{ 
                padding: '6px 8px',
                backgroundColor: '#0f0f0f',
                marginBottom: '4px',
                border: '1px solid #2a2a2a'
              }}>
                <span style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace' }}>
                  {v.name}
                </span>
                <div className="flex items-center gap-2">
                  {mode === "edit" && (
                    <button
                      onClick={() => removeVariable(v.name)}
                      style={{ color: '#666', fontSize: '10px' }}
                      className="hover:text-red-500"
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
                    style={{
                      ...davinciInputStyle,
                      width: '60px',
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      opacity: mode === "play" ? 0.5 : 1
                    }}
                  />
                  {mode === "play" && v.value !== v.initialValue && (
                    <span style={{ fontSize: '11px', color: '#666' }}>
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
      <div style={{
        height: '24px',
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid #0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        fontSize: '11px',
        color: '#666'
      }}>
        <span>{nodes.length} nodes • {edges.length} edges</span>
        <span>{selectedNodeId ? `ID: ${selectedNodeId}` : 'Ready'}</span>
      </div>
    </div>
  );
};