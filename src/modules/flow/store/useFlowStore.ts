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

// UUID generator
const generateId = (prefix: 'scene' | 'choice'): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${randomStr}`;
};

// Stały ID dla węzła startowego
export const START_NODE_ID = "scene_start";

interface FlowState {
  // State
  nodes: StoryNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  
  // Actions
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  createChoice: (sourceId: string, targetId: string) => void;
  selectNode: (nodeId: string | null) => void;
  updateNode: (nodeId: string, data: any) => void;
  deleteNode: (nodeId: string) => void;
  addSceneNode: () => void;
  
  // Helpers
  getNode: (nodeId: string) => StoryNode | undefined;
  getChoicesForScene: (sceneId: string) => ChoiceNode[];
  
  // Project management
  loadNodes: (nodes: StoryNode[]) => void;
  loadEdges: (edges: Edge[]) => void;
  reset: () => void;
}

const createInitialNodes = (): StoryNode[] => [
  {
    id: START_NODE_ID,
    type: "scene",
    position: snapPositionToGrid({ x: 250, y: 250 }),
    data: { 
      label: "Start", 
      durationSec: 5,
      isStart: true
    },
  } as SceneNode,
];

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: createInitialNodes(),
      edges: [],
      selectedNodeId: null,

      // React Flow handlers
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
            const choiceId = generateId('choice');
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
                  id: `edge_${sourceId}_${choiceId}`,
                  source: sourceId,
                  target: choiceId,
                },
                {
                  id: `edge_${choiceId}_${targetId}`,
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
              { 
                id: `edge_${sourceId}_${targetId}`, 
                source: sourceId, 
                target: targetId 
              },
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
        // Nie pozwalamy usunąć węzła startowego
        if (nodeId === START_NODE_ID) return;

        set((state) => {
          const nodeToDelete = state.nodes.find((n) => n.id === nodeId);
          if (!nodeToDelete) return state;

          const nodesToDelete = [nodeId];
          const edgesToDelete = new Set<string>();

          // Find edges to delete
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
          // Find the lowest Y position to place new node below
          const maxY = state.nodes.reduce((acc, n) => Math.max(acc, n.position.y), 250);
          
          const newNode: SceneNode = {
            id: generateId('scene'),
            type: "scene",
            position: snapPositionToGrid({
              x: 400,
              y: maxY + 100,
            }),
            data: {
              label: `Scene ${state.nodes.filter(n => n.type === 'scene').length}`,
              durationSec: 5,
            },
          };
          
          return {
            nodes: [...state.nodes, newNode],
            selectedNodeId: newNode.id,
          };
        }),

      // Helpers
      getNode: (nodeId) => get().nodes.find((n) => n.id === nodeId),
      
      getChoicesForScene: (sceneId) => {
        const state = get();
        const outgoingEdges = state.edges.filter((e) => e.source === sceneId);
        return outgoingEdges
          .map((e) => state.nodes.find((n) => n.id === e.target))
          .filter((n): n is ChoiceNode => !!n && isChoiceNode(n));
      },

      // Project management
      loadNodes: (nodes) => set({ nodes, selectedNodeId: null }),
      loadEdges: (edges) => set({ edges }),
      
      reset: () => set({
        nodes: createInitialNodes(),
        edges: [],
        selectedNodeId: null,
      }),
    }),
    {
      name: "flow-storage",
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);