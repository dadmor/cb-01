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

// DaVinci-style icons
const DaVinciLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" fill="#E84E36"/>
    <path d="M8 8h16v16H8V8z" fill="white" fillOpacity="0.9"/>
    <path d="M12 12h8v8h-8v-8z" fill="#E84E36"/>
  </svg>
);

const MediaPoolIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <rect x="2" y="3" width="6" height="6" rx="1"/>
    <rect x="10" y="3" width="6" height="6" rx="1"/>
    <rect x="2" y="11" width="6" height="6" rx="1"/>
    <rect x="10" y="11" width="6" height="6" rx="1"/>
  </svg>
);

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M3 5h14v2H3V5zm0 4h10v2H3V9zm0 4h14v2H3v-2z"/>
  </svg>
);

const ColorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="10" cy="6" r="2"/>
    <circle cx="14" cy="10" r="2"/>
    <circle cx="10" cy="14" r="2"/>
    <circle cx="6" cy="10" r="2"/>
  </svg>
);

const DeliverIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2l8 8-8 8-8-8 8-8zm0 3.5L5.5 10 10 14.5 14.5 10 10 5.5z"/>
  </svg>
);

export default function App() {
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [showVideoReloadModal, setShowVideoReloadModal] = useState(false);
  const [activeTab, setActiveTab] = useState("edit"); // media, edit, color, deliver
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
      <div className="h-screen flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
        {/* DaVinci-style Header */}
        <header className="flex-shrink-0" style={{ 
          height: '40px',
          background: 'linear-gradient(to bottom, #2a2a2a, #242424)',
          borderBottom: '1px solid #0a0a0a'
        }}>
          <div className="h-full flex items-center">
            {/* Logo */}
            <div className="px-3 h-full flex items-center" style={{ borderRight: '1px solid #0a0a0a' }}>
              <DaVinciLogo />
            </div>

            {/* File Menu Bar */}
            <div className="flex items-center h-full">
              {['File', 'Edit', 'Timeline', 'Workspace', 'Help'].map((menu) => (
                <button
                  key={menu}
                  className="px-4 h-full hover:bg-white/5 text-sm"
                  style={{ color: '#999' }}
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
                className="bg-transparent text-center font-medium"
                style={{ 
                  color: '#ccc',
                  fontSize: '13px',
                  outline: 'none',
                  border: 'none'
                }}
              />
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2 px-3">
              <button className="p-1.5 hover:bg-white/5 rounded">
                <svg width="16" height="16" fill="#999" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
              </button>
              <button className="p-1.5 hover:bg-white/5 rounded">
                <svg width="16" height="16" fill="#999" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div style={{ 
          height: '48px',
          backgroundColor: '#282828',
          borderBottom: '1px solid #0a0a0a',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div className="flex h-full">
            {[
              { id: 'media', label: 'Media', icon: <MediaPoolIcon /> },
              { id: 'edit', label: 'Edit', icon: <EditIcon /> },
              { id: 'color', label: 'Color', icon: <ColorIcon /> },
              { id: 'deliver', label: 'Deliver', icon: <DeliverIcon /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="h-full px-8 flex items-center gap-3 transition-all"
                style={{
                  backgroundColor: activeTab === tab.id ? '#1a1a1a' : 'transparent',
                  color: activeTab === tab.id ? '#E84E36' : '#666',
                  borderBottom: activeTab === tab.id ? '2px solid #E84E36' : '2px solid transparent',
                  borderRight: '1px solid #0a0a0a'
                }}
              >
                {tab.icon}
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex-1 flex items-center justify-end px-4 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: '#2a2a2a',
                color: '#999',
                border: '1px solid #3a3a3a'
              }}
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
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: '#2a2a2a',
                color: '#999',
                border: '1px solid #3a3a3a'
              }}
            >
              Export Project
            </button>

            <div style={{ width: '1px', height: '20px', backgroundColor: '#3a3a3a', margin: '0 8px' }} />

            <button
              onClick={() => videoInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-2"
              style={{
                backgroundColor: videoFile ? '#2d3a2d' : '#2a2a2a',
                color: videoFile ? '#4ade80' : '#999',
                border: '1px solid #3a3a3a'
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
              </svg>
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
          <div style={{ 
            width: '300px',
            backgroundColor: '#1e1e1e',
            borderRight: '1px solid #0a0a0a',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              height: '32px',
              backgroundColor: '#252525',
              borderBottom: '1px solid #0a0a0a',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px'
            }}>
              <span style={{ fontSize: '12px', color: '#999', fontWeight: 500 }}>
                MEDIA POOL
              </span>
            </div>
            
            {videoFile ? (
              <RegionsPanel />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-3" fill="#444" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                  </svg>
                  <p style={{ color: '#666', fontSize: '13px' }}>No media imported</p>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="mt-3 px-4 py-2 text-xs"
                    style={{
                      backgroundColor: '#E84E36',
                      color: 'white',
                      fontWeight: 500
                    }}
                  >
                    Import Media Files
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Center - Main Canvas */}
          <div className="flex-1 flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
            {/* Viewer/Canvas area */}
            <div className="flex-1 relative">
              <FlowCanvas />
              
              {/* Viewer overlay controls */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                display: 'flex',
                gap: '4px'
              }}>
                <button
                  className="p-2"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#999',
                    fontSize: '11px'
                  }}
                >
                  Viewer
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Inspector */}
          <div style={{ 
            width: '350px',
            backgroundColor: '#1e1e1e',
            borderLeft: '1px solid #0a0a0a'
          }}>
            <div style={{
              height: '32px',
              backgroundColor: '#252525',
              borderBottom: '1px solid #0a0a0a',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px'
            }}>
              <span style={{ fontSize: '12px', color: '#999', fontWeight: 500 }}>
                INSPECTOR
              </span>
            </div>
            <Sidebar />
          </div>
        </div>

        {/* Timeline Panel */}
        {videoFile && (
          <div style={{ 
            height: '280px',
            backgroundColor: '#1a1a1a',
            borderTop: '1px solid #0a0a0a',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Timeline toolbar */}
            <div style={{
              height: '32px',
              backgroundColor: '#252525',
              borderBottom: '1px solid #0a0a0a',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              gap: '16px'
            }}>
              <span style={{ fontSize: '12px', color: '#999', fontWeight: 500 }}>
                TIMELINE
              </span>
              
              {/* Timeline tools */}
              <div className="flex gap-1">
                {['A', 'B', 'N', 'M'].map((tool) => (
                  <button
                    key={tool}
                    className="w-6 h-6 flex items-center justify-center hover:bg-white/10"
                    style={{
                      backgroundColor: '#2a2a2a',
                      color: '#666',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  >
                    {tool}
                  </button>
                ))}
              </div>

              <div style={{ width: '1px', height: '16px', backgroundColor: '#3a3a3a' }} />

              {/* Snap toggle */}
              <button
                className="px-2 py-1 text-xs flex items-center gap-1"
                style={{
                  backgroundColor: '#2a2a2a',
                  color: '#666'
                }}
              >
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
                </svg>
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