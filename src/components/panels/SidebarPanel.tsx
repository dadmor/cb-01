// ------ src/components/panels/SidebarPanel.tsx ------
import React, { useMemo, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Label } from "../ui";
import { NodeEditor } from "./NodeEditor";
import { VariablesSection } from "./VariablesSection";
import { useGameStore } from "@/gameStore";
import { useVideoStore } from "@/videoStore";
import { START_NODE_ID, useFlowStore, isMainNode, isDecisionNode } from "@/flowStore";
import { useNodeRuntime } from "../flow/hooks";
import { DecisionNode } from "@/types";
import { Edit3, Play, Globe, Video } from "lucide-react";

type TabType = "edit" | "play" | "video" | "variables";

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

  // Video store
  const videoFile = useVideoStore((s) => s.videoFile);
  const videoUrl = useVideoStore((s) => s.videoUrl);
  const segments = useVideoStore((s) => s.segments);
  const selectedSegmentId = useVideoStore((s) => s.selectedSegmentId);
  const selectSegment = useVideoStore((s) => s.selectSegment);

  // Tab state - default to edit or play based on mode
  const [activeTab, setActiveTab] = useState<TabType>(mode === "play" ? "play" : "edit");
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );
  
  const currentNode = useMemo(
    () => nodes.find((n) => n.id === currentNodeId),
    [nodes, currentNodeId]
  );
  
  const currentDecisions = useMemo((): DecisionNode[] => {
    if (!currentNode || !isMainNode(currentNode)) return [];
    
    return edges
      .filter((e) => e.source === currentNode.id)
      .map((e) => nodes.find((n) => n?.id === e.target))
      .filter((n): n is DecisionNode => n !== undefined && isDecisionNode(n));
  }, [currentNode, edges, nodes]);

  const selectedSegment = useMemo(
    () => segments.find(s => s.id === selectedSegmentId),
    [segments, selectedSegmentId]
  );

  const { remainingMs } = useNodeRuntime(currentNode, nodes, edges);

  // Auto-switch to play tab when game starts
  React.useEffect(() => {
    if (mode === "play" && activeTab === "edit") {
      setActiveTab("play");
    } else if (mode === "edit" && activeTab === "play") {
      setActiveTab("edit");
    }
  }, [mode]);

  const handleSegmentClick = (segment: typeof segments[0]) => {
    selectSegment(segment.id);
    if (videoPreviewRef.current) {
      videoPreviewRef.current.currentTime = segment.start;
    }
  };

  const playSegment = () => {
    if (videoPreviewRef.current && selectedSegment) {
      videoPreviewRef.current.currentTime = selectedSegment.start;
      videoPreviewRef.current.play();
      
      // Set up interval to pause at segment end
      const checkTime = setInterval(() => {
        if (videoPreviewRef.current && videoPreviewRef.current.currentTime >= selectedSegment.end) {
          videoPreviewRef.current.pause();
          clearInterval(checkTime);
        }
      }, 100);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Tab configuration
  const tabs = [
    { id: "edit" as TabType, label: "Edycja", icon: Edit3, disabled: mode === "play" },
    { id: "play" as TabType, label: "Gra", icon: Play, disabled: mode === "edit" },
    { id: "video" as TabType, label: "Wideo", icon: Video, disabled: !videoFile || segments.length === 0 },
    { id: "variables" as TabType, label: "Zmienne", icon: Globe, disabled: false },
  ];

  return (
    <div className="flex h-full relative">
      {/* Vertical tabs on the left */}
      <div className="absolute -left-12 top-0 bottom-0 w-12 flex flex-col gap-1 py-4 z-10">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;
          
          return (
            <div
              key={tab.id}
              className="relative"
              style={{ marginTop: index === 0 ? '48px' : '0' }} // Offset for header
            >
              <button
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`
                  relative w-12 h-12 flex items-center justify-center rounded-l-lg transition-all
                  ${isActive 
                    ? "bg-white shadow-md translate-x-1" 
                    : "bg-zinc-100 hover:bg-zinc-200"
                  }
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  group
                `}
                title={tab.label}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-zinc-900" : "text-zinc-600"}`} />
                
                {/* Tooltip */}
                <span className={`
                  absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded
                  whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity
                  pointer-events-none
                  ${isDisabled ? 'hidden' : ''}
                `}>
                  {tab.label}
                </span>
              </button>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-zinc-900 rounded-l" />
              )}
            </div>
          );
        })}
      </div>

      {/* Main content */}
      <Card className="flex flex-col overflow-hidden flex-1">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {activeTab === "edit" && "Edycja"}
              {activeTab === "play" && "Tryb gry"}
              {activeTab === "video" && "Segmenty wideo"}
              {activeTab === "variables" && "Zmienne globalne"}
              {mode === "play" && isGameOver && activeTab === "play" && (
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
        </CardHeader>

        <CardContent className="flex-1 overflow-auto px-3">
          {/* Edit Tab */}
          {activeTab === "edit" && mode === "edit" && (
            <div className="space-y-4">
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

              {selectedNode ? (
                <NodeEditor
                  node={selectedNode}
                  nodes={nodes}
                  edges={edges}
                  onUpdate={(data) => updateNode(selectedNode.id, data)}
                />
              ) : (
                <div className="text-sm text-zinc-500 text-center py-8">
                  Wybierz węzeł w grafie aby edytować jego właściwości
                </div>
              )}
            </div>
          )}

          {/* Play Tab */}
          {activeTab === "play" && mode === "play" && (
            <div className="space-y-4">
              {isGameOver ? (
                <div className="text-center py-8">
                  <Badge variant="destructive" className="mb-4">Koniec gry</Badge>
                  <p className="text-sm text-zinc-500">
                    Gra została zakończona. Użyj przycisku "Reset" aby rozpocząć ponownie.
                  </p>
                </div>
              ) : currentNode && isMainNode(currentNode) ? (
                <>
                  <div className="space-y-2">
                    <Label>Aktualny węzeł</Label>
                    <div className="p-3 bg-zinc-50 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{currentNode.data.label}</span>
                        {(currentNode.data.durationSec ?? 0) > 0 && (
                          <Badge variant="secondary">
                            {Math.ceil(remainingMs / 1000)}s
                          </Badge>
                        )}
                      </div>
                      {currentNode.data.description && (
                        <p className="text-sm text-zinc-600 mt-1">{currentNode.data.description}</p>
                      )}
                    </div>
                  </div>

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
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-zinc-500">
                    Oczekiwanie na rozpoczęcie gry...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Video Tab */}
          {activeTab === "video" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Lista segmentów ({segments.length})</Label>
                {segments.length === 0 ? (
                  <div className="text-sm text-zinc-500 text-center py-8">
                    Brak segmentów. Użyj timeline poniżej aby zaznaczyć fragmenty wideo.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {segments.map((segment, index) => (
                      <div 
                        key={segment.id}
                        className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                          selectedSegment?.id === segment.id 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                        }`}
                        onClick={() => handleSegmentClick(segment)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">Segment {index + 1}</div>
                          <div className="text-xs text-zinc-600">
                            {formatTime(segment.start)} - {formatTime(segment.end)}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {formatTime(segment.duration)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Preview */}
              {videoUrl && segments.length > 0 && (
                <div className="space-y-2">
                  <Label>Podgląd wideo</Label>
                  <div className="relative bg-black rounded-md overflow-hidden">
                    <video
                      ref={videoPreviewRef}
                      src={videoUrl}
                      className="w-full h-48 object-contain"
                      controls={false}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <div className="flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={playSegment}
                          disabled={!selectedSegment}
                          className="h-7 text-xs"
                        >
                          {selectedSegment ? `Odtwórz segment ${segments.findIndex(s => s.id === selectedSegment.id) + 1}` : 'Wybierz segment'}
                        </Button>
                        {selectedSegment && (
                          <span className="text-xs text-white">
                            {formatTime(selectedSegment.start)} - {formatTime(selectedSegment.end)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedSegment && (
                    <p className="text-xs text-zinc-500">
                      Kliknij "Odtwórz segment" aby obejrzeć wybrany fragment
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Variables Tab */}
          {activeTab === "variables" && (
            <div className="space-y-4">
              <VariablesSection />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};