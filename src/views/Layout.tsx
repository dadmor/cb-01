// src/views/Layout.tsx
import React, { useRef, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { useFlowStore } from "@/modules/flow/store";
import { useGameMode, GameService } from "@/modules/game";
import { useVariables, useVariablesStore } from "@/modules/variables";
import { useVideoStore } from "@/modules/video/store";
import { ProjectData } from "@/types";
import { VideoReloadModal } from "@/modules/video/VideoReloadModal";

// Lucide icons
import { 
  FolderOpen,
  Film,
  GitBranch,
  Sliders,
  Home, 
  Settings,
  Plus
} from "lucide-react";

// DaVinci-style logo
const DaVinciLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" fill="#E84E36"/>
    <path d="M8 8h16v16H8V8z" fill="white" fillOpacity="0.9"/>
    <path d="M12 12h8v8h-8v-8z" fill="#E84E36"/>
  </svg>
);

export const Layout: React.FC = () => {
  const location = useLocation();
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [showVideoReloadModal, setShowVideoReloadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const mode = useGameMode();
  const { variables } = useVariables();
  const variablesStore = useVariablesStore();
  
  const nodes = useFlowStore(state => state.nodes);
  const edges = useFlowStore(state => state.edges);
  const loadProject = useFlowStore(state => state.loadProject);
  const clearProject = useFlowStore(state => state.clearProject);
  
  const videoFile = useVideoStore(state => state.videoFile);
  const segments = useVideoStore(state => state.segments);
  const setVideo = useVideoStore(state => state.setVideo);
  const clearVideo = useVideoStore(state => state.clearVideo);

  // Initialize storage and check for video metadata on mount
  React.useEffect(() => {
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
        variablesStore.setState({ variables: projectData.variables });
        useVideoStore.getState().updateSegments(projectData.videoSegments || []);
        
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
      GameService.stopGame();
      variablesStore.setState({ variables: [] });
    }
  };

  const tabs = [
    { id: 'projects', path: '/', label: 'Projects', icon: FolderOpen },
    { id: 'video', path: '/video', label: 'Video', icon: Film },
    { id: 'story', path: '/story', label: 'Story', icon: GitBranch },
    { id: 'decisions', path: '/decisions', label: 'Decisions', icon: Sliders }
  ];

  const currentTab = tabs.find(tab => tab.path === location.pathname) || tabs[0];

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
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`h-full px-8 flex items-center gap-3 transition-all border-r border-[#0a0a0a] ${
                  currentTab.id === tab.id 
                    ? 'bg-[#1a1a1a] text-[#E84E36] border-b-2 border-b-[#E84E36]' 
                    : 'bg-transparent text-[#666] border-b-2 border-b-transparent'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{tab.label}</span>
              </Link>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex-1 flex items-center justify-end px-4 gap-2">
            {currentTab.id !== 'projects' && (
              <>
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
                  <Film className="w-4 h-4" />
                  {videoFile ? videoFile.name : "Import Media"}
                </button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
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
};