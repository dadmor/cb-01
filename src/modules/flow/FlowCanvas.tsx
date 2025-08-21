import React, { useCallback, useMemo, useRef, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ConnectionLineType,
  NodeTypes,
  OnConnect,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";

import { SceneNode } from "./nodes/SceneNode";
import { ChoiceNode } from "./nodes/ChoiceNode";
import { useFlowStore, isSceneNode, isChoiceNode } from "./store";
import { useGameStore } from "@/modules/game/store";
import { useVideoStore } from "@/modules/video/store";
import { VariablesManager } from "@/modules/variables";
import { ChoiceNode as ChoiceNodeType } from "@/types";

const nodeTypes: NodeTypes = {
  scene: SceneNode,
  choice: ChoiceNode,
};

export const FlowCanvas: React.FC = () => {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const createChoice = useFlowStore((state) => state.createChoice);
  const selectNode = useFlowStore((state) => state.selectNode);

  const mode = useGameStore((state) => state.mode);
  const currentNodeId = useGameStore((state) => state.currentNodeId);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const variables = useGameStore((state) => state.variables);
  const setCurrentNode = useGameStore((state) => state.setCurrentNode);
  const updateVariables = useGameStore((state) => state.updateVariables);
  const setGameOver = useGameStore((state) => state.setGameOver);

  const videoUrl = useVideoStore((state) => state.videoUrl);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Get current node
  const currentNode = useMemo(
    () => nodes.find((n) => n.id === currentNodeId),
    [nodes, currentNodeId]
  );

  // Handle choice click
  const handleChoiceClick = useCallback(
    (choiceNodeId: string) => {
      if (mode !== "play" || isGameOver) return;

      const choiceNode = nodes.find((n) => n.id === choiceNodeId);
      if (!choiceNode || !isChoiceNode(choiceNode)) return;

      const targetEdge = edges.find((e) => e.source === choiceNodeId);
      if (!targetEdge) return;

      const targetNode = nodes.find((n) => n.id === targetEdge.target);
      if (!targetNode || !isSceneNode(targetNode)) return;

      // Apply effects and check if target is unlocked
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

  // Enrich nodes with runtime state
  const enrichedNodes = useMemo(() => {
    return nodes.map((node) => {
      if (isSceneNode(node)) {
        const isUnlocked = VariablesManager.evaluate(
          variables,
          node.data.condition
        );
        const isCurrent = mode === "play" && node.id === currentNodeId;

        return {
          ...node,
          data: {
            ...node.data,
            isUnlocked,
            isCurrent,
            remainingMs: undefined, // Will be set by timer effect
          },
        };
      }

      if (isChoiceNode(node)) {
        // Check if this choice is available (source is current)
        const incomingEdge = edges.find((e) => e.target === node.id);
        const isAvailable =
          mode === "play" && incomingEdge?.source === currentNodeId;

        return {
          ...node,
          data: {
            ...node.data,
            isAvailable,
            onClick: () => handleChoiceClick(node.id),
          },
        };
      }

      return node;
    });
  }, [nodes, edges, mode, currentNodeId, variables, handleChoiceClick]);

  // Timer and video playback effect
  useEffect(() => {
    const cleanup = () => {
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
    };

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
    const outgoingChoices = edges
      .filter((e) => e.source === currentNode.id)
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter((n): n is ChoiceNodeType => !!n && isChoiceNode(n));

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
        let startTime = Date.now();

        intervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, videoDuration - elapsed);

          // Update node with remaining time
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
      let startTime = Date.now();

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
      // Immediate transition
      setTimeout(handleTimeout, 100);
    }

    return cleanup;
  }, [mode, isGameOver, currentNode, videoUrl, handleChoiceClick, setGameOver]);

  const onConnect: OnConnect = useCallback(
    (params) => {
      if (params.source && params.target) {
        createChoice(params.source, params.target);
      }
    },
    [createChoice]
  );

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      if (mode === "edit") {
        selectNode(nodes[0]?.id || null);
      }
    },
    [mode, selectNode]
  );

  const onPaneClick = useCallback(() => {
    if (mode === "edit") {
      selectNode(null);
    }
  }, [mode, selectNode]);

  return (
    <ReactFlow
      nodes={enrichedNodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onSelectionChange={onSelectionChange}
      onPaneClick={onPaneClick}
      connectionLineType={ConnectionLineType.SmoothStep}
      defaultEdgeOptions={{ type: "smoothstep" }}
      snapToGrid={true}
      snapGrid={[10, 10]}
      fitView
    >
      <Controls />
      <MiniMap />
      <Background  gap={10} size={1} />
    </ReactFlow>
  );
};