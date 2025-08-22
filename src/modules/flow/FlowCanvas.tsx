// src/modules/flow/FlowCanvas.tsx
import React, { useCallback, useMemo, useRef, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  ConnectionLineType,
  NodeTypes,
  OnConnect,
  Edge,
  OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { SceneNode } from "./nodes/SceneNode";
import { ChoiceNode } from "./nodes/ChoiceNode";
import { useFlowStore, useNodes, useEdges } from "./store";
import { useGameStore } from "@/modules/game/store";
import { useVideoStore } from "@/modules/video/store";
import { VariablesManager } from "@/modules/variables";
import { 
  ChoiceNode as ChoiceNodeType, 
  SceneNode as SceneNodeType, 
  StoryNode,
  isSceneNode,
  isChoiceNode
} from "@/types";

// Memoized node types - prevent recreation on every render
const nodeTypes: NodeTypes = {
  scene: SceneNode,
  choice: ChoiceNode,
} as const;

// Memoized edge options
const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: 'arrow',
  style: {
    strokeWidth: 2,
    stroke: '#6b7280',
  }
};

// Custom edge style for locked paths
const getEdgeStyle = (edge: Edge, nodes: StoryNode[], variables: any, mode: "edit" | "play") => {
  const targetNode = nodes.find(n => n.id === edge.target);
  
  if (targetNode && isSceneNode(targetNode) && targetNode.data.condition) {
    const isLocked = mode === "play" ? !VariablesManager.evaluate(variables, targetNode.data.condition) : false;
    
    if (mode === "edit" || isLocked) {
      return {
        ...defaultEdgeOptions,
        style: {
          strokeWidth: 2,
          stroke: mode === "edit" ? '#ea580c' : '#3f3f46', // orange in edit, gray in play
          strokeDasharray: '5 5',
          opacity: mode === "edit" ? 0.7 : 0.5
        },
        animated: false,
        markerEnd: {
          type: 'arrow' as const,
          color: mode === "edit" ? '#ea580c' : '#3f3f46'
        }
      };
    }
  }
  
  return defaultEdgeOptions;
};

