// ------ src/flowStore.ts ------
import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
  Node,
  Edge,
} from "reactflow";
import { FlowNode, FlowEdge, MainNode, DecisionNode, MainNodeData, DecisionNodeData } from "./types";

export const START_NODE_ID = "main-1";

// ===== Initial Data =====
const initialNodes: FlowNode[] = [
  {
    id: "main-1",
    type: "main" as const,
    position: { x: 50, y: 100 },
    data: { label: "Wejście do zamku", durationSec: 10 },
  } as MainNode,
  {
    id: "decision-1-1",
    type: "decision" as const,
    position: { x: 320, y: 50 },
    data: { label: "Weź klucz", deltas: { klucz: 1 } },
  } as DecisionNode,
  {
    id: "decision-1-2",
    type: "decision" as const,
    position: { x: 320, y: 150 },
    data: { label: "Weź miecz", deltas: { miecz: 1 } },
  } as DecisionNode,
  {
    id: "main-2",
    type: "main" as const,
    position: { x: 550, y: 100 },
    data: { label: "Sala główna", durationSec: 0 },
  } as MainNode,
  {
    id: "decision-2-1",
    type: "decision" as const,
    position: { x: 820, y: 50 },
    data: { label: "Wyjdź", deltas: {} },
  } as DecisionNode,
  {
    id: "decision-2-2",
    type: "decision" as const,
    position: { x: 820, y: 150 },
    data: { label: "Walcz", deltas: {} },
  } as DecisionNode,
  {
    id: "main-3",
    type: "main" as const,
    position: { x: 1050, y: 50 },
    data: {
      label: "Wyjście z zamku",
      condition: { varName: "klucz", op: "gte" as const, value: 1 },
      durationSec: 0,
    },
  } as MainNode,
  {
    id: "main-4",
    type: "main" as const,
    position: { x: 1050, y: 150 },
    data: {
      label: "Walka ze strażnikiem",
      condition: { varName: "miecz", op: "gte" as const, value: 1 },
      durationSec: 0,
    },
  } as MainNode,
];

const initialEdges: FlowEdge[] = [
  { id: "e1-1", source: "main-1", target: "decision-1-1", animated: true },
  { id: "e1-2", source: "main-1", target: "decision-1-2", animated: true },
  { id: "e1-1-2", source: "decision-1-1", target: "main-2", animated: true },
  { id: "e1-2-2", source: "decision-1-2", target: "main-2", animated: true },
  { id: "e2-1", source: "main-2", target: "decision-2-1", animated: true },
  { id: "e2-2", source: "main-2", target: "decision-2-2", animated: true },
  { id: "e2-1-3", source: "decision-2-1", target: "main-3", animated: true },
  { id: "e2-2-4", source: "decision-2-2", target: "main-4", animated: true },
];

// ===== Type Guards =====
export function isMainNode(node: FlowNode): node is MainNode {
  return node.type === "main";
}

export function isDecisionNode(node: FlowNode): node is DecisionNode {
  return node.type === "decision";
}

// ===== Store Interface =====
interface FlowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;

  // Actions
  setSelectedNode: (id: string | null) => void;
  applyNodesChange: OnNodesChange;
  applyEdgesChange: OnEdgesChange;
  
  addMainNode: () => void;
  deleteNode: (id: string) => void;
  updateNode: (id: string, data: MainNodeData | DecisionNodeData) => void;
  
  insertDecisionBetweenMainNodes: (sourceId: string, targetId: string) => string | null;

  // Selectors
  getCurrentNode: (currentNodeId: string | null) => FlowNode | undefined;
  getCurrentDecisions: (currentNodeId: string | null) => DecisionNode[];
  getSelectedNode: () => FlowNode | undefined;
}

