import { create } from "zustand";
import { 
  applyNodeChanges as applyNodeChangesRF, 
  applyEdgeChanges as applyEdgeChangesRF, 
  NodeChange, 
  EdgeChange 
} from "reactflow";
import { StoryNode, StoryEdge, SceneNode, ChoiceNode } from "@/types";
import { blockSnippets, autoLayout } from "./blockSnippets";

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
  position,
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
  position,
  data: {
    label: "Choice",
    effects: {}
  }
});

export const useFlowStore = create<FlowStore>((set) => ({
  nodes: [
    {
      id: START_NODE_ID,
      type: "scene",
      position: { x: 250, y: 250 },
      data: { label: "Start", durationSec: 5 }
    }
  ],
  edges: [],
  selectedNodeId: null,

  addSceneNode: () => set(state => {
    const newNode = createSceneNode({
      x: 400,
      y: 250 + state.nodes.length * 100
    });
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
    
    set(state => ({
      nodes: state.nodes.filter(n => n.id !== nodeId),
      edges: state.edges.filter(e => 
        e.source !== nodeId && e.target !== nodeId
      ),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
    }));
  },

  createChoice: (sourceId, targetId) => set(state => {
    // Check if connection already exists
    const existingPath = state.edges.find(e => 
      (e.source === sourceId && e.target === targetId) ||
      (e.source === sourceId && state.edges.some(e2 => 
        e2.source === e.target && e2.target === targetId
      ))
    );
    
    if (existingPath) return state;
    
    const sourceNode = state.nodes.find(n => n.id === sourceId);
    const targetNode = state.nodes.find(n => n.id === targetId);
    
    if (!sourceNode || !targetNode) return state;
    
    // Create choice node between scenes
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
      position: { x: 250, y: 250 },
      data: { label: "Start", durationSec: 5 }
    }],
    edges: [],
    selectedNodeId: null
  })
}));

// Helper functions
export const isSceneNode = (node: StoryNode): node is SceneNode => 
  node.type === "scene";

export const isChoiceNode = (node: StoryNode): node is ChoiceNode => 
  node.type === "choice";