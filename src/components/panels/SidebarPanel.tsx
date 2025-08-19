// ------ src/components/panels/SidebarPanel.tsx ------
import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Label } from "../ui";
import { NodeEditor } from "./NodeEditor";
import { VariablesSection } from "./VariablesSection";
import { useGameStore } from "@/gameStore";
import { START_NODE_ID, useFlowStore } from "@/flowStore";
import { useNodeRuntime } from "../..//components/flow/hooks";

export const SidebarPanel: React.FC = () => {
  const mode = useGameStore((s) => s.mode);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const stopPlay = useGameStore((s) => s.stopPlay);
  const startPlay = useGameStore((s) => s.startPlay);
  const reset = useGameStore((s) => s.reset);
  const currentNodeId = useGameStore((s) => s.currentNodeId);

  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const setSelectedNode = useFlowStore((s) => s.setSelectedNode);
  const addMainNode = useFlowStore((s) => s.addMainNode);
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const updateNode = useFlowStore((s) => s.updateNode);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );
  const currentNode = useMemo(
    () => nodes.find((n) => n.id === currentNodeId),
    [nodes, currentNodeId]
  );
  const currentDecisions = useMemo(() => {
    if (!currentNode || currentNode.type !== "main") return [];
    return edges
      .filter((e) => e.source === currentNode.id)
      .map((e) => nodes.find((n) => n?.id === e.target))
      .filter((n) => n && n.type === "decision") as any[];
  }, [currentNode, edges, nodes]);

  const { remainingMs } = useNodeRuntime(currentNode, nodes, edges);

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {mode === "edit" ? "Tryb edycji" : "Tryb gry"}
            {mode === "play" && isGameOver && (
              <Badge variant="destructive" className="ml-2">
                Koniec gry
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {mode === "edit" ? (
              <Button size="sm" onClick={() => startPlay(START_NODE_ID)}>
                Start gry
              </Button>
            ) : (
              <>
                <Button size="sm" variant="secondary" onClick={() => reset(START_NODE_ID)}>
                  Reset
                </Button>
                <Button size="sm" variant="outline" onClick={stopPlay}>
                  Zakończ
                </Button>
              </>
            )}
          </div>
        </div>
        {mode === "play" && currentNode && (
          <div className="text-sm text-zinc-500">
            {currentNode.data.label}
            {(currentNode.data.durationSec ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-2">
                {Math.ceil(remainingMs / 1000)}s
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto space-y-4 p-4">
        {/* Tryb GRY */}
        {mode === "play" && !isGameOver && currentNode?.type === "main" && (
          <div className="space-y-2">
            <Label>Dostępne decyzje</Label>
            {currentDecisions.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Brak dostępnych decyzji - koniec gry
              </p>
            ) : (
              <p className="text-sm text-zinc-500">
                Kliknij na decyzję w grafie aby kontynuować
              </p>
            )}
          </div>
        )}

        {/* Tryb EDYCJI */}
        {mode === "edit" && (
          <>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={addMainNode}
                className="flex-1"
              >
                + Nowy blok główny
              </Button>
              {selectedNode && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (selectedNode.id !== START_NODE_ID) {
                      deleteNode(selectedNode.id);
                    }
                  }}
                  disabled={selectedNode.id === START_NODE_ID}
                >
                  Usuń
                </Button>
              )}
            </div>

            {selectedNode && (
              <NodeEditor
                node={selectedNode}
                nodes={nodes}
                edges={edges}
                onUpdate={(data) => updateNode(selectedNode.id, data)}
              />
            )}
          </>
        )}

        {/* Zmienne globalne - zawsze widoczne */}
        <VariablesSection />
      </CardContent>
    </Card>
  );
};