// ===== Store Implementation =====
export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: null,

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  applyNodesChange: (changes) =>
    set((state) => {
      // Use a more generic type for ReactFlow's applyNodeChanges
      const updatedNodes = applyNodeChanges(changes, state.nodes as Node[]);
      // Cast back to our specific types
      return { nodes: updatedNodes as FlowNode[] };
    }),
    
  applyEdgesChange: (changes) =>
    set((state) => {
      const updatedEdges = applyEdgeChanges(changes, state.edges as Edge[]);
      return { edges: updatedEdges as FlowEdge[] };
    }),

  addMainNode: () => {
    const { nodes } = get();
    const mainNodes = nodes.filter(isMainNode);
    const lastMain = mainNodes.sort((a, b) => b.position.x - a.position.x)[0];
    
    const id = `main-${Date.now()}`;
    const newNode: MainNode = {
      id,
      type: "main",
      position: {
        x: (lastMain?.position.x ?? 0) + 300,
        y: lastMain?.position.y ?? 100,
      },
      data: { label: "Nowy blok", durationSec: 0 },
    };
    
    set({ nodes: [...nodes, newNode], selectedNodeId: id });
  },

  deleteNode: (id) => {
    const { nodes, edges } = get();
    const node = nodes.find((n) => n.id === id);
    if (!node) return;

    if (isDecisionNode(node)) {
      set({
        nodes: nodes.filter((n) => n.id !== id),
        edges: edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: null,
      });
      return;
    }

    // Delete main node + connected decision nodes
    const connectedDecisions = edges
      .filter((e) => e.source === id || e.target === id)
      .map((e) => (e.source === id ? e.target : e.source))
      .filter((decId) => {
        const decNode = nodes.find((n) => n.id === decId);
        return decNode && isDecisionNode(decNode);
      });

    const toDelete = new Set([id, ...connectedDecisions]);
    
    set({
      nodes: nodes.filter((n) => !toDelete.has(n.id)),
      edges: edges.filter(
        (e) => !toDelete.has(e.source) && !toDelete.has(e.target)
      ),
      selectedNodeId: null,
    });
  },

  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id !== id) return n;
        
        // Preserve the node type when updating
        if (isMainNode(n)) {
          return { ...n, data: data as MainNodeData } as MainNode;
        } else {
          return { ...n, data: data as DecisionNodeData } as DecisionNode;
        }
      }),
    })),

  insertDecisionBetweenMainNodes: (sourceId, targetId) => {
    const { nodes, edges } = get();
    const sourceNode = nodes.find((n) => n.id === sourceId);
    const targetNode = nodes.find((n) => n.id === targetId);
    
    if (!sourceNode || !targetNode) return null;
    if (!isMainNode(sourceNode) || !isMainNode(targetNode)) return null;
    if (sourceNode.position.x >= targetNode.position.x) return null;

    const decisionCount = nodes.filter(isDecisionNode).length;
    const decisionId = `decision-${Date.now()}`;
    
    const decisionNode: DecisionNode = {
      id: decisionId,
      type: "decision",
      position: {
        x: (sourceNode.position.x + targetNode.position.x) / 2,
        y: sourceNode.position.y + edges.filter((e) => e.source === sourceId).length * 60,
      },
      data: {
        label: `Decyzja ${decisionCount + 1}`,
        deltas: {},
      },
    };

    const edge1: FlowEdge = {
      id: `e-${sourceId}-${decisionId}`,
      source: sourceId,
      target: decisionId,
      animated: true,
    };

    const edge2: FlowEdge = {
      id: `e-${decisionId}-${targetId}`,
      source: decisionId,
      target: targetId,
      animated: true,
    };

    set({
      nodes: [...nodes, decisionNode],
      edges: [...edges, edge1, edge2],
      selectedNodeId: decisionId,
    });

    return decisionId;
  },

  getCurrentNode: (currentNodeId) =>
    currentNodeId ? get().nodes.find((n) => n.id === currentNodeId) : undefined,

  getCurrentDecisions: (currentNodeId) => {
    const { nodes, edges } = get();
    if (!currentNodeId) return [];
    
    return edges
      .filter((e) => e.source === currentNodeId)
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter((n): n is DecisionNode => n !== undefined && isDecisionNode(n));
  },

  getSelectedNode: () => {
    const { nodes, selectedNodeId } = get();
    return selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : undefined;
  },
}));