// ------ src/components/flow/FlowCanvas.tsx ------
import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ConnectionLineType,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { DecisionNode, MainNode } from "./nodes";
import { useGameStore } from "@/gameStore";
import { useIsNodeUnlocked, useNodeRuntime, useTraverseDecision } from "./hooks";
import { useFlowStore } from "@/flowStore";

const nodeTypes = {
  main: MainNode,
  decision: DecisionNode,
};

export const FlowCanvas: React.FC = () => {
  const mode = useGameStore((s) => s.mode);
  const currentNodeId = useGameStore((s) => s.currentNodeId);

  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const applyNodesChange = useFlowStore((s) => s.applyNodesChange);
  const applyEdgesChange = useFlowStore((s) => s.applyEdgesChange);
  const setSelectedNode = useFlowStore((s) => s.setSelectedNode);
  const insertDecisionBetweenMainNodes = useFlowStore(
    (s) => s.insertDecisionBetweenMainNodes
  );

  const currentNode = useMemo(
    () => nodes.find((n) => n.id === currentNodeId),
    [nodes, currentNodeId]
  );

  const isNodeUnlocked = useIsNodeUnlocked();
  const traverseDecision = useTraverseDecision(nodes, edges);
  const { remainingMs } = useNodeRuntime(currentNode, nodes, edges);

  // wzbogacamy dane węzłów o runtime/stan (bez pola selected!)
  const nodesWithState = useMemo(() => {
    return nodes.map((node) => {
      const isUnlocked = isNodeUnlocked(node);
      const isCurrent = mode === "play" && node.id === currentNodeId;

      if (node.type === "decision") {
        const incomingEdge = edges.find((e) => e.target === node.id);
        const sourceIsCurrent =
          mode === "play" && incomingEdge && incomingEdge.source === currentNodeId;
        const outgoingEdge = edges.find((e) => e.source === node.id);
        const targetNode = outgoingEdge
          ? nodes.find((n) => n.id === outgoingEdge.target)
          : null;
        const targetUnlocked = targetNode ? isNodeUnlocked(targetNode) : false;

        return {
          ...node,
          data: {
            ...node.data,
            isAvailable: sourceIsCurrent && targetUnlocked,
            onClick: () => traverseDecision(node.id),
          },
        };
      }

      return {
        ...node,
        data: {
          ...node.data,
          isUnlocked,
          isCurrent,
          remainingMs: isCurrent ? remainingMs : undefined,
        },
      };
    });
  }, [nodes, edges, mode, currentNodeId, isNodeUnlocked, traverseDecision, remainingMs]);

  const onConnect = useCallback(
    (params: any) => {
      if (!params?.source || !params?.target) return;
      const createdId = insertDecisionBetweenMainNodes(params.source, params.target);
      if (createdId) {
        // tylko informacyjnie do panelu
        setSelectedNode(createdId);
      }
    },
    [insertDecisionBetweenMainNodes, setSelectedNode]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selected }: any) => {
      if (mode === "edit") {
        setSelectedNode(selected?.[0]?.id ?? null);
      }
    },
    [mode, setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    if (mode === "edit") setSelectedNode(null);
  }, [mode, setSelectedNode]);

  return (
    <ReactFlow
      nodes={nodesWithState}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={applyNodesChange}
      onEdgesChange={applyEdgesChange}
      onConnect={onConnect}
      onSelectionChange={onSelectionChange}
      onPaneClick={onPaneClick}
      connectionLineType={ConnectionLineType.SmoothStep}
      connectionLineStyle={{ stroke: "#10b981" }}
      defaultEdgeOptions={{ type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } }}
      fitView
    >
      <Controls />
      <MiniMap style={{ height: 120 }} zoomable pannable />
      <Background gap={16} size={1} />
    </ReactFlow>
  );
};
