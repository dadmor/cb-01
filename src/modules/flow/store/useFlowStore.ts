// src/modules/flow/store/useFlowStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Edge,
} from "@xyflow/react";

import type { StoryNode, SceneNode, ChoiceNode } from "../types";
import { isSceneNode, isChoiceNode } from "../types";
import { snapPositionToGrid } from "../gridHelpers";

// ID startu
export const START_NODE_ID = "scene_start";

// Prosty generator ID
const generateId = (prefix: "scene" | "choice") =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

interface FlowState {
  nodes: StoryNode[];
  edges: Edge[];
  selectedNodeId: string | null;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;

  // łączenie (dodaje bezpośrednią krawędź, jeśli nie istnieje)
  createChoice: (sourceId: string, targetId: string) => void;

  // NOWE: dodawanie choice (opcjonalnie z podpięciem od sceny)
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
    deletable: false, // chronimy Start przed Delete/Backspace
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

      createChoice: (sourceId, targetId) =>
        set((state) => {
          const s = state.nodes.find((n) => n.id === sourceId);
          const t = state.nodes.find((n) => n.id === targetId);
          if (!s || !t) return state;

          const exists = state.edges.some(
            (e) => e.source === sourceId && e.target === targetId
          );
          if (exists) return state;

          return {
            ...state,
            edges: [
              ...state.edges,
              { id: `edge_${sourceId}_${targetId}`, source: sourceId, target: targetId },
            ],
          };
        }),

      // NOWE: dodaj choice (z sensowną pozycją); gdy podasz connectFromId (scena),
      // utworzy też krawędź scena -> choice
      addChoiceNode: (opts) =>
        set((state) => {
          const connectFromId = opts?.connectFromId;
          const sourceScene = connectFromId
            ? state.nodes.find((n) => n.id === connectFromId && isSceneNode(n)) as SceneNode | undefined
            : undefined;

          // pozycja: obok wskazanej sceny, albo pod najniższym węzłem
          const position = sourceScene
            ? snapPositionToGrid({ x: sourceScene.position.x + 200, y: sourceScene.position.y })
            : snapPositionToGrid({
                x: 400,
                y: state.nodes.reduce((acc, n) => Math.max(acc, n.position.y), 250) + 100,
              });

          const choiceId = generateId("choice");
          const newChoice: ChoiceNode = {
            id: choiceId,
            type: "choice",
            position,
            data: {
              label: `Choice ${state.nodes.filter((n) => n.type === "choice").length + 1}`,
              effects: {},
            },
          };

          const newEdges =
            sourceScene
              ? [
                  ...state.edges,
                  { id: `edge_${sourceScene.id}_${choiceId}`, source: sourceScene.id, target: choiceId },
                ]
              : state.edges;

          return {
            nodes: [...state.nodes, newChoice],
            edges: newEdges,
            selectedNodeId: newChoice.id,
          };
        }),

      // ✅ Strażnik: aktualizuj tylko gdy wartość się zmienia (eliminuje pętlę renderów)
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
        // dodatkowa blokada na poziomie store
        if (nodeId === START_NODE_ID) return;

        set((state) => {
          const nodeToDelete = state.nodes.find((n) => n.id === nodeId);
          if (!nodeToDelete) return state;

          const nodesToDelete = [nodeId];
          const edgesToDelete = new Set<string>();

          // krawędzie dotykające węzła
          state.edges.forEach((e) => {
            if (e.source === nodeId || e.target === nodeId) edgesToDelete.add(e.id);
          });

          // sprzątanie osieroconych choice (jeśli są w projekcie)
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
