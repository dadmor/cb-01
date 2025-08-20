// ------ src/flowStore.ts ------
import { create } from "zustand";
import {
  applyNodeChanges as applyNodeChangesBase,
  applyEdgeChanges as applyEdgeChangesBase,
  NodeChange,
  EdgeChange,
} from "reactflow";
import {
  FlowNode,
  FlowEdge,
  MainNode,
  DecisionNode,
  MainNodeData,
  DecisionNodeData,
  ProjectData,
} from "./types";
import { useGameStore } from "./gameStore";

// Type-safe wrappers for reactflow functions
const applyNodeChanges = (
  changes: NodeChange[],
  nodes: FlowNode[]
): FlowNode[] => {
  return applyNodeChangesBase(changes, nodes as any) as FlowNode[];
};

const applyEdgeChanges = (
  changes: EdgeChange[],
  edges: FlowEdge[]
): FlowEdge[] => {
  return applyEdgeChangesBase(changes, edges as any) as FlowEdge[];
};

interface FlowStore {
  // Project metadata
  projectTitle: string;
  projectDescription: string;

  // Flow state
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;
  nextNodeId: number;

  // Actions
  setProjectTitle: (title: string) => void;
  setProjectDescription: (description: string) => void;
  applyNodesChange: (changes: NodeChange[]) => void;
  applyEdgesChange: (changes: EdgeChange[]) => void;
  setSelectedNode: (nodeId: string | null) => void;
  addMainNode: () => void;
  deleteNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: MainNodeData | DecisionNodeData) => void;
  insertDecisionBetweenMainNodes: (
    sourceId: string,
    targetId: string
  ) => string | null;

  // Import/Export
  exportProject: () => ProjectData;
  importProject: (data: ProjectData) => void;
  resetProject: () => void;
}

// Constants
export const START_NODE_ID = "main-1";
const PROJECT_VERSION = "1.0.0";

// Initial nodes and edges
const INITIAL_NODES: FlowNode[] = [
  {
    id: START_NODE_ID,
    type: "main",
    position: { x: 250, y: 250 },
    data: {
      label: "Start",
      durationSec: 5,
    },
  },
];

const INITIAL_EDGES: FlowEdge[] = [];

// Type guards
export function isMainNode(node: FlowNode): node is MainNode {
  return node.type === "main";
}

export function isDecisionNode(node: FlowNode): node is DecisionNode {
  return node.type === "decision";
}

export const useFlowStore = create<FlowStore>((set, get) => ({
  // Initial state
  projectTitle: "Nowy Projekt",
  projectDescription: "",
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
  selectedNodeId: null,
  nextNodeId: 2,

  // Project metadata actions
  setProjectTitle: (title) => set({ projectTitle: title }),
  setProjectDescription: (description) =>
    set({ projectDescription: description }),

  // Node/Edge actions
  applyNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },

  applyEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  setSelectedNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  addMainNode: () => {
    set((state) => {
      const newNode: MainNode = {
        id: `main-${state.nextNodeId}`,
        type: "main",
        position: { x: 400, y: 250 + state.nodes.length * 100 },
        data: {
          label: `Blok ${state.nextNodeId}`,
          durationSec: 5,
        },
      };
      return {
        nodes: [...state.nodes, newNode],
        nextNodeId: state.nextNodeId + 1,
        selectedNodeId: newNode.id,
      };
    });
  },

  deleteNode: (nodeId) => {
    if (nodeId === START_NODE_ID) return;

    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
      selectedNodeId:
        state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
  },

  updateNode: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        return { ...node, data } as FlowNode;
      }),
    }));
  },

  insertDecisionBetweenMainNodes: (sourceId, targetId) => {
    const state = get();

    // Check if both nodes are main nodes
    const sourceNode = state.nodes.find((n) => n.id === sourceId);
    const targetNode = state.nodes.find((n) => n.id === targetId);

    if (
      !sourceNode ||
      !targetNode ||
      !isMainNode(sourceNode) ||
      !isMainNode(targetNode)
    ) {
      return null;
    }

    // Check if edge already exists
    const existingEdge = state.edges.find(
      (e) => e.source === sourceId && e.target === targetId
    );
    if (existingEdge) return null;

    // Create decision node
    const decisionId = `decision-${state.nextNodeId}`;
    const decisionNode: DecisionNode = {
      id: decisionId,
      type: "decision",
      position: {
        x: (sourceNode.position.x + targetNode.position.x) / 2,
        y: (sourceNode.position.y + targetNode.position.y) / 2,
      },
      data: {
        label: "Decyzja",
        deltas: {},
      },
    };

    // Create edges
    const edge1: FlowEdge = {
      id: `${sourceId}-${decisionId}`,
      source: sourceId,
      target: decisionId,
    };

    const edge2: FlowEdge = {
      id: `${decisionId}-${targetId}`,
      source: decisionId,
      target: targetId,
    };

    set({
      nodes: [...state.nodes, decisionNode],
      edges: [...state.edges, edge1, edge2],
      nextNodeId: state.nextNodeId + 1,
    });

    return decisionId;
  },

  // Export project to JSON format
  exportProject: () => {
    const state = get();
    const gameState = useGameStore.getState();

    const projectData: ProjectData = {
      title: state.projectTitle,
      description: state.projectDescription,
      variables: gameState.variables,
      nodes: state.nodes,
      edges: state.edges,
      version: PROJECT_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return projectData;
  },

  // Import project from JSON format
  importProject: (data: ProjectData) => {
    // Validate version compatibility
    if (data.version && !data.version.startsWith("1.")) {
      throw new Error(`Niekompatybilna wersja projektu: ${data.version}`);
    }

    // Update flow store
    set({
      projectTitle: data.title || "Zaimportowany Projekt",
      projectDescription: data.description || "",
      nodes: data.nodes || [],
      edges: data.edges || [],
      selectedNodeId: null,
      // Calculate next node ID
      nextNodeId: Math.max(
        2,
        ...data.nodes.map((n) => {
          const match = n.id.match(/\d+$/);
          return match ? parseInt(match[0]) + 1 : 2;
        })
      ),
    });

    // Update game store variables
    const gameStore = useGameStore.getState();
    gameStore.setVariables(() => data.variables || []);

    // Reset game state
    gameStore.stopPlay();
  },

  // Reset to initial state
  resetProject: () => {
    set({
      projectTitle: "Nowy Projekt",
      projectDescription: "",
      nodes: INITIAL_NODES,
      edges: INITIAL_EDGES,
      selectedNodeId: null,
      nextNodeId: 2,
    });

    // Reset game store
    const gameStore = useGameStore.getState();
    gameStore.stopPlay();
    gameStore.setVariables(() => []);
  },
}));