export const FlowCanvas: React.FC = React.memo(() => {
  // Use optimized selectors
  const nodes = useNodes();
  const edges = useEdges();
  const onNodesChange = useFlowStore(state => state.onNodesChange);
  const onEdgesChange = useFlowStore(state => state.onEdgesChange);
  const createChoice = useFlowStore(state => state.createChoice);
  const selectNode = useFlowStore(state => state.selectNode);
  const getChoicesForScene = useFlowStore(state => state.getChoicesForScene);

  // Game state with specific selectors
  const mode = useGameStore(state => state.mode);
  const currentNodeId = useGameStore(state => state.currentNodeId);
  const isGameOver = useGameStore(state => state.isGameOver);
  const variables = useGameStore(state => state.variables);
  const setCurrentNode = useGameStore(state => state.setCurrentNode);
  const updateVariables = useGameStore(state => state.updateVariables);
  const setGameOver = useGameStore(state => state.setGameOver);

  const videoUrl = useVideoStore(state => state.videoUrl);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Memoize current node lookup
  const currentNode = useMemo(
    () => nodes.find((n): n is SceneNodeType | ChoiceNodeType => n.id === currentNodeId),
    [nodes, currentNodeId]
  );

  // Memoized choice click handler
  const handleChoiceClick = useCallback(
    (choiceNodeId: string) => {
      if (mode !== "play" || isGameOver) return;

      const choiceNode = nodes.find((n): n is ChoiceNodeType => 
        n.id === choiceNodeId && isChoiceNode(n)
      );
      if (!choiceNode) return;

      const targetEdge = edges.find((e) => e.source === choiceNodeId);
      if (!targetEdge) return;

      const targetNode = nodes.find((n): n is SceneNodeType => 
        n.id === targetEdge.target && isSceneNode(n)
      );
      if (!targetNode) return;

      const newVariables = VariablesManager.applyEffects(
        variables,
        choiceNode.data.effects
      );

      if (VariablesManager.evaluate(newVariables, targetNode.data.condition)) {
        updateVariables(() => newVariables);
        setCurrentNode(targetNode.id);
      }
    },
    [mode, isGameOver, nodes, edges, variables, updateVariables, setCurrentNode]
  );

  // Optimized node enrichment - shows conditions in both edit and play modes
  const enrichedNodes = useMemo((): StoryNode[] => {
    return nodes.map((node): StoryNode => {
      if (isSceneNode(node)) {
        const isCurrent = node.id === currentNodeId;
        
        // In edit mode, show condition status visually
        // In play mode, evaluate the condition
        const isUnlocked = mode === "edit" 
          ? !node.data.condition // In edit mode, unlocked means no condition
          : VariablesManager.evaluate(variables, node.data.condition);

        // Always pass condition info for visual display
        const hasCondition = !!node.data.condition;

        return {
          ...node,
          data: {
            ...node.data,
            isUnlocked,
            isCurrent,
            hasCondition, // Add this for edit mode display
          },
        };
      }

      if (isChoiceNode(node)) {
        const incomingEdge = edges.find((e) => e.target === node.id);
        const isAvailable = mode === "play" && incomingEdge?.source === currentNodeId;

        return {
          ...node,
          data: {
            ...node.data,
            isAvailable,
            onClick: isAvailable ? () => handleChoiceClick(node.id) : undefined,
          },
        };
      }

      return node;
    });
  }, [nodes, edges, mode, currentNodeId, variables, handleChoiceClick]);

  // Enrich edges with locked state styling
  const enrichedEdges = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      ...getEdgeStyle(edge, nodes, variables, mode)
    }));
  }, [edges, nodes, variables, mode]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.remove();
      videoRef.current = null;
    }
  }, []);

  // Timer effect - only when needed
  useEffect(() => {
    cleanup();

    if (
      mode !== "play" ||
      isGameOver ||
      !currentNode ||
      !isSceneNode(currentNode)
    ) {
      return;
    }

    const {
      durationSec = 0,
      videoSegmentId,
      defaultChoiceId,
    } = currentNode.data;
    
    // Use optimized selector instead of filtering
    const outgoingChoices = getChoicesForScene(currentNode.id);

    const handleTimeout = () => {
      if (defaultChoiceId) {
        const defaultChoice = outgoingChoices.find(
          (c) => c.id === defaultChoiceId
        );
        if (defaultChoice) {
          handleChoiceClick(defaultChoice.id);
        } else {
          setGameOver(true);
        }
      } else if (outgoingChoices.length === 0) {
        setGameOver(true);
      }
    };

    // Video segment playback
    if (videoSegmentId && videoUrl) {
      const segments = useVideoStore.getState().segments;
      const segment = segments.find((s) => s.id === videoSegmentId);

      if (segment) {
        videoRef.current = document.createElement("video");
        videoRef.current.src = videoUrl;
        videoRef.current.style.display = "none";
        document.body.appendChild(videoRef.current);

        videoRef.current.currentTime = segment.start;
        videoRef.current.play();

        const videoDuration = (segment.end - segment.start) * 1000;
        const startTime = Date.now();

        intervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, videoDuration - elapsed);

          useFlowStore.getState().updateNode(currentNode.id, {
            ...currentNode.data,
            remainingMs: remaining,
          });

          if (videoRef.current && videoRef.current.currentTime >= segment.end) {
            videoRef.current.pause();
          }
        }, 100);

        timeoutRef.current = setTimeout(handleTimeout, videoDuration);
        return cleanup;
      }
    }

    // Regular timer
    if (durationSec > 0) {
      const totalMs = durationSec * 1000;
      const startTime = Date.now();

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalMs - elapsed);

        useFlowStore.getState().updateNode(currentNode.id, {
          ...currentNode.data,
          remainingMs: remaining,
        });
      }, 100);

      timeoutRef.current = setTimeout(handleTimeout, totalMs);
    } else {
      setTimeout(handleTimeout, 100);
    }

    return cleanup;
  }, [mode, isGameOver, currentNode, videoUrl, handleChoiceClick, setGameOver, cleanup, getChoicesForScene]);

  // Memoized callbacks
  const onConnect: OnConnect = useCallback(
    (params) => {
      if (params.source && params.target) {
        createChoice(params.source, params.target);
      }
    },
    [createChoice]
  );

  const onSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      if (mode === "edit" && params.nodes.length > 0) {
        selectNode(params.nodes[0].id);
      } else if (mode === "edit") {
        selectNode(null);
      }
    },
    [mode, selectNode]
  );

  const onPaneClick = useCallback(() => {
    if (mode === "edit") {
      selectNode(null);
    }
  }, [mode, selectNode]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (mode === "edit" && (event.key === "Delete" || event.key === "Backspace")) {
        const selectedNodeId = useFlowStore.getState().selectedNodeId;
        if (selectedNodeId) {
          event.preventDefault();
          useFlowStore.getState().deleteNode(selectedNodeId);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mode]);

  return (
    <ReactFlow
      nodes={enrichedNodes}
      edges={enrichedEdges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onSelectionChange={onSelectionChange}
      onPaneClick={onPaneClick}
      connectionLineType={ConnectionLineType.SmoothStep}
      defaultEdgeOptions={defaultEdgeOptions}
      deleteKeyCode={null}
      snapToGrid={true}
      snapGrid={[10, 10]}
      fitView
    >
      <Controls />
      <MiniMap />
      <Background gap={10} size={1} />
    </ReactFlow>
  );
});