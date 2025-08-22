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
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { SceneNode } from "./nodes/SceneNode";
import { ChoiceNode } from "./nodes/ChoiceNode";
import { useFlowStore, useNodes, useEdges, useSelectedNodeId } from "./store";
import { useGameMode, useCurrentNodeId, useIsGameOver, setGameState } from "@/modules/game";
import { useVariables, useVariablesStore, VariablesManager } from "@/modules/variables";
import { StoryNode, SceneNode as SceneNodeType, ChoiceNode as ChoiceNodeType, isSceneNode, isChoiceNode } from "./types";

// ============= MEMOIZED NODE TYPES =============
// Tworzone RAZ, nie przy każdym renderze
const nodeTypes: NodeTypes = {
  scene: SceneNode,
  choice: ChoiceNode,
};

// ============= MEMOIZED EDGE OPTIONS =============
const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: "arrow",
  style: {
    strokeWidth: 2,
    stroke: "#52525b",
  },
};

// ============= EXTRACTED CONSTANTS =============
const SELECTED_EDGE_COLOR = "#dc2626";
const CONDITIONAL_EDGE_COLOR = "#ea580c";
const LOCKED_EDGE_COLOR = "#3f3f46";

// ============= PERFORMANCE: Wyciągnięte poza komponent =============
const getEdgeStyle = (
  isSelectedChoice: boolean,
  isConditional: boolean,
  isLocked: boolean
) => {
  if (isSelectedChoice) {
    return {
      ...defaultEdgeOptions,
      style: {
        strokeWidth: 3,
        stroke: SELECTED_EDGE_COLOR,
      },
      markerEnd: {
        type: "arrow" as const,
        color: SELECTED_EDGE_COLOR,
      },
    };
  }

  if (isConditional || isLocked) {
    const color = isLocked ? LOCKED_EDGE_COLOR : CONDITIONAL_EDGE_COLOR;
    return {
      ...defaultEdgeOptions,
      style: {
        strokeWidth: 2,
        stroke: color,
        strokeDasharray: "5 5",
        opacity: isLocked ? 0.5 : 0.7,
      },
      animated: false,
      markerEnd: {
        type: "arrow" as const,
        color,
      },
    };
  }

  return defaultEdgeOptions;
};

