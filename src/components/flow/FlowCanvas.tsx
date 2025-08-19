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

const nodeTypes = {
  main: MainNode,
  decision: DecisionNode,
};

interface FlowCanvasProps {
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;

  // kontrolowane dane z rodzica
  nodes: any[];
  edges: any[];

  // modyfikatory z rodzica (settery)
  setNodes: React.Dispatch<React.SetStateAction<any[]>>;
  setEdges: React.Dispatch<React.SetStateAction<any[]>>;

  // handlery zmian (applyNodeChanges / applyEdgeChanges z rodzica)
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  selectedNodeId, // tylko do panelu; NIE wstrzykujemy selected do węzłów!
  onNodeSelect,
  nodes,
  edges,
  setNodes,
  setEdges,
  onNodesChange,
  onEdgesChange,
}) => {
  const mode = useGameStore((s) => s.mode);
  const currentNodeId = useGameStore((s) => s.currentNodeId);

  const currentNode = useMemo(
    () => nodes.find((n) => n.id === currentNodeId),
    [nodes, currentNodeId]
  );
  const isNodeUnlocked = useIsNodeUnlocked();
  const traverseDecision = useTraverseDecision(nodes, edges);
  const { remainingMs } = useNodeRuntime(currentNode, nodes, edges);

  // Wzbogacamy dane węzłów o runtime, ale NIE ustawiamy pola `selected`.
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
            // klik decyzji tylko w trybie gry; nie rusza selekcji RF
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
  }, [
    nodes,
    edges,
    mode,
    currentNodeId,
    isNodeUnlocked,
    traverseDecision,
    remainingMs,
  ]);

  const onConnect = useCallback(
    (params) => {
      if (!params.source || !params.target) return;

      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode || sourceNode.type !== "main" || targetNode.type !== "main")
        return;
      if (sourceNode.position.x >= targetNode.position.x) return;

      const decisionId = `decision-${Date.now()}`;
      const decisionNode = {
        id: decisionId,
        type: "decision",
        position: {
          x: (sourceNode.position.x + targetNode.position.x) / 2,
          y: sourceNode.position.y + edges.filter((e) => e.source === params.source).length * 60,
        },
        data: {
          label: `Decyzja ${nodes.filter((n) => n.type === "decision").length + 1}`,
          deltas: {},
        },
      };

      const edge1 = {
        id: `e-${params.source}-${decisionId}`,
        source: params.source,
        target: decisionId,
        animated: true,
      };

      const edge2 = {
        id: `e-${decisionId}-${params.target}`,
        source: decisionId,
        target: params.target,
        animated: true,
      };

      setNodes((nds) => [...nds, decisionNode]);
      setEdges((eds) => [...eds, edge1, edge2]);
      // tylko informacyjnie do panelu – nie wpływa na wewnętrzną selekcję RF
      onNodeSelect(decisionId);
    },
    [nodes, edges, setNodes, setEdges, onNodeSelect]
  );

  // Jedyny mechanizm synchronizacji z RF: reagujemy na zmianę selekcji w RF
  const onSelectionChange = useCallback(
    ({ nodes: selected }) => {
      // w trybie edycji podpinamy panel do zaznaczonego przez RF
      if (mode === "edit") {
        onNodeSelect(selected?.[0]?.id ?? null);
      }
    },
    [mode, onNodeSelect]
  );

  // Opcjonalnie: klik w tło czyści selekcję w panelu (RF i tak sobie poradzi)
  const onPaneClick = useCallback(() => {
    if (mode === "edit") onNodeSelect(null);
  }, [mode, onNodeSelect]);

  return (
    <ReactFlow
      nodes={nodesWithState}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
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
