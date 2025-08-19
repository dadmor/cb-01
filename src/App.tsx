// ------ src/App.tsx ------
import React, { useState, useCallback, useMemo } from "react";
import { Card } from "./components/ui";
import { FlowCanvas } from "./components/flow/FlowCanvas";
import { SidebarPanel } from "./components/panels/SidebarPanel";
import { useNodeRuntime } from "./components/flow/hooks";
import { useGameStore } from "./gameStore";
import {
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from "reactflow";

// ===== Initial Data =====
const initialNodes = [
  { 
    id: "main-1", 
    type: "main",
    position: { x: 50, y: 100 }, 
    data: { label: "Wejście do zamku", durationSec: 10 }
  },
  { 
    id: "decision-1-1", 
    type: "decision",
    position: { x: 320, y: 50 }, 
    data: { label: "Weź klucz", deltas: { klucz: 1 } }
  },
  { 
    id: "decision-1-2", 
    type: "decision",
    position: { x: 320, y: 150 }, 
    data: { label: "Weź miecz", deltas: { miecz: 1 } }
  },
  { 
    id: "main-2", 
    type: "main",
    position: { x: 550, y: 100 }, 
    data: { label: "Sala główna", durationSec: 0 }
  },
  { 
    id: "decision-2-1", 
    type: "decision",
    position: { x: 820, y: 50 }, 
    data: { label: "Wyjdź", deltas: {} }
  },
  { 
    id: "decision-2-2", 
    type: "decision",
    position: { x: 820, y: 150 }, 
    data: { label: "Walcz", deltas: {} }
  },
  { 
    id: "main-3", 
    type: "main",
    position: { x: 1050, y: 50 }, 
    data: { label: "Wyjście z zamku", condition: { varName: "klucz", op: "gte", value: 1 }, durationSec: 0 }
  },
  { 
    id: "main-4", 
    type: "main",
    position: { x: 1050, y: 150 }, 
    data: { label: "Walka ze strażnikiem", condition: { varName: "miecz", op: "gte", value: 1 }, durationSec: 0 }
  },
];

const initialEdges = [
  { id: "e1-1", source: "main-1", target: "decision-1-1", animated: true },
  { id: "e1-2", source: "main-1", target: "decision-1-2", animated: true },
  { id: "e1-1-2", source: "decision-1-1", target: "main-2", animated: true },
  { id: "e1-2-2", source: "decision-1-2", target: "main-2", animated: true },
  { id: "e2-1", source: "main-2", target: "decision-2-1", animated: true },
  { id: "e2-2", source: "main-2", target: "decision-2-2", animated: true },
  { id: "e2-1-3", source: "decision-2-1", target: "main-3", animated: true },
  { id: "e2-2-4", source: "decision-2-2", target: "main-4", animated: true },
];

const START_NODE_ID = "main-1";

// ===== Main Component =====
export default function InteractiveFilmFlow() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const mode = useGameStore((s) => s.mode);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const setCurrentNode = useGameStore((s) => s.setCurrentNode);
  const startPlay = useGameStore((s) => s.startPlay);
  const reset = useGameStore((s) => s.reset);

  // Initialize current node only when playing
  React.useEffect(() => {
    if (mode === "play" && !currentNodeId) {
      setCurrentNode(START_NODE_ID);
    }
  }, [mode, currentNodeId, setCurrentNode]);

  const currentNode = useMemo(
    () => nodes.find((n) => n.id === currentNodeId),
    [nodes, currentNodeId]
  );
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const { remainingMs } = useNodeRuntime(currentNode, nodes, edges);

  // Get decisions for current main node
  const currentDecisions = useMemo(() => {
    if (!currentNode || currentNode.type !== "main") return [];
    return edges
      .filter((e) => e.source === currentNode.id)
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter((n) => n && n.type === "decision");
  }, [currentNode, edges, nodes]);

  // React Flow: kontrolowane zmiany (wydajne, brak pętli)
  const handleFlowNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  const handleFlowEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  const handleAddMainNode = useCallback(() => {
    const newNodeId = `main-${Date.now()}`;
    const lastMainNode = nodes
      .filter((n) => n.type === "main")
      .sort((a, b) => b.position.x - a.position.x)[0];
    const newNode = {
      id: newNodeId,
      type: "main",
      position: {
        x: (lastMainNode?.position.x || 0) + 300,
        y: lastMainNode?.position.y || 100,
      },
      data: { label: "Nowy blok", durationSec: 0 },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNodeId);
  }, [nodes]);

  const handleNodeDelete = useCallback(() => {
    if (!selectedNodeId || selectedNodeId === START_NODE_ID) return;

    const nodeToDelete = nodes.find((n) => n.id === selectedNodeId);
    if (!nodeToDelete) return;

    if (nodeToDelete.type === "decision") {
      setEdges((eds) =>
        eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId)
      );
    } else {
      const connectedDecisions = edges
        .filter((e) => e.source === selectedNodeId || e.target === selectedNodeId)
        .map((e) => (e.source === selectedNodeId ? e.target : e.source))
        .filter((id) => nodes.find((n) => n.id === id)?.type === "decision");

      const nodesToDelete = [selectedNodeId, ...connectedDecisions];
      setNodes((nds) => nds.filter((n) => !nodesToDelete.includes(n.id)));
      setEdges((eds) =>
        eds.filter(
          (e) => !nodesToDelete.includes(e.source) && !nodesToDelete.includes(e.target)
        )
      );
    }

    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setSelectedNodeId(null);
  }, [selectedNodeId, nodes, edges]);

  const handleUpdateNode = useCallback((nodeId: string, data: any) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data } : n)));
  }, []);

  return (
    <div className="w-screen h-screen grid grid-cols-[1fr_400px] gap-3 p-3 bg-zinc-50">
      {/* Graf */}
      <Card className="relative overflow-hidden">
        <FlowCanvas
          // selekcja
          selectedNodeId={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
          // kontrolowane grafy
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          onNodesChange={handleFlowNodesChange}
          onEdgesChange={handleFlowEdgesChange}
        />
      </Card>

      {/* Panel */}
      <SidebarPanel
        selectedNode={selectedNode}
        currentNode={currentNode}
        nodes={nodes}
        edges={edges}
        currentDecisions={currentDecisions}
        remainingMs={remainingMs}
        onAddMainNode={handleAddMainNode}
        onDeleteNode={handleNodeDelete}
        onUpdateNode={handleUpdateNode}
        onStartPlay={() => startPlay(START_NODE_ID)}
        onReset={() => reset(START_NODE_ID)}
      />
    </div>
  );
}
