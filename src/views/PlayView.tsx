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
import { isSceneNode } from "@/modules/flow/types";
import { SceneNode } from "@/modules/flow/nodes/SceneNode";
import { ChoiceNode } from "@/modules/flow/nodes/ChoiceNode";
import { usePlayStore } from "@/modules/play/usePlayStore";
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

/* ============================================
   PLAY VIEW - WIDOK ODTWARZANIA
   
   Ten komponent jest TYLKO interfejsem użytkownika.
   CAŁA logika przepływu, wyboru scen i priorytetów jest w usePlayStore.
   
   Odpowiedzialności:
   - Wyświetlanie grafu w trybie odtwarzania
   - Wyświetlanie dostępnych Choice
   - Delegowanie kliknięć do store (executeChoice)
   - Prezentacja stanu (obecna scena, wideo, czas)
   
   NIE zawiera:
   - Logiki wyboru scen
   - Logiki priorytetów
   - Aplikowania efektów
   ============================================ */

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

  const currentSceneId = usePlayStore((s) => s.currentSceneId);
  const start = usePlayStore((s) => s.start);
  const resetPlay = usePlayStore((s) => s.reset);
  const executeChoice = usePlayStore((s) => s.executeChoice);
  const getAvailableChoices = usePlayStore((s) => s.getAvailableChoices);

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

  // Pobierz dostępne Choice ze store
  const availableChoices = React.useMemo(
    () => getAvailableChoices(),
    [getAvailableChoices, currentSceneId] // odśwież gdy zmieni się scena
  );

  const handleChoiceClick = (choiceId: string) => {
    // Deleguj całą logikę do store
    const success = executeChoice(choiceId);
    if (success) {
      lastCenteredRef.current = null; // reset do nowej sceny
    }
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
          <Card title="Title">
            <span
              className={`text-xs ${
                currentScene ? "text-zinc-300" : "text-zinc-600"
              }`}
            >
              {currentScene ? currentScene.data.label : "—"}
            </span>
          </Card>

          {/* Choices - PROSTA LISTA, logika w store */}
          <Card title="Choices">
            {availableChoices.length > 0 ? (
              <div className="space-y-2">
                {availableChoices.map((choice) => (
                  <Button
                    key={choice.id}
                    variant="primary"
                    onClick={() => handleChoiceClick(choice.id)}
                    className="w-full justify-start"
                  >
                    {choice.data.label}
                  </Button>
                ))}
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