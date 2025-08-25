// ============================================
// src/modules/flow/FlowCanvas.tsx
// ============================================
import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  ConnectionLineType,
  NodeTypes,
  OnConnect,
  OnSelectionChangeParams,
  Connection,
  Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { SceneNode } from "./nodes/SceneNode";
import { ChoiceNode } from "./nodes/ChoiceNode";
import { isChoiceNode } from "./types";
import { useFlowStore } from "./store/useFlowStore";
import { GRID_SIZE } from "./gridHelpers";

// Rejestr typów węzłów
const nodeTypes: NodeTypes = {
  scene: SceneNode,
  choice: ChoiceNode,
};

// Spójny styl krawędzi (zawsze strzałka)
const defaultEdgeOptions = {
  type: "smoothstep" as const,
  markerEnd: { type: MarkerType.Arrow },
  style: { strokeWidth: 2, stroke: "#52525b" },
};

export const FlowCanvas: React.FC = React.memo(() => {
  const nodes = useFlowStore(s => s.nodes);
  const edges = useFlowStore(s => s.edges);
  const selectedNodeId = useFlowStore(s => s.selectedNodeId);
  const onNodesChange = useFlowStore(s => s.onNodesChange);
  const onEdgesChange = useFlowStore(s => s.onEdgesChange);
  const connect = useFlowStore(s => s.createChoice); // łączy bezpośrednio
  const selectNode = useFlowStore(s => s.selectNode);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  // Krawędzie: lekkie podświetlenie tych „dotkniętych” wybranym choice
  const enrichedEdges: Edge[] = useMemo(() => {
    if (!selectedNodeId) return edges;
    const selected = nodeMap.get(selectedNodeId);
    if (!selected || !isChoiceNode(selected)) return edges;

    return edges.map((edge) => {
      const touchesSelected =
        edge.source === selectedNodeId || edge.target === selectedNodeId;
      if (!touchesSelected) return edge;

      return {
        ...edge,
        style: { ...(edge.style ?? {}), strokeWidth: 3, stroke: "#dc2626" },
        markerEnd: { type: MarkerType.Arrow, color: "#dc2626" },
      } as Edge;
    });
  }, [edges, nodeMap, selectedNodeId]);

  // Nowe połączenie → zwykła krawędź
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        connect(params.source, params.target);
      }
    },
    [connect]
  );

  // Zmiana selekcji: prosto — zaznaczono node → zapisz; krawędź → czyść
  const onSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      if (params.nodes.length > 0) {
        selectNode(params.nodes[0].id);
      } else {
        selectNode(null);
      }
    },
    [selectNode]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={enrichedEdges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onSelectionChange={onSelectionChange}
      connectionLineType={ConnectionLineType.SmoothStep}
      defaultEdgeOptions={defaultEdgeOptions}
      // KLUCZOWE: natywne usuwanie węzłów i krawędzi; Start ma deletable: false, więc nie zniknie
      deleteKeyCode={["Delete", "Backspace"]}
      snapToGrid
      snapGrid={[GRID_SIZE, GRID_SIZE]}
      fitView
    >
      <Controls />
      <MiniMap />
      <Background gap={GRID_SIZE} size={1} />
    </ReactFlow>
  );
});
