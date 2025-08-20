import React, { useRef, useEffect, useState } from "react";
import { ReactFlowProvider } from "reactflow";
import { FlowCanvas } from "@/modules/flow/FlowCanvas";
import { VideoTimeline } from "@/modules/video/VideoTimeline";
import { Sidebar } from "@/components/Sidebar";
import { useFlowStore } from "@/modules/flow/store";
import { useGameStore } from "@/modules/game/store";
import { useVideoStore, cleanupVideo } from "@/modules/video/store";
import { ProjectData } from "@/types";

export default function App() {
  const [projectTitle, setProjectTitle] = useState("New Project");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const mode = useGameStore(state => state.mode);
  const variables = useGameStore(state => state.variables);
  
  const nodes = useFlowStore(state => state.nodes);
  const edges = useFlowStore(state => state.edges);
  const loadProject = useFlowStore(state => state.loadProject);
  const clearProject = useFlowStore(state => state.clearProject);
  
  const videoFile = useVideoStore(state => state.videoFile);
  const segments = useVideoStore(state => state.segments);
  const showTimeline = useVideoStore(state => state.showTimeline);
  const setVideo = useVideoStore(state => state.setVideo);
  const toggleTimeline = useVideoStore(state => state.toggleTimeline);
  const updateSegments = useVideoStore(state => state.updateSegments);
  const clearVideo = useVideoStore(state => state.clearVideo);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupVideo();
  }, []);

  const handleExport = () => {
    const projectData: ProjectData = {
      title: projectTitle,
      nodes,
      edges,
      variables,
      videoSegments: segments,
      version: "1.0.0"
    };

    const dataStr = JSON.stringify(projectData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const link = document.createElement("a");
    link.href = dataUri;
    link.download = `${projectTitle.replace(/\s+/g, "_")}.json`;
    link.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result as string) as ProjectData;
        
        setProjectTitle(projectData.title);
        loadProject(projectData.nodes, projectData.edges);
        useGameStore.getState().updateVariables(() => projectData.variables);
        updateSegments(projectData.videoSegments || []);
        
        alert(`Project "${projectData.title}" loaded successfully!`);
      } catch (error) {
        alert("Error loading project file");
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const handleNewProject = () => {
    if (confirm("Create new project? Unsaved changes will be lost.")) {
      setProjectTitle("New Project");
      clearProject();
      clearVideo();
      useGameStore.getState().stopGame();
      useGameStore.getState().updateVariables(() => []);
    }
  };

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-zinc-100">
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                disabled={mode === "play"}
                className="text-lg font-semibold bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500 focus:outline-none px-1 disabled:cursor-not-allowed"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => videoInputRef.current?.click()}
                className="px-3 py-1 border border-zinc-300 rounded text-sm hover:bg-zinc-50"
              >
                {videoFile ? "Change Video" : "Add Video"}
              </button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setVideo(file);
                }}
                className="hidden"
              />
              
              {videoFile && (
                <button
                  onClick={toggleTimeline}
                  className="px-3 py-1 border border-zinc-300 rounded text-sm hover:bg-zinc-50"
                >
                  {showTimeline ? "Hide" : "Show"} Timeline
                </button>
              )}
              
              <div className="w-px h-6 bg-zinc-300 mx-1" />
              
              <button
                onClick={handleNewProject}
                className="px-3 py-1 border border-zinc-300 rounded text-sm hover:bg-zinc-50"
              >
                New
              </button>
              
              <button
                onClick={handleExport}
                className="px-3 py-1 border border-zinc-300 rounded text-sm hover:bg-zinc-50"
              >
                Export
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 border border-zinc-300 rounded text-sm hover:bg-zinc-50"
              >
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col">
            {/* Flow canvas */}
            <div className={showTimeline && videoFile ? "flex-1" : "h-full"}>
              <FlowCanvas />
            </div>
            
            {/* Video timeline */}
            {showTimeline && videoFile && (
              <div className="h-64 border-t border-zinc-200">
                <VideoTimeline
                  videoFile={videoFile}
                  segments={segments}
                  onSegmentsChange={updateSegments}
                />
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <Sidebar />
        </div>
      </div>
    </ReactFlowProvider>
  );
}