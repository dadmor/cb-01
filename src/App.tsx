import React, { useRef, useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { FlowCanvas } from "@/modules/flow/FlowCanvas";
import { VideoTimeline } from "@/modules/video/VideoTimeline";
import { Sidebar } from "@/components/Sidebar";
import { RegionsPanel } from "@/components/RegionsPanel";

import { useFlowStore } from "@/modules/flow/store";
import { useGameStore } from "@/modules/game/store";
import { useVideoStore, cleanupVideo } from "@/modules/video/store";
import { ProjectData } from "@/types";
import { VideoReloadModal } from "./modules/video/VideoReloadModal";

// Lucide icons
import { 
  Grid3x3, 
  Layers, 
  Palette, 
  Package, 
  Home, 
  Settings,
  Video,
  Grip
} from "lucide-react";

// DaVinci-style logo
const DaVinciLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" fill="#E84E36"/>
    <path d="M8 8h16v16H8V8z" fill="white" fillOpacity="0.9"/>
    <path d="M12 12h8v8h-8v-8z" fill="#E84E36"/>
  </svg>
);

export default function App() {
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [showVideoReloadModal, setShowVideoReloadModal] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
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
      setProjectTitle("Untitled Project");
      clearProject();
      clearVideo();
      useGameStore.getState().stopGame();
      useGameStore.getState().updateVariables(() => []);
    }
  };

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-[#1a1a1a]">
        {/* DaVinci-style Header */}
        <header className="flex-shrink-0 h-10 bg-gradient-to-b from-[#2a2a2a] to-[#242424] border-b border-[#0a0a0a]">
          <div className="h-full flex items-center">
            {/* Logo */}
            <div className="px-3 h-full flex items-center border-r border-[#0a0a0a]">
              <DaVinciLogo />
            </div>

            {/* File Menu Bar */}
            <div className="flex items-center h-full">
              {['File', 'Edit', 'Timeline', 'Workspace', 'Help'].map((menu) => (
                <button
                  key={menu}
                  className="px-4 h-full hover:bg-white/5 text-sm text-[#999]"
                >
                  {menu}
                </button>
              ))}
            </div>

            {/* Project Title */}
            <div className="flex-1 flex items-center justify-center">
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                disabled={mode === "play"}
                className="bg-transparent text-center font-medium text-[#ccc] text-[13px] outline-none border-none"
              />
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2 px-3">
              <button className="p-1.5 hover:bg-white/5 rounded">
                <Home className="w-4 h-4 text-[#999]" />
              </button>
              <button className="p-1.5 hover:bg-white/5 rounded">
                <Settings className="w-4 h-4 text-[#999]" />
              </button>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="h-12 bg-[#282828] border-b border-[#0a0a0a] flex items-center">
          <div className="flex h-full">
            {[
              { id: 'media', label: 'Media', icon: Grid3x3 },
              { id: 'edit', label: 'Edit', icon: Layers },
              { id: 'color', label: 'Color', icon: Palette },
              { id: 'deliver', label: 'Deliver', icon: Package }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-full px-8 flex items-center gap-3 transition-all border-r border-[#0a0a0a] ${
                  activeTab === tab.id 
                    ? 'bg-[#1a1a1a] text-[#E84E36] border-b-2 border-b-[#E84E36]' 
                    : 'bg-transparent text-[#666] border-b-2 border-b-transparent'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex-1 flex items-center justify-end px-4 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium bg-[#2a2a2a] text-[#999] border border-[#3a3a3a] transition-colors hover:bg-[#333] hover:text-white"
            >
              Import Project
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
              className="px-3 py-1.5 text-xs font-medium bg-[#2a2a2a] text-[#999] border border-[#3a3a3a] transition-colors hover:bg-[#333] hover:text-white"
            >
              Export Project
            </button>

            <div className="w-px h-5 bg-[#3a3a3a] mx-2" />

            <button
              onClick={() => videoInputRef.current?.click()}
              className={`px-3 py-1.5 text-xs font-medium border border-[#3a3a3a] transition-colors flex items-center gap-2 ${
                videoFile 
                  ? 'bg-[#2d3a2d] text-green-400 hover:bg-[#3a4a3a]' 
                  : 'bg-[#2a2a2a] text-[#999] hover:bg-[#333] hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              {videoFile ? videoFile.name : "Import Media"}
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

        {/* Main workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Media Pool / Regions */}
          <div className="w-[300px] bg-[#1e1e1e] border-r border-[#0a0a0a] flex flex-col">
            <div className="h-8 bg-[#252525] border-b border-[#0a0a0a] flex items-center px-3">
              <span className="text-xs text-[#999] font-medium">MEDIA POOL</span>
            </div>
            
            {videoFile ? (
              <RegionsPanel />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-16 h-16 mx-auto mb-3 text-[#444]" />
                  <p className="text-[#666] text-[13px]">No media imported</p>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="mt-3 px-4 py-2 text-xs bg-[#E84E36] text-white font-medium hover:bg-[#d63d2a] transition-colors"
                  >
                    Import Media Files
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Center - Main Canvas */}
          <div className="flex-1 flex flex-col bg-[#1a1a1a]">
            {/* Viewer/Canvas area */}
            <div className="flex-1 relative">
              <FlowCanvas />
              
              {/* Viewer overlay controls */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button className="p-2 bg-black/60 text-[#999] text-[11px] hover:bg-black/80 transition-colors">
                  Viewer
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Inspector */}
          <div className="w-[350px] bg-[#1e1e1e] border-l border-[#0a0a0a]">
            <div className="h-8 bg-[#252525] border-b border-[#0a0a0a] flex items-center px-3">
              <span className="text-xs text-[#999] font-medium">INSPECTOR</span>
            </div>
            <Sidebar />
          </div>
        </div>

        {/* Timeline Panel */}
        {videoFile && (
          <div className="h-[280px] bg-[#1a1a1a] border-t border-[#0a0a0a] flex flex-col">
            {/* Timeline toolbar */}
            <div className="h-8 bg-[#252525] border-b border-[#0a0a0a] flex items-center px-3 gap-4">
              <span className="text-xs text-[#999] font-medium">TIMELINE</span>
              
              {/* Timeline tools */}
              <div className="flex gap-1">
                {['A', 'B', 'N', 'M'].map((tool) => (
                  <button
                    key={tool}
                    className="w-6 h-6 flex items-center justify-center bg-[#2a2a2a] text-[#666] text-[11px] font-bold hover:bg-white/10 transition-colors"
                  >
                    {tool}
                  </button>
                ))}
              </div>

              <div className="w-px h-4 bg-[#3a3a3a]" />

              {/* Snap toggle */}
              <button className="px-2 py-1 text-xs bg-[#2a2a2a] text-[#666] flex items-center gap-1 hover:bg-[#333] transition-colors">
                <Grip className="w-3 h-3" />
                Snap
              </button>
            </div>
            
            {/* Timeline content */}
            <div className="flex-1">
              <VideoTimeline
                videoFile={videoFile}
                segments={segments}
                selectedSegmentId={selectedSegmentId || undefined}
                onSegmentsChange={updateSegments}
                onSegmentSelect={selectSegment}
              />
            </div>
          </div>
        )}

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