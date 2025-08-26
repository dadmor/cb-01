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
  NodeTypes,
  Edge,
  MarkerType,
  useOnSelectionChange,
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { SceneNode } from "./nodes/SceneNode";
import { ChoiceNode } from "./nodes/ChoiceNode";
import { isChoiceNode } from "./types";
import { useFlowStore } from "./store/useFlowStore";
import { GRID_SIZE } from "./gridHelpers";

// ================== Stałe ==================
const nodeTypes: NodeTypes = {
  scene: SceneNode,
  choice: ChoiceNode,
};

const defaultEdgeOptions = {
  type: "smoothstep" as const,
  markerEnd: { type: MarkerType.Arrow },
  style: { strokeWidth: 2, stroke: "#52525b" },
};

const SNAP_GRID: [number, number] = [GRID_SIZE, GRID_SIZE];
const DELETE_KEYS: string[] = ["Backspace", "Delete"];

// ================== Bridge ==================
const SelectionBridge: React.FC = () => {
  const selectNode = useFlowStore((s) => s.selectNode);

  const onChange = useCallback(
    ({ nodes }: { nodes: { id: string }[]; edges: unknown[] }) => {
      const nextId = nodes.length > 0 ? nodes[0].id : null;
      selectNode(nextId);
    },
    [selectNode]
  );

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
  const addConnection = useFlowStore((s) => s.addConnection);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const enrichedEdges: Edge[] = useMemo(() => {
    if (!selectedNodeId) return edges;
    const selected = nodeMap.get(selectedNodeId);
    if (!selected || !isChoiceNode(selected)) return edges;

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

  // tylko dodaje krawędź do store
  const onConnect = useCallback((params: Connection) => {
    addConnection(params);
  }, [addConnection]);

  return (
    <ReactFlowProvider>
      <ReactFlow
        nodes={nodes}
        edges={enrichedEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        defaultEdgeOptions={defaultEdgeOptions}
        deleteKeyCode={DELETE_KEYS}
        snapToGrid
        snapGrid={SNAP_GRID}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={GRID_SIZE} size={1} />
      </ReactFlow>

      <SelectionBridge />
    </ReactFlowProvider>
  );
});