export const FlowCanvas: React.FC = React.memo(() => {
  // ============= STORE FUNCTIONS =============
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const createChoice = useFlowStore((state) => state.createChoice);
  const selectNode = useFlowStore((state) => state.selectNode);

  const nodes = useNodes();
  const edges = useEdges();
  const selectedNodeId = useSelectedNodeId();
  const getChoicesForScene = useFlowStore((state) => state.getChoicesForScene);

  const mode = useGameMode();
  const currentNodeId = useCurrentNodeId();
  const isGameOver = useIsGameOver();
  const { variables, applyEffects } = useVariables();

  // ============= REFS dla timerów =============
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============= MEMOIZED: Current node =============
  const currentNode = useMemo(
    () => nodes.find((n): n is SceneNodeType | ChoiceNodeType => n.id === currentNodeId),
    [nodes, currentNodeId]
  );

  // ============= MEMOIZED: Node map dla szybkiego lookup =============
  const nodeMap = useMemo(
    () => new Map(nodes.map(n => [n.id, n])),
    [nodes]
  );

  // ============= CALLBACK: Choice click handler =============
  const handleChoiceClick = useCallback(
    (choiceNodeId: string) => {
      if (mode !== "play" || isGameOver) return;

      const choiceNode = nodeMap.get(choiceNodeId);
      if (!choiceNode || !isChoiceNode(choiceNode)) return;

      const targetEdge = edges.find((e) => e.source === choiceNodeId);
      if (!targetEdge) return;

      const targetNode = nodeMap.get(targetEdge.target);
      if (!targetNode || !isSceneNode(targetNode)) return;

      applyEffects(choiceNode.data.effects);
      
      const updatedVariables = useVariablesStore.getState().variables;
      if (VariablesManager.evaluate(updatedVariables, targetNode.data.condition)) {
        setGameState({ currentNodeId: targetNode.id });
      }
    },
    [mode, isGameOver, nodeMap, edges, applyEffects]
  );

  // ============= MEMOIZED: Enriched nodes (główna optymalizacja!) =============
  const enrichedNodes = useMemo((): StoryNode[] => {
    // Jeśli nic się nie zmieniło, nie przeliczaj
    if (!nodes.length) return [];

    return nodes.map((node): StoryNode => {
      if (isSceneNode(node)) {
        const isCurrent = node.id === currentNodeId;
        const isUnlocked = mode === "edit" 
          ? !node.data.condition
          : VariablesManager.evaluate(variables, node.data.condition);

        // Tylko jeśli coś się zmieniło
        if (
          node.data.isCurrent === isCurrent &&
          node.data.isUnlocked === isUnlocked &&
          node.data.hasCondition === !!node.data.condition
        ) {
          return node; // Zwróć ten sam obiekt!
        }

        return {
          ...node,
          data: {
            ...node.data,
            isUnlocked,
            isCurrent,
            hasCondition: !!node.data.condition,
          },
        };
      }

      if (isChoiceNode(node)) {
        const incomingEdge = edges.find((e) => e.target === node.id);
        const isAvailable = mode === "play" && incomingEdge?.source === currentNodeId;
        
        // Tylko jeśli coś się zmieniło
        if (
          node.data.isAvailable === isAvailable &&
          (isAvailable ? node.data.onClick === handleChoiceClick : true)
        ) {
          return node; // Zwróć ten sam obiekt!
        }

        return {
          ...node,
          data: {
            ...node.data,
            id: node.id,
            isAvailable,
            onClick: isAvailable ? () => handleChoiceClick(node.id) : undefined,
          },
        };
      }

      return node;
    });
  }, [nodes, edges, mode, currentNodeId, variables, handleChoiceClick]);

  // ============= MEMOIZED: Enriched edges =============
  const enrichedEdges = useMemo(() => {
    return edges.map((edge) => {
      const targetNode = nodeMap.get(edge.target);
      
      const isSelectedChoice = !!selectedNodeId && 
        (edge.source === selectedNodeId || edge.target === selectedNodeId) &&
        !!nodeMap.get(selectedNodeId) &&
        isChoiceNode(nodeMap.get(selectedNodeId)!);

      const isConditional = !!(targetNode && 
        isSceneNode(targetNode) && 
        targetNode.data.condition &&
        mode === "edit");

      const isLocked = !!(targetNode &&
        isSceneNode(targetNode) &&
        targetNode.data.condition &&
        mode === "play" &&
        !VariablesManager.evaluate(variables, targetNode.data.condition));

      return {
        ...edge,
        ...getEdgeStyle(isSelectedChoice, isConditional, isLocked),
      };
    });
  }, [edges, nodeMap, variables, mode, selectedNodeId]);

  // ============= CLEANUP dla timerów =============
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // ============= TIMER EFFECT (uproszczony) =============
  useEffect(() => {
    cleanup();

    if (mode !== "play" || isGameOver || !currentNode || !isSceneNode(currentNode)) {
      return;
    }

    const sceneNode = currentNode;
    const { durationSec = 0, defaultChoiceId } = sceneNode.data;
    const outgoingChoices = getChoicesForScene(sceneNode.id);

    const handleTimeout = () => {
      if (defaultChoiceId) {
        const defaultChoice = outgoingChoices.find(c => c.id === defaultChoiceId);
        if (defaultChoice) {
          handleChoiceClick(defaultChoice.id);
        } else {
          setGameState({ isGameOver: true });
        }
      } else if (outgoingChoices.length === 0) {
        setGameState({ isGameOver: true });
      }
    };

    if (durationSec > 0) {
      const totalMs = durationSec * 1000;
      const startTime = Date.now();

      // Update remaining time
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalMs - elapsed);
        
        useFlowStore.getState().updateNode(sceneNode.id, {
          ...sceneNode.data,
          remainingMs: remaining,
        });
      }, 100);

      // Set timeout
      timeoutRef.current = setTimeout(handleTimeout, totalMs);
    } else {
      timeoutRef.current = setTimeout(handleTimeout, 100);
    }

    return cleanup;
  }, [mode, isGameOver, currentNode, handleChoiceClick, cleanup, getChoicesForScene]);

  // ============= CALLBACKS =============
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        createChoice(params.source, params.target);
      }
    },
    [createChoice]
  );

  const onSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      if (mode === "edit") {
        if (params.nodes.length > 0) {
          selectNode(params.nodes[0].id);
        } else if (params.edges.length > 0) {
          const edge = params.edges[0];
          const sourceNode = nodeMap.get(edge.source);
          const targetNode = nodeMap.get(edge.target);

          if (sourceNode && isChoiceNode(sourceNode)) {
            selectNode(sourceNode.id);
          } else if (targetNode && isChoiceNode(targetNode)) {
            selectNode(targetNode.id);
          } else {
            selectNode(null);
          }
        } else {
          selectNode(null);
        }
      }
    },
    [mode, selectNode, nodeMap]
  );

  const onPaneClick = useCallback(() => {
    if (mode === "edit") {
      selectNode(null);
    }
  }, [mode, selectNode]);

  // ============= KEYBOARD HANDLER =============
  useEffect(() => {
    if (mode !== "edit") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === "Delete" || event.key === "Backspace") && selectedNodeId) {
        event.preventDefault();
        useFlowStore.getState().deleteNode(selectedNodeId);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mode, selectedNodeId]);

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
      snapGrid={[24, 24]}
      fitView
    >
      <Controls />
      <MiniMap />
      <Background gap={24} size={1} />
    </ReactFlow>
  );
});