// ------ src/components/flow/FlowCanvas.tsx ------
import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ConnectionLineType,
  MarkerType,
  OnConnect,
  OnSelectionChangeFunc,
  NodeTypes,
  NodeDragHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { DecisionNode, MainNode } from "./nodes";
import { useGameStore } from "@/gameStore";
import { useIsNodeUnlocked, useNodeRuntime, useTraverseDecision } from "./hooks";
import { useFlowStore, isMainNode, isDecisionNode } from "@/flowStore";
import { FlowNode, MainNodeData, DecisionNodeData } from "@/types";

const nodeTypes: NodeTypes = {
  main: MainNode,
  decision: DecisionNode,
};

// Rozmiar siatki do przyciągania
const GRID_SIZE = 16;

// Funkcja pomocnicza do przyciągania do siatki
const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
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

  // Enrich node data with runtime state (without selected field!)
  const nodesWithState = useMemo(() => {
    return nodes.map((node): FlowNode => {
      const isUnlocked = isNodeUnlocked(node);
      const isCurrent = mode === "play" && node.id === currentNodeId;

      if (isDecisionNode(node)) {
        const incomingEdge = edges.find((e) => e.target === node.id);
        const sourceIsCurrent =
          mode === "play" && incomingEdge && incomingEdge.source === currentNodeId;
        const outgoingEdge = edges.find((e) => e.source === node.id);
        const targetNode = outgoingEdge
          ? nodes.find((n) => n.id === outgoingEdge.target)
          : null;
        const targetUnlocked = targetNode ? isNodeUnlocked(targetNode) : false;

        const enrichedData: DecisionNodeData = {
          ...node.data,
          isAvailable: sourceIsCurrent && targetUnlocked,
          onClick: () => traverseDecision(node.id),
        };

        return {
          ...node,
          data: enrichedData,
        };
      }

      // Main node
      const enrichedData: MainNodeData = {
        ...node.data,
        isUnlocked,
        isCurrent,
        remainingMs: isCurrent ? remainingMs : undefined,
      };

      return {
        ...node,
        data: enrichedData,
      };
    });
  }, [nodes, edges, mode, currentNodeId, isNodeUnlocked, traverseDecision, remainingMs]);

  const onConnect: OnConnect = useCallback(
    (params) => {
      if (!params?.source || !params?.target) return;
      const createdId = insertDecisionBetweenMainNodes(params.source, params.target);
      if (createdId) {
        // Just for info panel
        setSelectedNode(createdId);
      }
    },
    [insertDecisionBetweenMainNodes, setSelectedNode]
  );

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: selected }) => {
      if (mode === "edit") {
        setSelectedNode(selected?.[0]?.id ?? null);
      }
    },
    [mode, setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    if (mode === "edit") setSelectedNode(null);
  }, [mode, setSelectedNode]);

  // Handler dla przeciągania węzłów - przyciąganie do siatki
  const onNodeDrag: NodeDragHandler = useCallback((event, node) => {
    // Podczas przeciągania możemy opcjonalnie pokazać podgląd pozycji
    // ale faktyczne przyciąganie nastąpi przy onNodeDragStop
  }, []);

  // Handler dla zakończenia przeciągania - przyciągnij do siatki
  const onNodeDragStop: NodeDragHandler = useCallback((event, node) => {
    const snappedPosition = {
      x: snapToGrid(node.position.x),
      y: snapToGrid(node.position.y),
    };

    // Aktualizuj pozycję węzła jeśli się zmieniła
    if (snappedPosition.x !== node.position.x || snappedPosition.y !== node.position.y) {
      applyNodesChange([
        {
          type: 'position',
          id: node.id,
          position: snappedPosition,
        },
      ]);
    }
  }, [applyNodesChange]);

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
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
      connectionLineType={ConnectionLineType.SmoothStep}
      connectionLineStyle={{ stroke: "#10b981" }}
      defaultEdgeOptions={{ 
        type: "smoothstep", 
        markerEnd: { type: MarkerType.ArrowClosed } 
      }}
      fitView
      // Włącz przyciąganie do siatki
      snapToGrid
      snapGrid={[GRID_SIZE, GRID_SIZE]}
    >
      <Controls />
      <MiniMap style={{ height: 120 }} zoomable pannable />
      <Background gap={GRID_SIZE} size={1} />
    </ReactFlow>
  );
};