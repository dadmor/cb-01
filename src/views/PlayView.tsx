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
import { isSceneNode, isChoiceNode, type SceneNode } from "@/modules/flow/types";
import { SceneNode as SceneNodeComponent } from "@/modules/flow/nodes/SceneNode";
import { ChoiceNode as ChoiceNodeComponent } from "@/modules/flow/nodes/ChoiceNode";
import { usePlayStore } from "@/modules/play/usePlayStore";
import { useVariablesStore } from "@/modules/variables/store/useVariablesStore";
import { evalConditions, applyEffects } from "@/modules/variables/logic";
import { VideoPlayer } from "@/views/video/VideoPlayer";
import { useVideoPlayerStore } from "@/modules/video";
import { Clock } from "lucide-react";
import {
  Button,
  Card,
  Panel,
  PanelContent,
  PanelFooter,
  PanelHeader,
} from "@/components/ui";

const nodeTypes: NodeTypes = {
  scene: SceneNodeComponent,
  choice: ChoiceNodeComponent,
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

  const videoUrl = useVideoPlayerStore((s) => s.currentVideoUrl);
  const videoDur = useVideoPlayerStore((s) => s.duration);
  const videoTime = useVideoPlayerStore((s) => s.currentTime);

  const secondsLeft = React.useMemo(() => {
    if (videoUrl && Number.isFinite(videoDur) && Number.isFinite(videoTime)) {
      return Math.ceil(Math.max(0, (videoDur || 0) - (videoTime || 0)));
    }
    return null;
  }, [videoUrl, videoDur, videoTime]);

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

  // Struktura dla UI: Choice -> dostępne Scene za nim
  const choicesWithTargets = React.useMemo(() => {
    return choices.map(choice => {
      // Znajdź wszystkie sceny za tym Choice
      const outgoingEdges = edges.filter(e => e.source === choice.id);
      const targetScenes = outgoingEdges
        .map(e => nodes.find(n => n.id === e.target))
        .filter((n): n is SceneNode => !!n && isSceneNode(n));
      
      // Filtruj tylko te które spełniają warunki
      const availableScenes = targetScenes.filter(scene => 
        evalConditions(scene.data.conditions, variables)
      );
      
      return {
        choice,
        targets: availableScenes
      };
    }).filter(item => item.targets.length > 0); // Pokaż tylko Choice które prowadzą do dostępnych scen
  }, [choices, edges, nodes, variables]);

  const handleChoiceClick = React.useCallback(
    (choiceId: string, targetSceneId: string) => {
      const choice = nodes.find(n => n.id === choiceId);
      if (!choice || !isChoiceNode(choice)) return;

      // Aplikuj efekty Choice
      const nextVars = applyEffects(choice.data.effects || {}, variables);
      loadVariables(nextVars);

      // Przejdź do wybranej sceny
      lastCenteredRef.current = null;
      goTo(targetSceneId);
    },
    [nodes, variables, loadVariables, goTo]
  );

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
    <div className="flex h-full min-h-0">
      {/* Canvas with flow graph */}
      <div className="flex-1 bg-zinc-950 min-h-0">
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

      {/* Control sidebar */}
      <Panel className="w-[420px] border-l border-zinc-800 flex flex-col min-h-0">
        <PanelHeader
          title="Play"
          actions={
            <div className="flex items-center gap-2">
              {secondsLeft !== null && (
                <div className="flex items-center gap-1 text-zinc-300 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{secondsLeft}s</span>
                </div>
              )}
              <Button size="xs" onClick={handleRestart}>
                Restart
              </Button>
            </div>
          }
        />

        {/* STACK: Video (card) -> Title (card) -> Choices (card) */}
        <PanelContent className="space-y-3">
          {/* Video */}
          <Card title="Video" className="p-0 overflow-hidden">
            <div className="h-[360px] md:h-[420px] lg:h-[480px] flex flex-col min-h-0">
              <VideoPlayer />
            </div>
          </Card>

          {/* Title */}
          <Card title="Current Scene">
            <span
              className={`text-xs ${
                currentScene ? "text-zinc-300" : "text-zinc-600"
              }`}
            >
              {currentScene ? currentScene.data.label : "—"}
            </span>
          </Card>

          {/* Choices */}
          <Card title="Choices">
            {choicesWithTargets.length > 0 ? (
              <div className="space-y-2">
                {choicesWithTargets.map(({ choice, targets }) => {
                  // Jeśli Choice prowadzi tylko do jednej dostępnej sceny
                  if (targets.length === 1) {
                    return (
                      <Button
                        key={choice.id}
                        variant="primary"
                        onClick={() => handleChoiceClick(choice.id, targets[0].id)}
                        className="w-full justify-start"
                      >
                        {choice.data.label}
                      </Button>
                    );
                  }
                  
                  // Jeśli Choice prowadzi do wielu dostępnych scen
                  // To pokazuje którą scenę wybierasz (dla debugowania)
                  return (
                    <div key={choice.id} className="border border-zinc-700 rounded p-2">
                      <p className="text-xs text-zinc-400 mb-2">{choice.data.label}:</p>
                      <div className="space-y-1">
                        {targets.map(target => (
                          <Button
                            key={target.id}
                            variant="primary"
                            size="xs"
                            onClick={() => handleChoiceClick(choice.id, target.id)}
                            className="w-full justify-start"
                          >
                            → {target.data.label}
                            {target.data.isPriority && (
                              <span className="ml-2 text-yellow-400">★</span>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-600 text-center py-4">
                No choices available
              </p>
            )}
          </Card>
        </PanelContent>

        <PanelFooter>
          <span>
            {nodes.length} nodes • {edges.length} edges
          </span>
          <span className="ml-auto">
            {currentScene ? `Scene: ${currentScene.id}` : "Ready"}
          </span>
        </PanelFooter>
      </Panel>
    </div>
  );
};