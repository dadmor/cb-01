// src/store/useAppStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Edge,
} from "@xyflow/react";

import type { StoryNode, SceneNode, ChoiceNode } from "@/modules/flow/types";
import { isSceneNode, isChoiceNode } from "@/modules/flow/types";
import type { Variable } from "@/modules/variables/types";
import { snapPositionToGrid } from "@/modules/flow/gridHelpers";

interface AppState {
  // State
  nodes: StoryNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  variables: Variable[];
  
  // Actions
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  createChoice: (sourceId: string, targetId: string) => void;
  selectNode: (nodeId: string | null) => void;
  updateNode: (nodeId: string, data: any) => void;
  deleteNode: (nodeId: string) => void;
  addSceneNode: () => void;
  updateVariable: (name: string, value: number) => void;
  addVariable: (name: string) => void;
  removeVariable: (name: string) => void;
  
  // Helpers
  getNode: (nodeId: string) => StoryNode | undefined;
  getChoicesForScene: (sceneId: string) => ChoiceNode[];
  
  // Project
  loadProject: (nodes: StoryNode[], edges: Edge[]) => void;
  clearProject: () => void;
}

export const START_NODE_ID = "scene-1";
let nextId = 2;

// === HELPERY DO ID ===
const extractNumericSuffix = (id: string): number | null => {
  // obsługujemy id w stylu "scene-12" albo "choice-7"
  const m = id.match(/-(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
};

const recomputeNextId = (nodes: StoryNode[]) => {
  const maxNum = nodes
    .map(n => extractNumericSuffix(n.id))
    .filter((n): n is number => Number.isFinite(n))
    .reduce((a, b) => Math.max(a, b), 1);
  nextId = Math.max(2, maxNum + 1);
};

// === DOMYŚLNE ZMIENNE ===
const DEFAULT_VARIABLES: Variable[] = [
  { name: "health", value: 10, initialValue: 10 },
  { name: "energy", value: 5, initialValue: 5 },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: [
        {
          id: START_NODE_ID,
          type: "scene",
          position: snapPositionToGrid({ x: 250, y: 250 }),
          data: { label: "Start", durationSec: 5 },
        } as SceneNode,
      ],
      edges: [],
      selectedNodeId: null,
      variables: DEFAULT_VARIABLES,

      // React Flow handlers
      onNodesChange: (changes) =>
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes) as StoryNode[],
        })),
          
      onEdgesChange: (changes) =>
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
        })),
          
      // Create connection
      createChoice: (sourceId, targetId) =>
        set((state) => {
          const sourceNode = state.nodes.find((n) => n.id === sourceId);
          const targetNode = state.nodes.find((n) => n.id === targetId);

          if (!sourceNode || !targetNode) return state;

          // Check if already connected
          const exists = state.edges.find(
            (e) => e.source === sourceId && e.target === targetId
          );
          if (exists) return state;

          // Scene to scene: create choice node between
          if (isSceneNode(sourceNode) && isSceneNode(targetNode)) {
            const choiceId = `choice-${nextId++}`;
            const choiceNode: ChoiceNode = {
              id: choiceId,
              type: "choice",
              position: snapPositionToGrid({
                x: (sourceNode.position.x + targetNode.position.x) / 2,
                y: (sourceNode.position.y + targetNode.position.y) / 2,
              }),
              data: {
                label: "Choice",
                effects: {},
              },
            };

            return {
              nodes: [...state.nodes, choiceNode],
              edges: [
                ...state.edges,
                {
                  id: `${sourceId}-${choiceId}`,
                  source: sourceId,
                  target: choiceId,
                },
                {
                  id: `${choiceId}-${targetId}`,
                  source: choiceId,
                  target: targetId,
                },
              ],
            };
          }

          // Direct connection
          return {
            ...state,
            edges: [
              ...state.edges,
              { id: `${sourceId}-${targetId}`, source: sourceId, target: targetId },
            ],
          };
        }),
          
      selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
      
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

          // Remove connected edges
          state.edges.forEach((edge) => {
            if (edge.source === nodeId || edge.target === nodeId) {
              edgesToDelete.add(edge.id);
            }
          });

          // Find orphaned choice nodes
          if (isSceneNode(nodeToDelete)) {
            state.nodes.forEach((node) => {
              if (isChoiceNode(node)) {
                const remainingEdges = state.edges.filter(
                  (e) =>
                    (e.source === node.id || e.target === node.id) &&
                    !edgesToDelete.has(e.id)
                );

                if (remainingEdges.length < 2) {
                  nodesToDelete.push(node.id);
                  state.edges.forEach((edge) => {
                    if (edge.source === node.id || edge.target === node.id) {
                      edgesToDelete.add(edge.id);
                    }
                  });
                }
              }
            });
          }

          const newNodes = state.nodes.filter((n) => !nodesToDelete.includes(n.id));
          // po usunięciu przelicz nextId, żeby uniknąć kolizji po „cofnięciu” długości listy
          recomputeNextId(newNodes);

          return {
            nodes: newNodes,
            edges: state.edges.filter((e) => !edgesToDelete.has(e.id)),
            selectedNodeId: nodesToDelete.includes(state.selectedNodeId || "")
              ? null
              : state.selectedNodeId,
          };
        });
      },
      
      addSceneNode: () =>
        set((state) => {
          // Spróbuj umieścić nową scenę „pod najniżej” położoną sceną
          const maxY =
            state.nodes.reduce((acc, n) => Math.max(acc, n.position.y), 250);
          const newNode: SceneNode = {
            id: `scene-${nextId++}`,
            type: "scene",
            position: snapPositionToGrid({
              x: 400,
              y: maxY + 100,
            }),
            data: {
              label: `Scene ${nextId - 1}`,
              durationSec: 5,
            },
          };
          return {
            nodes: [...state.nodes, newNode],
            selectedNodeId: newNode.id,
          };
        }),

      // Variables
      updateVariable: (name, value) =>
        set((state) => ({
          variables: state.variables.map((v) =>
            v.name === name ? { ...v, value } : v
          ),
        })),
        
      addVariable: (name) =>
        set((state) => ({
          variables: [...state.variables, {
            name,
            value: 0,
            initialValue: 0
          }]
        })),
        
      removeVariable: (name) =>
        set((state) => ({
          variables: state.variables.filter(v => v.name !== name)
        })),

      // Helpers
      getNode: (nodeId) => get().nodes.find((n) => n.id === nodeId),
      
      getChoicesForScene: (sceneId) => {
        const state = get();
        const outgoingEdges = state.edges.filter((e) => e.source === sceneId);
        return outgoingEdges
          .map((e) => state.nodes.find((n) => n.id === e.target))
          .filter((n): n is ChoiceNode => !!n && isChoiceNode(n));
      },

      // Project
      loadProject: (nodes, edges) => {
        // ustaw najpierw nextId na podstawie importu
        recomputeNextId(nodes);
        set({
          nodes,
          edges,
          selectedNodeId: null,
        });
      },
          
      clearProject: () => {
        nextId = 2; // reset licznika przy czyszczeniu
        set({
          nodes: [
            {
              id: START_NODE_ID,
              type: "scene",
              position: snapPositionToGrid({ x: 250, y: 250 }),
              data: { label: "Start", durationSec: 5 },
            } as SceneNode,
          ],
          edges: [],
          selectedNodeId: null,
          variables: DEFAULT_VARIABLES,
        });
      },
    }),
    {
      name: "app-storage",
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        variables: state.variables,
      }),
      // Kluczowe: po rehydratacji z localStorage przelicz nextId na podstawie istniejących węzłów
      onRehydrateStorage: () => (state) => {
        if (state?.nodes) {
          recomputeNextId(state.nodes);
        }
      },
    }
  )
);

// POJEDYNCZE SELEKTORY - BEZ OBIEKTÓW!
export const useNodes = () => useAppStore((state) => state.nodes);
export const useEdges = () => useAppStore((state) => state.edges);
export const useSelectedNodeId = () => useAppStore((state) => state.selectedNodeId);
export const useVariables = () => useAppStore((state) => state.variables);

export const useOnNodesChange = () => useAppStore((state) => state.onNodesChange);
export const useOnEdgesChange = () => useAppStore((state) => state.onEdgesChange);
export const useCreateChoice = () => useAppStore((state) => state.createChoice);
export const useSelectNode = () => useAppStore((state) => state.selectNode);
export const useUpdateNode = () => useAppStore((state) => state.updateNode);
export const useDeleteNode = () => useAppStore((state) => state.deleteNode);
export const useAddSceneNode = () => useAppStore((state) => state.addSceneNode);
export const useGetChoicesForScene = () => useAppStore((state) => state.getChoicesForScene);
