// src/modules/flow/store/useFlowStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Edge,
  type Connection,
  addEdge,
} from "@xyflow/react";

import { isSceneNode, isChoiceNode, type StoryNode, type SceneNode, type ChoiceNode } from "../types";
import { snapPositionToGrid } from "../gridHelpers";

export const START_NODE_ID = "scene_start";

const generateId = (prefix: "scene" | "choice") =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

interface FlowState {
  nodes: StoryNode[];
  edges: Edge[];
  selectedNodeId: string | null;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  addConnection: (conn: Connection | Edge) => void;
  addChoiceNode: (opts?: { connectFromId?: string }) => void;
  selectNode: (nodeId: string | null) => void;
  updateNode: (nodeId: string, data: any) => void;
  deleteNode: (nodeId: string) => void;
  addSceneNode: () => void;
  getNode: (nodeId: string) => StoryNode | undefined;
  getChoicesForScene: (sceneId: string) => ChoiceNode[];

  loadNodes: (nodes: StoryNode[]) => void;
  loadEdges: (edges: Edge[]) => void;
  reset: () => void;
}

const createInitialNodes = (): StoryNode[] => [
  {
    id: START_NODE_ID,
    type: "scene",
    position: snapPositionToGrid({ x: 250, y: 250 }),
    data: { label: "Start", durationSec: 5 },
    deletable: false,
  } as SceneNode,
];

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      nodes: createInitialNodes(),
      edges: [],
      selectedNodeId: null,

      onNodesChange: (changes) =>
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes) as StoryNode[],
        })),

      onEdgesChange: (changes) =>
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
        })),

      // 🔑 tylko dodanie krawędzi
      addConnection: (conn) =>
        set((state) => ({ edges: addEdge(conn, state.edges) })),

      // dodanie choice bez automatycznego pozycjonowania/łączenia
      addChoiceNode: () =>
        set((state) => {
          const choiceId = generateId("choice");
          const newChoice: ChoiceNode = {
            id: choiceId,
            type: "choice",
            position: snapPositionToGrid({ x: 0, y: 0 }),
            data: {
              label: `Choice ${state.nodes.filter((n) => n.type === "choice").length + 1}`,
              effects: {},
            },
          };

          return {
            nodes: [...state.nodes, newChoice],
            edges: state.edges,
            selectedNodeId: newChoice.id,
          };
        }),

      selectNode: (nodeId) =>
        set((state) =>
          state.selectedNodeId === nodeId ? state : { selectedNodeId: nodeId }
        ),

      updateNode: (nodeId, data) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
          ),
        })),

      deleteNode: (nodeId) => {
        if (nodeId === START_NODE_ID) return;

        set((state) => {
          const nodeToDelete = state.nodes.find((n) => n.id === nodeId);
          if (!nodeToDelete) return state;

          const nodesToDelete = [nodeId];
          const edgesToDelete = new Set<string>();

          state.edges.forEach((e) => {
            if (e.source === nodeId || e.target === nodeId) edgesToDelete.add(e.id);
          });

          if (isSceneNode(nodeToDelete)) {
            state.nodes.forEach((n) => {
              if (isChoiceNode(n)) {
                const stillHasTwoLinks = state.edges.filter(
                  (e) =>
                    (e.source === n.id || e.target === n.id) &&
                    !edgesToDelete.has(e.id)
                ).length >= 2;
                if (!stillHasTwoLinks) {
                  nodesToDelete.push(n.id);
                  state.edges.forEach((e) => {
                    if (e.source === n.id || e.target === n.id) edgesToDelete.add(e.id);
                  });
                }
              }
            });
          }

          return {
            nodes: state.nodes.filter((n) => !nodesToDelete.includes(n.id)),
            edges: state.edges.filter((e) => !edgesToDelete.has(e.id)),
            selectedNodeId: nodesToDelete.includes(state.selectedNodeId || "")
              ? null
              : state.selectedNodeId,
          };
        });
      },

      addSceneNode: () =>
        set((state) => {
          const maxY = state.nodes.reduce((acc, n) => Math.max(acc, n.position.y), 250);
          const newNode: SceneNode = {
            id: generateId("scene"),
            type: "scene",
            position: snapPositionToGrid({ x: 400, y: maxY + 100 }),
            data: {
              label: `Scene ${state.nodes.filter((n) => n.type === "scene").length}`,
              durationSec: 5,
            },
          };
          return { nodes: [...state.nodes, newNode], selectedNodeId: newNode.id };
        }),

      getNode: (nodeId) => get().nodes.find((n) => n.id === nodeId),

      getChoicesForScene: (sceneId) => {
        const state = get();
        const outgoing = state.edges.filter((e) => e.source === sceneId);
        return outgoing
          .map((e) => state.nodes.find((n) => n.id === e.target))
          .filter((n): n is ChoiceNode => !!n && isChoiceNode(n));
      },

      loadNodes: (nodes) => set({ nodes, selectedNodeId: null }),
      loadEdges: (edges) => set({ edges }),

      reset: () =>
        set({
          nodes: createInitialNodes(),
          edges: [],
          selectedNodeId: null,
        }),
    }),
    { name: "flow-storage", partialize: (s) => ({ nodes: s.nodes, edges: s.edges }) }
  )
);
