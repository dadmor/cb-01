// ============================================
// src/modules/flow/FlowCanvas.tsx
// ============================================
import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  ConnectionLineType,
  NodeTypes,
  OnConnect,
  Connection,
  Edge,
  MarkerType,
  useOnSelectionChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { SceneNode } from "./nodes/SceneNode";
import { ChoiceNode } from "./nodes/ChoiceNode";
import { isChoiceNode } from "./types";
import { useFlowStore } from "./store/useFlowStore";
import { GRID_SIZE } from "./gridHelpers";

// ================== Stałe, STABILNE REFERENCJE ==================
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

// snapGrid i deleteKeyCode jako stałe (nie tworzymy nowych arrayów co render)
const SNAP_GRID: [number, number] = [GRID_SIZE, GRID_SIZE];
const DELETE_KEYS = ["Delete", "Backspace"] as const;

// ================== Bridge osadzony w TYM PLIKU ==================
// Sibling dla <ReactFlow /> – działa w ramach <ReactFlowProvider />
const SelectionBridge: React.FC = () => {
  const selectNode = useFlowStore((s) => s.selectNode);

  const onChange = useCallback(({ nodes }: { nodes: any[]; edges: any[] }) => {
    // tylko pierwszego node'a bierzemy pod uwagę
    const nextId = nodes.length > 0 ? nodes[0].id : null;
    // store ma już strażnik – ale i tak optymalnie nie wołać set bez potrzeby
    selectNode(nextId);
  }, [selectNode]);

  // WAŻNE: handler musi być memoizowany (zalecenie z dokumentacji)
  useOnSelectionChange({ onChange });
  return null;
};

// ================== Canvas ==================
export const FlowCanvas: React.FC = React.memo(() => {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const connect = useFlowStore((s) => s.createChoice);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Podświetlanie krawędzi DOTKNIĘTYCH wybranym choice – bez zbędnych nowych referencji:
  const enrichedEdges: Edge[] = useMemo(() => {
    if (!selectedNodeId) return edges; // referencja bez zmian
    const selected = nodeMap.get(selectedNodeId);
    if (!selected || !isChoiceNode(selected)) return edges; // referencja bez zmian

    // jeśli trzeba – tworzymy NOWĄ tablicę i tylko zmienione elementy
    let changed = false;
    const mapped = edges.map((edge) => {
      const touches = edge.source === selectedNodeId || edge.target === selectedNodeId;
      if (!touches) return edge;
      changed = true;
      return {
        ...edge,
        style: { ...(edge.style ?? {}), strokeWidth: 3, stroke: "#dc2626" },
        markerEnd: { type: MarkerType.Arrow, color: "#dc2626" },
      } as Edge;
    });
    return changed ? mapped : edges;
  }, [edges, nodeMap, selectedNodeId]);

  // Nowe połączenie → dodajemy krawędź w store
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        connect(params.source, params.target);
      }
    },
    [connect]
  );

  return (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={enrichedEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        // selection hook działa w SelectionBridge – nie używamy props onSelectionChange
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={defaultEdgeOptions}
        deleteKeyCode={['Backspace', 'Delete'] as const}  
        snapToGrid
        snapGrid={SNAP_GRID}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={GRID_SIZE} size={1} />
      </ReactFlow>

      {/* Subskrybent selekcji jako SĄSIAD, nie dziecko ReactFlow */}
      <SelectionBridge />
    </ReactFlowProvider>
  );
});
