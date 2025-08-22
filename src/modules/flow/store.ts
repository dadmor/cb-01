// src/modules/flow/store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { subscribeWithSelector } from "zustand/middleware";
import {
  applyNodeChanges as applyNodeChangesRF,
  applyEdgeChanges as applyEdgeChangesRF,
  NodeChange,
  EdgeChange,
} from "@xyflow/react";
import {
  StoryNode,
  StoryEdge,
  SceneNode,
  ChoiceNode,
  SceneNodeData,
  ChoiceNodeData,
  isSceneNode,
  isChoiceNode,
} from "@/types";
import { blockSnippets } from "./blockSnippets";
import { snapPositionToGrid } from "./gridHelpers";

// Type-safe wrappers
const applyNodeChanges = (
  changes: NodeChange[],
  nodes: StoryNode[]
): StoryNode[] => {
  const genericNodes = nodes as Array<SceneNode | ChoiceNode>;
  const result = applyNodeChangesRF(changes, genericNodes);
  return result as StoryNode[];
};

const applyEdgeChanges = (
  changes: EdgeChange[],
  edges: StoryEdge[]
): StoryEdge[] => {
  return applyEdgeChangesRF(changes, edges);
};

interface FlowStore {
  nodes: StoryNode[];
  edges: StoryEdge[];
  selectedNodeId: string | null;

  // Node operations
  addSceneNode: () => void;
  addBlockSnippet: (snippetId: string, sourceNodeId: string) => void;
  updateNode: <T extends StoryNode>(
    nodeId: string,
    data: T extends SceneNode ? SceneNodeData : ChoiceNodeData
  ) => void;
  deleteNode: (nodeId: string) => void;

  // Edge operations
  createChoice: (sourceId: string, targetId: string) => void;

  // Selection
  selectNode: (nodeId: string | null) => void;

  // React Flow handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;

  // Project operations
  loadProject: (nodes: StoryNode[], edges: StoryEdge[]) => void;
  clearProject: () => void;

  // Optimized selectors
  getNode: (nodeId: string) => StoryNode | undefined;
  getConnectedEdges: (nodeId: string) => StoryEdge[];
  getChoicesForScene: (sceneId: string) => ChoiceNode[];
}

export const START_NODE_ID = "scene-1" as const;
let nextId = 2;

// Helper functions extracted for reuse
const createSceneNode = (position = { x: 400, y: 250 }): SceneNode => ({
  id: `scene-${nextId++}`,
  type: "scene",
  position: snapPositionToGrid(position),
  data: {
    label: `Scene ${nextId - 1}`,
    durationSec: 5,
  },
});

const createChoiceNode = (
  id: string,
  position: { x: number; y: number }
): ChoiceNode => ({
  id,
  type: "choice",
  position: snapPositionToGrid(position),
  data: {
    label: "Choice",
    effects: {},
  },
});

export const useFlowStore = create<FlowStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
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

        addSceneNode: () =>
          set((state) => {
            const newNode = createSceneNode(
              snapPositionToGrid({
                x: 400,
                y: 250 + state.nodes.length * 100,
              })
            );
            return {
              nodes: [...state.nodes, newNode],
              selectedNodeId: newNode.id,
            };
          }),

        addBlockSnippet: (snippetId, sourceNodeId) =>
          set((state) => {
            const snippet = blockSnippets.find((s) => s.id === snippetId);
            if (!snippet) return state;

            const sourceNode = state.nodes.find((n) => n.id === sourceNodeId);
            if (!sourceNode) return state;

            const { nodes: newNodes, edges: newEdges } = snippet.create(
              sourceNodeId,
              sourceNode.position
            );

            return {
              nodes: [...state.nodes, ...newNodes],
              edges: [...state.edges, ...newEdges],
              selectedNodeId: newNodes[0]?.id || state.selectedNodeId,
            };
          }),

        updateNode: (nodeId, data) =>
          set((state) => ({
            nodes: state.nodes.map((n) =>
              n.id === nodeId ? { ...n, data: data as any } : n
            ),
          })),

        deleteNode: (nodeId) => {
          if (nodeId === START_NODE_ID) return;

          set((state) => {
            const nodeToDelete = state.nodes.find((n) => n.id === nodeId);
            if (!nodeToDelete) return state;

            const nodesToDelete = [nodeId];
            const edgesToDelete = new Set<string>();

            // Mark edges for deletion
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

        createChoice: (sourceId, targetId) =>
          set((state) => {
            const sourceNode = state.nodes.find((n) => n.id === sourceId);
            const targetNode = state.nodes.find((n) => n.id === targetId);

            if (!sourceNode || !targetNode) return state;

            // Check if connection already exists
            const existingConnection = state.edges.find(
              (e) => e.source === sourceId && e.target === targetId
            );

            if (existingConnection) return state;

            // Scene to scene: create choice node between
            if (isSceneNode(sourceNode) && isSceneNode(targetNode)) {
              const choiceId = `choice-${nextId++}`;
              const choiceNode = createChoiceNode(choiceId, {
                x: (sourceNode.position.x + targetNode.position.x) / 2,
                y: (sourceNode.position.y + targetNode.position.y) / 2,
              });

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

            // Direct connection for other cases
            const edgeId = `${sourceId}-${targetId}`;
            return {
              ...state,
              edges: [
                ...state.edges,
                { id: edgeId, source: sourceId, target: targetId },
              ],
            };
          }),

        selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

        onNodesChange: (changes) =>
          set((state) => ({
            nodes: applyNodeChanges(changes, state.nodes),
          })),

        onEdgesChange: (changes) =>
          set((state) => ({
            edges: applyEdgeChanges(changes, state.edges),
          })),

        loadProject: (nodes, edges) =>
          set({
            nodes,
            edges,
            selectedNodeId: null,
          }),

        clearProject: () =>
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
          }),

        // Optimized selectors
        getNode: (nodeId) => get().nodes.find((n) => n.id === nodeId),

        getConnectedEdges: (nodeId) =>
          get().edges.filter((e) => e.source === nodeId || e.target === nodeId),

        getChoicesForScene: (sceneId) => {
          const state = get();
          const outgoingEdges = state.edges.filter((e) => e.source === sceneId);
          return outgoingEdges
            .map((e) => state.nodes.find((n) => n.id === e.target))
            .filter((n): n is ChoiceNode => !!n && isChoiceNode(n));
        },
      }),
      {
        name: "flow-storage",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          nodes: state.nodes,
          edges: state.edges,
        }),
      }
    )
  )
);

// Optimized hooks to prevent re-renders
export const useNodes = () => useFlowStore((state) => state.nodes);
export const useEdges = () => useFlowStore((state) => state.edges);
export const useSelectedNodeId = () =>
  useFlowStore((state) => state.selectedNodeId);
export const useSelectedNode = () => {
  const selectedNodeId = useSelectedNodeId();
  return useFlowStore((state) => state.getNode(selectedNodeId || ""));
};