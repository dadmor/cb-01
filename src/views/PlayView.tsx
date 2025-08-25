// src/views/PlayView.tsx
import React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  ConnectionLineType,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useFlowStore } from "@/modules/flow/store/useFlowStore";
import { isSceneNode, isChoiceNode } from "@/modules/flow/types";
import { SceneNode } from "@/modules/flow/nodes/SceneNode";
import { ChoiceNode } from "@/modules/flow/nodes/ChoiceNode";
import { usePlayStore } from "@/modules/play/usePlayStore";
import { useVariablesStore } from "@/modules/variables/store/useVariablesStore";
import { evalConditions, applyEffects } from "@/modules/variables/logic";

const nodeTypes: NodeTypes = {
  scene: SceneNode,
  choice: ChoiceNode,
};

const defaultEdgeOptions = {
  type: "smoothstep" as const,
  markerEnd: { type: "arrow" as const },
  style: { strokeWidth: 2, stroke: "#52525b" },
};

export const PlayView: React.FC = () => {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const getChoicesForScene = useFlowStore((s) => s.getChoicesForScene);

  const currentSceneId = usePlayStore((s) => s.currentSceneId);
  const start = usePlayStore((s) => s.start);
  const goTo = usePlayStore((s) => s.goTo);
  const resetPlay = usePlayStore((s) => s.reset);

  const variables = useVariablesStore((s) => s.variables);
  const loadVariables = useVariablesStore((s) => s.loadVariables);

  const { setCenter, fitView, getZoom } = useReactFlow();

  // Referencja do ostatnio wycentrowanego node'a aby uniknąć powtórnego centrowania
  const lastCenteredRef = React.useRef<string | null>(null);
  
  // Flag do śledzenia czy to pierwsza inicjalizacja
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (!currentSceneId) start();
  }, [currentSceneId, start]);

  const currentScene = React.useMemo(
    () => nodes.find((n) => n.id === currentSceneId && isSceneNode(n)),
    [nodes, currentSceneId]
  );

  // Inicjalne fitView przy pierwszym renderze
  React.useEffect(() => {
    if (isFirstRender.current && nodes.length > 0) {
      isFirstRender.current = false;
      // Poczekaj na następną klatkę aby ReactFlow się zainicjalizował
      requestAnimationFrame(() => {
        fitView({
          padding: 0.2,
          duration: 800,
          maxZoom: 1.0,
          minZoom: 0.5
        });
      });
    }
  }, [nodes.length, fitView]);

  // Płynne przesuwanie do aktualnej sceny
  React.useEffect(() => {
    if (!currentScene) return;
    
    // Unikaj powtórnego centrowania tego samego node'a
    if (lastCenteredRef.current === currentScene.id) return;
    
    // Zakładając że SceneNode ma rozmiar ~240x240, więc środek to +120
    const nodeCenterX = currentScene.position.x + 120;
    const nodeCenterY = currentScene.position.y + 120;
    
    // Zachowaj obecny zoom lub użyj domyślnego
    const currentZoom = getZoom();
    const targetZoom = currentZoom < 0.5 ? 0.8 : currentZoom;
    
    // Użyj setCenter z animacją
    setCenter(nodeCenterX, nodeCenterY, {
      zoom: targetZoom,
      duration: 600,
    }).then(() => {
      lastCenteredRef.current = currentScene.id;
    });
    
  }, [currentScene, setCenter, getZoom]);

  const choices = React.useMemo(() => {
    if (!currentScene) return [];
    return getChoicesForScene(currentScene.id);
  }, [currentScene, getChoicesForScene]);

  const getTargetSceneForChoice = React.useCallback(
    (choiceId: string) => {
      const e = edges.find((e) => e.source === choiceId);
      if (!e) return undefined;
      const n = nodes.find((n) => n.id === e.target);
      return n && isSceneNode(n) ? n : undefined;
    },
    [edges, nodes]
  );

  const handleChoose = (choiceId: string) => {
    const choiceNode = nodes.find((n) => n.id === choiceId);
    if (!choiceNode || !isChoiceNode(choiceNode)) return;
    const nextScene = getTargetSceneForChoice(choiceId);
    if (!nextScene) return;
    const unlocked = evalConditions(nextScene.data.conditions, variables);
    if (!unlocked) return;
    const nextVars = applyEffects(choiceNode.data.effects || {}, variables);
    loadVariables(nextVars);
    
    // Resetuj referencję aby wymusić animację do nowej sceny
    lastCenteredRef.current = null;
    goTo(nextScene.id);
  };

  const handleRestart = () => {
    lastCenteredRef.current = null;
    isFirstRender.current = true;
    resetPlay();
  };

  // Tylko bieżąca scena ma selected = true (pomarańczowa ramka)
  const cleanNodes = React.useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        selected: n.id === currentSceneId,
        draggable: false,
        data: {
          ...n.data,
          isCurrent: n.id === currentSceneId,
        },
      })),
    [nodes, currentSceneId]
  );

  const cleanEdges = React.useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        selected: false,
      })),
    [edges]
  );

  return (
    <div className="h-full flex">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={cleanNodes}
          edges={cleanEdges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionLineType={ConnectionLineType.SmoothStep}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          selectNodesOnDrag={false}
          selectionOnDrag={false}
          selectionKeyCode={null as unknown as string}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          // Usuń fitView prop - kontrolujemy to programowo
        >
          <Controls />
          <MiniMap />
          <Background gap={24} size={1} />
        </ReactFlow>
      </div>

      <div className="w-[350px] bg-[#1e1e1e] border-l border-[#0a0a0a] flex flex-col">
        <div className="h-8 bg-[#252525] border-b border-[#0a0a0a] flex items-center px-3 justify-between">
          <span className="text-xs text-[#999] font-medium">PLAY</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="px-2 py-1 text-[11px] bg-[#2a2a2a] border border-[#3a3a3a] text-[#bbb] hover:bg-[#333] transition-colors"
            >
              Restart
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4">
            <div className="text-[11px] text-[#777] mb-1">Current Scene</div>
            <div className="text-sm text-[#ddd] font-semibold">
              {currentScene ? currentScene.data.label : "—"}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-[#777] mb-2">Choices</div>
            <div className="flex flex-col gap-2">
              {choices.map((c) => {
                const target = getTargetSceneForChoice(c.id);
                const unlocked =
                  !!target && evalConditions(target.data.conditions, variables);
                return (
                  <button
                    key={c.id}
                    onClick={() => handleChoose(c.id)}
                    disabled={!unlocked}
                    className={`text-left px-3 py-2 text-xs border transition-all ${
                      unlocked
                        ? "bg-[#2a2a2a] border-[#3a3a3a] text-[#ddd] hover:bg-[#333] hover:border-[#4a4a4a]"
                        : "bg-[#1a1a1a] border-[#2a2a2a] text-[#666] cursor-not-allowed opacity-50"
                    }`}
                  >
                    {c.data.label}
                  </button>
                );
              })}
              {choices.length === 0 && (
                <div className="text-[11px] text-[#666] italic">No choices available</div>
              )}
            </div>
          </div>
        </div>

        <div className="h-6 bg-[#1a1a1a] border-t border-[#0a0a0a] px-3 text-[11px] text-[#666] flex items-center justify-between">
          <span>{nodes.length} nodes • {edges.length} edges</span>
          <span>{currentScene ? `Scene: ${currentScene.id}` : "Ready"}</span>
        </div>
      </div>
    </div>
  );
};