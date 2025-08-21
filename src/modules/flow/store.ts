import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { 
  applyNodeChanges as applyNodeChangesRF, 
  applyEdgeChanges as applyEdgeChangesRF, 
  NodeChange, 
  EdgeChange 
} from "reactflow";
import { StoryNode, StoryEdge, SceneNode, ChoiceNode } from "@/types";
import { blockSnippets, autoLayout } from "./blockSnippets";
import { snapPositionToGrid } from "./gridHelpers";

// Type-safe wrappers for ReactFlow functions
const applyNodeChanges = (changes: NodeChange[], nodes: StoryNode[]): StoryNode[] => {
  return applyNodeChangesRF(changes, nodes as any) as StoryNode[];
};

const applyEdgeChanges = (changes: EdgeChange[], edges: StoryEdge[]): StoryEdge[] => {
  return applyEdgeChangesRF(changes, edges as any) as StoryEdge[];
};

interface FlowStore {
  nodes: StoryNode[];
  edges: StoryEdge[];
  selectedNodeId: string | null;
  
  // Node operations
  addSceneNode: () => void;
  addBlockSnippet: (snippetId: string, sourceNodeId: string) => void;
  updateNode: (nodeId: string, data: any) => void;
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
}

export const START_NODE_ID = "scene-1";
let nextId = 2;

const createSceneNode = (position = { x: 400, y: 250 }): SceneNode => ({
  id: `scene-${nextId++}`,
  type: "scene",
  position: snapPositionToGrid(position),
  data: {
    label: `Scene ${nextId - 1}`,
    durationSec: 5
  }
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
    effects: {}
  }
});

