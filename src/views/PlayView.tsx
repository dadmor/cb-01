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

  const lastCenteredRef = React.useRef<string | null>(null);
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (!currentSceneId) start();
  }, [currentSceneId, start]);

  const currentScene = React.useMemo(
    () => nodes.find((n) => n.id === currentSceneId && isSceneNode(n)),
    [nodes, currentSceneId]
  );

  React.useEffect(() => {
    if (isFirstRender.current && nodes.length > 0) {
      isFirstRender.current = false;
      requestAnimationFrame(() => {
        fitView({
          padding: 0.2,
          duration: 800,
          maxZoom: 1.0,
          minZoom: 0.5,
        });
      });
    }
  }, [nodes.length, fitView]);

  React.useEffect(() => {
    if (!currentScene) return;
    if (lastCenteredRef.current === currentScene.id) return;

    const nodeCenterX = currentScene.position.x + 120;
    const nodeCenterY = currentScene.position.y + 120;

    const currentZoom = getZoom();
    const targetZoom = currentZoom < 0.5 ? 0.8 : currentZoom;

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
    lastCenteredRef.current = null;
    goTo(nextScene.id);
  };

  const handleRestart = () => {
    lastCenteredRef.current = null;
    isFirstRender.current = true;
    resetPlay();
  };

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
        >
          <Controls />
          <MiniMap />
          <Background gap={24} size={1} />
        </ReactFlow>
      </div>

      {/* Panel boczny */}
      <div className="w-[350px] bg-zinc-800 border-l border-zinc-900 flex flex-col">
        {/* Pasek tytułu – jak w przykładzie */}
        <div className="h-8 bg-zinc-600/20 border-b border-zinc-900 flex items-center px-3 justify-between">
          <span className="text-xs text-zinc-400 font-medium">PLAY</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="px-2 py-1 text-[11px] bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Restart
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4">
            <div className="text-[11px] text-zinc-500 mb-1">Current Scene</div>
            <div className="text-sm text-zinc-200 font-semibold">
              {currentScene ? currentScene.data.label : "—"}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-zinc-500 mb-2">Choices</div>
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
                    className={`text-left px-3 py-2 text-xs border transition-all rounded ${
                      unlocked
                        ? "bg-blue-800 border-zinc-700 text-zinc-200 hover:bg-blue-700 hover:border-zinc-600"
                        : "bg-blue-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50"
                    }`}
                  >
                    {c.data.label}
                  </button>
                );
              })}
              {choices.length === 0 && (
                <div className="text-[11px] text-zinc-600 italic">
                  No choices available
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-6 bg-zinc-900 border-t border-zinc-900 px-3 text-[11px] text-zinc-600 flex items-center justify-between">
          <span>
            {nodes.length} nodes • {edges.length} edges
          </span>
          <span>{currentScene ? `Scene: ${currentScene.id}` : "Ready"}</span>
        </div>
      </div>
    </div>
  );
};
