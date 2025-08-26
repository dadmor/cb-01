// src/views/PlayView.tsx - PROPERLY REFACTORED
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
import { VideoPlayer } from "@/views/video/VideoPlayer";
import { useVideoPlayerStore } from "@/modules/video";
import { Clock } from 'lucide-react';
import { 
  Button, 
  Card, 
  Panel, 
  PanelContent, 
  PanelFooter, 
  PanelHeader,
  FlexContainer,
  CanvasContainer,
  VideoContainer,
  EmptyState,
  StatusText
} from "@/components/ui";

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

  const getTargetSceneForChoice = React.useCallback(
    (choiceId: string) => {
      const e = edges.find((e) => e.source === choiceId);
      if (!e) return undefined;
      const n = nodes.find((n) => n.id === e.target);
      return n && isSceneNode(n) ? n : undefined;
    },
    [edges, nodes]
  );

  const continueViaChoice = React.useCallback(
    (choiceId: string) => {
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
    },
    [nodes, getTargetSceneForChoice, variables, loadVariables, goTo]
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
    <FlexContainer direction="row" fullHeight>
      {/* Canvas z grafem */}
      <CanvasContainer>
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
      </CanvasContainer>

      {/* Panel kontrolny */}
      <Panel className="w-[420px] border-l border-zinc-800">
        <PanelHeader 
          title="Play" 
          compact
          actions={
            <FlexContainer>
              {secondsLeft !== null && (
                <FlexContainer className="gap-1 text-zinc-300 text-xs">
                  <Clock className="w-3 h-3" />
                  <StatusText>{secondsLeft}s</StatusText>
                </FlexContainer>
              )}
              <Button variant="default" size="xs" onClick={handleRestart}>
                Restart
              </Button>
            </FlexContainer>
          }
        />

        {/* Sekcja video */}
        <VideoContainer>
          <VideoPlayer />
        </VideoContainer>

        {/* Informacje i wybory */}
        <PanelContent className="flex-1 overflow-y-auto">
          <Card title="Current Scene" compact>
            <StatusText size="sm" variant={currentScene ? 'default' : 'muted'}>
              {currentScene ? currentScene.data.label : "—"}
            </StatusText>
          </Card>

          <Card title="Choices" compact className="mt-3">
            <FlexContainer direction="col" className="gap-2">
              {choices.length > 0 ? (
                choices.map((c) => {
                  const target = getTargetSceneForChoice(c.id);
                  const unlocked = !!target && evalConditions(target.data.conditions, variables);
                  return (
                    <Button
                      key={c.id}
                      variant={unlocked ? "primary" : "default"}
                      size="sm"
                      onClick={() => continueViaChoice(c.id)}
                      disabled={!unlocked}
                      className="w-full justify-start"
                    >
                      {c.data.label}
                    </Button>
                  );
                })
              ) : (
                <EmptyState title="No choices available" />
              )}
            </FlexContainer>
          </Card>
        </PanelContent>

        <PanelFooter>
          <StatusText variant="muted" size="xs">
            {nodes.length} nodes • {edges.length} edges
          </StatusText>
          <StatusText variant="muted" size="xs" className="ml-auto">
            {currentScene ? `Scene: ${currentScene.id}` : "Ready"}
          </StatusText>
        </PanelFooter>
      </Panel>
    </FlexContainer>
  );
};