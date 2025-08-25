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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { SceneNode } from "./nodes/SceneNode";
import { ChoiceNode } from "./nodes/ChoiceNode";
import { isChoiceNode } from "./types";
import { useFlowStore } from "./store/useFlowStore";
import { GRID_SIZE } from "./gridHelpers";

// Node types
const nodeTypes: NodeTypes = {
  scene: SceneNode,
  choice: ChoiceNode,
};

// Default edge style (spójny obiekt markerEnd)
const defaultEdgeOptions = {
  type: "smoothstep" as const,
  markerEnd: { type: "arrow" as const },
  style: {
    strokeWidth: 2,
    stroke: "#52525b",
  },
};

export const FlowCanvas: React.FC = React.memo(() => {
  // Flow store hooks
  const nodes = useFlowStore(state => state.nodes);
  const edges = useFlowStore(state => state.edges);
  const selectedNodeId = useFlowStore(state => state.selectedNodeId);
  const onNodesChange = useFlowStore(state => state.onNodesChange);
  const onEdgesChange = useFlowStore(state => state.onEdgesChange);
  const createChoice = useFlowStore(state => state.createChoice);
  const selectNode = useFlowStore(state => state.selectNode);
  const deleteNode = useFlowStore(state => state.deleteNode);

  // Node map for quick lookup
  const nodeMap = useMemo(
    () => new Map(nodes.map(n => [n.id, n])),
    [nodes]
  );

  // Enhanced edges with selection styles (bez nadpisywania własnych ustawień)
  const enrichedEdges = useMemo(() => {
    return edges.map((edge) => {
      const isSelectedChoice = !!selectedNodeId && 
        (edge.source === selectedNodeId || edge.target === selectedNodeId) &&
        !!nodeMap.get(selectedNodeId) &&
        isChoiceNode(nodeMap.get(selectedNodeId)!);

      if (isSelectedChoice) {
        return {
          ...edge,
          type: "smoothstep" as const,
          style: {
            strokeWidth: 3,
            stroke: "#dc2626",
          },
          markerEnd: {
            type: "arrow" as const,
            color: "#dc2626",
          },
        };
      }

      return {
        ...edge,
        ...defaultEdgeOptions,
      };
    });
  }, [edges, nodeMap, selectedNodeId]);

  // Handle new connections
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        createChoice(params.source, params.target);
      }
    },
    [createChoice]
  );

  // Handle selection
  const onSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
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
    },
    [selectNode, nodeMap]
  );

  // Handle pane click
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Helper: czy aktualny target to pole edycyjne
  const isEditableTarget = (el: EventTarget | null) => {
    return el instanceof HTMLElement &&
      (el.isContentEditable ||
       ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
  };

  // Handle delete key (z ochroną przed usuwaniem podczas edycji)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if ((event.key === "Delete" || event.key === "Backspace") && selectedNodeId) {
        event.preventDefault();
        deleteNode(selectedNodeId);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, deleteNode]);

  return (
    <ReactFlow
      nodes={nodes}
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
      snapGrid={[GRID_SIZE, GRID_SIZE]}
      fitView
    >
      <Controls />
      <MiniMap />
      <Background gap={GRID_SIZE} size={1} />
    </ReactFlow>
  );
});
