import React, { useRef, useEffect, useState } from "react";
import { ReactFlowProvider } from "reactflow";
import { FlowCanvas } from "@/modules/flow/FlowCanvas";
import { VideoTimeline } from "@/modules/video/VideoTimeline";
import { Sidebar } from "@/components/Sidebar";
import { RegionsPanel } from "@/components/RegionsPanel";

import { useFlowStore } from "@/modules/flow/store";
import { useGameStore } from "@/modules/game/store";
import { useVideoStore, cleanupVideo } from "@/modules/video/store";
import { ProjectData } from "@/types";
import { VideoReloadModal } from "./modules/video/VideoReloadModal";

export default function App() {
  const [projectTitle, setProjectTitle] = useState("New Project");
  const [showVideoReloadModal, setShowVideoReloadModal] = useState(false);
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
  const selectedSegmentId = useVideoStore(state => state.selectedSegmentId);
  const setVideo = useVideoStore(state => state.setVideo);
  const updateSegments = useVideoStore(state => state.updateSegments);
  const selectSegment = useVideoStore(state => state.selectSegment);
  const clearVideo = useVideoStore(state => state.clearVideo);

  // Initialize storage and check for video metadata on mount
  useEffect(() => {
    const initializeApp = async () => {
      await useVideoStore.getState().initializeStorage();
      
      const videoMetadata = useVideoStore.getState().videoMetadata;
      const savedSegments = useVideoStore.getState().segments;
      
      if (videoMetadata && !useVideoStore.getState().videoFile) {
        setShowVideoReloadModal(true);
      }
      
      if (savedSegments && savedSegments.length > 0) {
        console.log('Restored segments:', savedSegments);
      }
    };
    
    initializeApp();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupVideo();
  }, []);

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await setVideo(file);
    }
  };

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
      <div className="h-screen flex flex-col bg-zinc-950">
        {/* Header */}
        <header className="h-12 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center flex-shrink-0">
          <div className="flex items-center gap-6 flex-1">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">IS</span>
              </div>
              <span className="text-zinc-300 font-medium">Interactive Story</span>
            </div>

            {/* Project title */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Project:</span>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                disabled={mode === "play"}
                className="bg-transparent text-zinc-200 border-b border-transparent hover:border-zinc-600 focus:border-blue-500 focus:outline-none px-1 disabled:cursor-not-allowed"
              />
            </div>
            
            <div className="flex-1" />
            
            {/* Main actions */}
            <div className="flex items-center gap-2">
              {/* File menu */}
              <div className="flex items-center">
                <button
                  onClick={handleNewProject}
                  className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 text-sm"
                  title="New Project (Ctrl+N)"
                >
                  New
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded text-sm"
                  title="Open Project (Ctrl+O)"
                >
                  Open
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded text-sm"
                  title="Save Project (Ctrl+S)"
                >
                  Save
                </button>
              </div>
              
              <div className="w-px h-6 bg-zinc-700 mx-2" />
              
              {/* Media controls */}
              <button
                onClick={() => videoInputRef.current?.click()}
                                  className={`px-3 py-1.5 text-sm flex items-center gap-2 ${
                  videoFile 
                    ? "text-green-400 hover:text-green-300 hover:bg-zinc-800" 
                    : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
                title="Import Video"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                </svg>
                {videoFile ? "Change Video" : "Import Video"}
              </button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
            </div>
          </div>
        </header>

        {/* Main workspace layout */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Three columns layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left column - Regions Panel */}
            <div className="w-80 border-r border-zinc-800 flex-shrink-0">
              {videoFile ? (
                <RegionsPanel />
              ) : (
                <div className="h-full flex items-center justify-center bg-zinc-850">
                  <div className="text-center text-zinc-500">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                    </svg>
                    <p className="text-sm">Import video to see regions</p>
                  </div>
                </div>
              )}
            </div>

            {/* Center column - Flow Canvas */}
            <div className="flex-1 bg-zinc-900">
              <FlowCanvas />
            </div>

            {/* Right column - Sidebar */}
            <div className="w-96 flex-shrink-0">
              <Sidebar />
            </div>
          </div>

          {/* Bottom panel - Timeline */}
          {videoFile && (
            <div className="h-48 border-t border-zinc-800 flex-shrink-0">
              <VideoTimeline
                videoFile={videoFile}
                segments={segments}
                selectedSegmentId={selectedSegmentId || undefined}
                onSegmentsChange={updateSegments}
                onSegmentSelect={selectSegment}
              />
            </div>
          )}
        </div>

        {/* Video reload modal */}
        <VideoReloadModal 
          isOpen={showVideoReloadModal}
          onClose={() => setShowVideoReloadModal(false)}
          onVideoSelected={() => {
            console.log('Video reloaded successfully');
          }}
        />
      </div>
    </ReactFlowProvider>
  );
}