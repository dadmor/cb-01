// ------ src/flowStore.ts ------
import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from "reactflow";

type NodeT = any;
type EdgeT = any;

export const START_NODE_ID = "main-1";

// ===== Initial Data przeniesione z App.tsx =====
const initialNodes: NodeT[] = [
  {
    id: "main-1",
    type: "main",
    position: { x: 50, y: 100 },
    data: { label: "Wejście do zamku", durationSec: 10 },
  },
  {
    id: "decision-1-1",
    type: "decision",
    position: { x: 320, y: 50 },
    data: { label: "Weź klucz", deltas: { klucz: 1 } },
  },
  {
    id: "decision-1-2",
    type: "decision",
    position: { x: 320, y: 150 },
    data: { label: "Weź miecz", deltas: { miecz: 1 } },
  },
  {
    id: "main-2",
    type: "main",
    position: { x: 550, y: 100 },
    data: { label: "Sala główna", durationSec: 0 },
  },
  {
    id: "decision-2-1",
    type: "decision",
    position: { x: 820, y: 50 },
    data: { label: "Wyjdź", deltas: {} },
  },
  {
    id: "decision-2-2",
    type: "decision",
    position: { x: 820, y: 150 },
    data: { label: "Walcz", deltas: {} },
  },
  {
    id: "main-3",
    type: "main",
    position: { x: 1050, y: 50 },
    data: {
      label: "Wyjście z zamku",
      condition: { varName: "klucz", op: "gte", value: 1 },
      durationSec: 0,
    },
  },
  {
    id: "main-4",
    type: "main",
    position: { x: 1050, y: 150 },
    data: {
      label: "Walka ze strażnikiem",
      condition: { varName: "miecz", op: "gte", value: 1 },
      durationSec: 0,
    },
  },
];

const initialEdges: EdgeT[] = [
  { id: "e1-1", source: "main-1", target: "decision-1-1", animated: true },
  { id: "e1-2", source: "main-1", target: "decision-1-2", animated: true },
  { id: "e1-1-2", source: "decision-1-1", target: "main-2", animated: true },
  { id: "e1-2-2", source: "decision-1-2", target: "main-2", animated: true },
  { id: "e2-1", source: "main-2", target: "decision-2-1", animated: true },
  { id: "e2-2", source: "main-2", target: "decision-2-2", animated: true },
  { id: "e2-1-3", source: "decision-2-1", target: "main-3", animated: true },
  { id: "e2-2-4", source: "decision-2-2", target: "main-4", animated: true },
];

// ===== Store =====
type FlowState = {
  nodes: NodeT[];
  edges: EdgeT[];
  selectedNodeId: string | null;

  // akcje
  setSelectedNode: (id: string | null) => void;
  applyNodesChange: (changes: NodeChange[]) => void;
  applyEdgesChange: (changes: EdgeChange[]) => void;

  addMainNode: () => void;
  deleteNode: (id: string) => void;
  updateNode: (id: string, data: any) => void;

  insertDecisionBetweenMainNodes: (sourceId: string, targetId: string) => string | null;

  // selektory/projekcje
  getCurrentNode: (currentNodeId: string | null) => NodeT | undefined;
  getCurrentDecisions: (currentNodeId: string | null) => NodeT[];
  getSelectedNode: () => NodeT | undefined;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: null,

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  applyNodesChange: (changes) =>
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),
  applyEdgesChange: (changes) =>
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

  addMainNode: () => {
    const { nodes } = get();
    const lastMain = nodes
      .filter((n) => n.type === "main")
      .sort((a, b) => b.position.x - a.position.x)[0];
    const id = `main-${Date.now()}`;
    const newNode = {
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

    if (node.type === "decision") {
      set({
        nodes: nodes.filter((n) => n.id !== id),
        edges: edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: null,
      });
      return;
    }

    // usuwanie main + podpiętych decision
    const connectedDecisions = edges
      .filter((e) => e.source === id || e.target === id)
      .map((e) => (e.source === id ? e.target : e.source))
      .filter((decId) => nodes.find((n) => n.id === decId)?.type === "decision");

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
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, data } : n)),
    })),

  insertDecisionBetweenMainNodes: (sourceId, targetId) => {
    const { nodes, edges } = get();
    const sourceNode = nodes.find((n) => n.id === sourceId);
    const targetNode = nodes.find((n) => n.id === targetId);
    if (!sourceNode || !targetNode) return null;
    if (sourceNode.type !== "main" || targetNode.type !== "main") return null;
    if (sourceNode.position.x >= targetNode.position.x) return null;

    const decisionId = `decision-${Date.now()}`;
    const decisionNode: NodeT = {
      id: decisionId,
      type: "decision",
      position: {
        x: (sourceNode.position.x + targetNode.position.x) / 2,
        y:
          sourceNode.position.y +
          edges.filter((e) => e.source === sourceId).length * 60,
      },
      data: {
        label: `Decyzja ${nodes.filter((n) => n.type === "decision").length + 1}`,
        deltas: {},
      },
    };

    const edge1: EdgeT = {
      id: `e-${sourceId}-${decisionId}`,
      source: sourceId,
      target: decisionId,
      animated: true,
    };

    const edge2: EdgeT = {
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
    get().nodes.find((n) => n.id === currentNodeId),

  getCurrentDecisions: (currentNodeId) => {
    const { nodes, edges } = get();
    if (!currentNodeId) return [];
    return edges
      .filter((e) => e.source === currentNodeId)
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter((n: any) => n && n.type === "decision");
  },

  getSelectedNode: () => {
    const { nodes, selectedNodeId } = get();
    return nodes.find((n) => n.id === selectedNodeId);
  },
}));
