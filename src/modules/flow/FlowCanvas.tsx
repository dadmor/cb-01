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
import {
  ChoiceNode as ChoiceNodeType,
  SceneNode as SceneNodeType,
  StoryNode,
  isSceneNode,
  isChoiceNode,
} from "@/types";

// Define node types
const nodeTypes: NodeTypes = {
  scene: SceneNode,
  choice: ChoiceNode,
} as const;

// Default edge options
const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: "arrow",
  style: {
    strokeWidth: 2,
    stroke: "#52525b", // zinc-600
  },
};

// Helper function for edge styling
const getEdgeStyle = (
  edge: Edge,
  nodes: StoryNode[],
  variables: any,
  mode: "edit" | "play",
  selectedNodeId: string | null
) => {
  const targetNode = nodes.find((n) => n.id === edge.target);

  // Check if this edge is connected to selected choice node
  const isSelectedChoice =
    !!selectedNodeId &&
    (edge.source === selectedNodeId || edge.target === selectedNodeId) &&
    nodes.find((n) => n.id === selectedNodeId && isChoiceNode(n));

  if (isSelectedChoice) {
    return {
      ...defaultEdgeOptions,
      style: {
        strokeWidth: 3,
        stroke: "#dc2626", // red-600 color for selected
      },
      markerEnd: {
        type: "arrow" as const,
        color: "#dc2626",
      },
    };
  }

  if (targetNode && isSceneNode(targetNode) && targetNode.data.condition) {
    const isLocked =
      mode === "play"
        ? !VariablesManager.evaluate(variables, targetNode.data.condition)
        : false;

    if (mode === "edit" || isLocked) {
      return {
        ...defaultEdgeOptions,
        style: {
          strokeWidth: 2,
          stroke: mode === "edit" ? "#ea580c" : "#3f3f46", // orange in edit, gray in play
          strokeDasharray: "5 5",
          opacity: mode === "edit" ? 0.7 : 0.5,
        },
        animated: false,
        markerEnd: {
          type: "arrow" as const,
          color: mode === "edit" ? "#ea580c" : "#3f3f46",
        },
      };
    }
  }

  return defaultEdgeOptions;
};

export const FlowCanvas: React.FC = React.memo(() => {
  const nodes = useNodes();
  const edges = useEdges();
  const selectedNodeId = useSelectedNodeId();
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const createChoice = useFlowStore((state) => state.createChoice);
  const selectNode = useFlowStore((state) => state.selectNode);
  const getChoicesForScene = useFlowStore((state) => state.getChoicesForScene);

  const mode = useGameMode();
  const currentNodeId = useCurrentNodeId();
  const isGameOver = useIsGameOver();
  const { variables, applyEffects } = useVariables();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentNode = useMemo(
    () =>
      nodes.find(
        (n): n is SceneNodeType | ChoiceNodeType => n.id === currentNodeId
      ),
    [nodes, currentNodeId]
  );

  const handleChoiceClick = useCallback(
    (choiceNodeId: string) => {
      if (mode !== "play" || isGameOver) return;

      const choiceNode = nodes.find(
        (n): n is ChoiceNodeType => n.id === choiceNodeId && isChoiceNode(n)
      );
      if (!choiceNode) return;

      const targetEdge = edges.find((e) => e.source === choiceNodeId);
      if (!targetEdge) return;

      const targetNode = nodes.find(
        (n): n is SceneNodeType =>
          n.id === targetEdge.target && isSceneNode(n)
      );
      if (!targetNode) return;

      applyEffects(choiceNode.data.effects);
      
      const updatedVariables = useVariablesStore.getState().variables;
      if (VariablesManager.evaluate(updatedVariables, targetNode.data.condition)) {
        setGameState({ currentNodeId: targetNode.id });
      }
    },
    [
      mode,
      isGameOver,
      nodes,
      edges,
      applyEffects
    ]
  );

  const enrichedNodes = useMemo((): StoryNode[] => {
    return nodes.map((node): StoryNode => {
      if (isSceneNode(node)) {
        const isCurrent = node.id === currentNodeId;

        const isUnlocked =
          mode === "edit"
            ? !node.data.condition
            : VariablesManager.evaluate(variables, node.data.condition);

        const hasCondition = !!node.data.condition;

        const sceneNode: SceneNodeType = {
          ...node,
          data: {
            ...node.data,
            isUnlocked,
            isCurrent,
            hasCondition,
          },
        };
        return sceneNode;
      }

      if (isChoiceNode(node)) {
        const incomingEdge = edges.find((e) => e.target === node.id);
        const isAvailable =
          mode === "play" && incomingEdge?.source === currentNodeId;

        const choiceNode: ChoiceNodeType = {
          ...node,
          data: {
            ...node.data,
            id: node.id,
            isAvailable,
            onClick: isAvailable ? () => handleChoiceClick(node.id) : undefined,
          },
        };
        return choiceNode;
      }

      return node;
    });
  }, [nodes, edges, mode, currentNodeId, variables, handleChoiceClick]);

  const enrichedEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      ...getEdgeStyle(edge, nodes, variables, mode, selectedNodeId),
    }));
  }, [edges, nodes, variables, mode, selectedNodeId]);

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

    const sceneNode: SceneNodeType = currentNode;
    const { durationSec = 0, defaultChoiceId } = sceneNode.data;
    const outgoingChoices = getChoicesForScene(sceneNode.id);

    const handleTimeout = () => {
      if (defaultChoiceId) {
        const defaultChoice = outgoingChoices.find(
          (c) => c.id === defaultChoiceId
        );
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

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, totalMs - elapsed);

        useFlowStore.getState().updateNode(sceneNode.id, {
          ...sceneNode.data,
          remainingMs: remaining,
        });
      }, 100);

      timeoutRef.current = setTimeout(handleTimeout, totalMs);
    } else {
      timeoutRef.current = setTimeout(handleTimeout, 100);
    }

    return cleanup;
  }, [
    mode,
    isGameOver,
    currentNode,
    handleChoiceClick,
    cleanup,
    getChoicesForScene,
  ]);

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
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);

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
    [mode, selectNode, nodes]
  );

  const onPaneClick = useCallback(() => {
    if (mode === "edit") {
      selectNode(null);
    }
  }, [mode, selectNode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        mode === "edit" &&
        (event.key === "Delete" || event.key === "Backspace")
      ) {
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
      snapGrid={[24, 24]}
      fitView
    >
      <Controls />
      <MiniMap />
      <Background gap={24} size={1} />
    </ReactFlow>
  );
});