export const useFlowStore = create<FlowStore>()(
  persist(
    (set) => ({
      nodes: [
        {
          id: START_NODE_ID,
          type: "scene",
          position: snapPositionToGrid({ x: 250, y: 250 }),
          data: { label: "Start", durationSec: 5 }
        }
      ],
      edges: [],
      selectedNodeId: null,

      addSceneNode: () => set(state => {
        const newNode = createSceneNode(snapPositionToGrid({
          x: 400,
          y: 250 + state.nodes.length * 100
        }));
        return {
          nodes: [...state.nodes, newNode],
          selectedNodeId: newNode.id
        };
      }),

      addBlockSnippet: (snippetId, sourceNodeId) => set(state => {
        const snippet = blockSnippets.find(s => s.id === snippetId);
        if (!snippet) return state;
        
        const sourceNode = state.nodes.find(n => n.id === sourceNodeId);
        if (!sourceNode) return state;
        
        const { nodes: newNodes, edges: newEdges } = snippet.create(
          sourceNodeId, 
          sourceNode.position
        );
        
        // Connect source to first new node(s) if snippet doesn't handle it
        const connectingEdges = newEdges.filter(e => e.source === sourceNodeId);
        if (connectingEdges.length === 0 && newNodes.length > 0) {
          // Find nodes without incoming edges
          const nodesWithoutIncoming = newNodes.filter(n => 
            !newEdges.some(e => e.target === n.id)
          );
          
          // Connect to first node or all choice nodes at the start
          nodesWithoutIncoming.forEach(node => {
            if (node.type === 'choice' || nodesWithoutIncoming.length === 1) {
              newEdges.push({
                id: `${sourceNodeId}-${node.id}`,
                source: sourceNodeId,
                target: node.id
              });
            }
          });
        }
        
        // Apply auto-layout to new nodes
        const layoutedNodes = autoLayout([...newNodes], newEdges);
        
        return {
          nodes: [...state.nodes, ...layoutedNodes],
          edges: [...state.edges, ...newEdges],
          selectedNodeId: newNodes[0]?.id || state.selectedNodeId
        };
      }),

      updateNode: (nodeId, data) => set(state => ({
        nodes: state.nodes.map(node => 
          node.id === nodeId ? { ...node, data } : node
        )
      })),

      deleteNode: (nodeId) => {
        if (nodeId === START_NODE_ID) return;
        
        set(state => {
          const nodeToDelete = state.nodes.find(n => n.id === nodeId);
          if (!nodeToDelete) return state;
          
          // If deleting a choice node, remove all connected edges
          if (nodeToDelete.type === 'choice') {
            return {
              nodes: state.nodes.filter(n => n.id !== nodeId),
              edges: state.edges.filter(e => 
                e.source !== nodeId && e.target !== nodeId
              ),
              selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
            };
          }
          
          // If deleting a scene node, find all connected choice nodes
          const nodesToDelete = [nodeId];
          const edgesToDelete = new Set<string>();
          
          // Find all edges connected to the scene being deleted
          state.edges.forEach(edge => {
            if (edge.source === nodeId || edge.target === nodeId) {
              edgesToDelete.add(edge.id);
            }
          });
          
          // Check each choice node in the graph
          state.nodes.forEach(node => {
            if (node.type === 'choice') {
              // Count how many edges this choice node will have after deletion
              const currentEdges = state.edges.filter(e => 
                (e.source === node.id || e.target === node.id) &&
                !edgesToDelete.has(e.id)
              );
              
              // A choice node needs at least 2 connections to be valid
              // (one incoming from a scene, one outgoing to a scene)
              if (currentEdges.length < 2) {
                nodesToDelete.push(node.id);
                // Also mark edges from this choice node for deletion
                state.edges.forEach(edge => {
                  if (edge.source === node.id || edge.target === node.id) {
                    edgesToDelete.add(edge.id);
                  }
                });
              }
            }
          });
          
          return {
            nodes: state.nodes.filter(n => !nodesToDelete.includes(n.id)),
            edges: state.edges.filter(e => !edgesToDelete.has(e.id)),
            selectedNodeId: nodesToDelete.includes(state.selectedNodeId || '') ? null : state.selectedNodeId
          };
        });
      },

      createChoice: (sourceId, targetId) => set(state => {
        const sourceNode = state.nodes.find(n => n.id === sourceId);
        const targetNode = state.nodes.find(n => n.id === targetId);
        
        if (!sourceNode || !targetNode) return state;
        
        // Check if connection already exists directly
        const existingDirectConnection = state.edges.find(e => 
          e.source === sourceId && e.target === targetId
        );
        
        if (existingDirectConnection) return state;
        
        // If connecting two scenes, create a choice node between them
        if (sourceNode.type === 'scene' && targetNode.type === 'scene') {
          const choiceId = `choice-${nextId++}`;
          const choiceNode = createChoiceNode(choiceId, {
            x: (sourceNode.position.x + targetNode.position.x) / 2,
            y: (sourceNode.position.y + targetNode.position.y) / 2
          });
          
          return {
            nodes: [...state.nodes, choiceNode],
            edges: [
              ...state.edges,
              { id: `${sourceId}-${choiceId}`, source: sourceId, target: choiceId },
              { id: `${choiceId}-${targetId}`, source: choiceId, target: targetId }
            ]
          };
        }
        
        // For any other connection (scene->choice, choice->scene, choice->choice), create direct edge
        const edgeId = `${sourceId}-${targetId}`;
        return {
          ...state,
          edges: [...state.edges, { id: edgeId, source: sourceId, target: targetId }]
        };
      }),

      selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

      onNodesChange: (changes) => set(state => ({
        nodes: applyNodeChanges(changes, state.nodes)
      })),

      onEdgesChange: (changes) => set(state => ({
        edges: applyEdgeChanges(changes, state.edges)
      })),

      loadProject: (nodes, edges) => set({
        nodes,
        edges,
        selectedNodeId: null
      }),

      clearProject: () => set({
        nodes: [{
          id: START_NODE_ID,
          type: "scene",
          position: snapPositionToGrid({ x: 250, y: 250 }),
          data: { label: "Start", durationSec: 5 }
        }],
        edges: [],
        selectedNodeId: null
      })
    }),
    {
      name: 'flow-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      })
    }
  )
);

// Helper functions
export const isSceneNode = (node: StoryNode): node is SceneNode => 
  node.type === "scene";

export const isChoiceNode = (node: StoryNode): node is ChoiceNode => 
  node.type === "choice";