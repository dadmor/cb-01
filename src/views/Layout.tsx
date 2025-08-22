// src/views/Layout.tsx
import React, { useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { useGameMode } from "@/modules/game";
import { useVideoStore } from "@/modules/video/store";
import { VideoReloadModal } from "@/modules/video/VideoReloadModal";
import { useProjectIO } from "@/modules/project";

// Layout components
import { Header, TabNavigation, QuickActions, Tab } from './layout';

// Icons
import { FolderOpen, Film, GitBranch, Sliders } from "lucide-react";

export const Layout: React.FC = () => {
  const location = useLocation();
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [showVideoReloadModal, setShowVideoReloadModal] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const mode = useGameMode();
  const videoFile = useVideoStore(state => state.videoFile);
  const setVideo = useVideoStore(state => state.setVideo);

  // Hook do obsługi projektu z auto-zapisem
  const {
    fileInputRef,
    isImporting,
    isExporting,
    lastAutoSave,
    handleExport,
    handleFileSelect, // <-- DODANE!
    triggerImport,
    createNewProject,
    loadAutoSave,
    hasAutoSave
  } = useProjectIO(projectTitle, {
    confirmNewProject: true,
    autoSaveEnabled: true,
    autoSaveInterval: 30000, // Auto-zapis co 30 sekund
    onImportSuccess: (projectData) => {
      setProjectTitle(projectData.title);
      alert(`Projekt "${projectData.title}" został wczytany pomyślnie!`);
    },
    onImportError: (error) => {
      alert(`Błąd wczytywania projektu: ${error.message}`);
    },
    onExportSuccess: () => {
      console.log('Projekt wyeksportowany pomyślnie');
    }
  });

  // Inicjalizacja przy starcie
  React.useEffect(() => {
    const initializeApp = async () => {
      await useVideoStore.getState().initializeStorage();
      
      const videoMetadata = useVideoStore.getState().videoMetadata;
      const savedSegments = useVideoStore.getState().segments;
      
      if (videoMetadata && !useVideoStore.getState().videoFile) {
        setShowVideoReloadModal(true);
      }
      
      if (savedSegments && savedSegments.length > 0) {
        console.log('Przywrócono segmenty:', savedSegments);
      }

      // Sprawdź czy jest auto-zapis
      if (hasAutoSave()) {
        if (confirm('Znaleziono auto-zapis. Czy chcesz go wczytać?')) {
          const autoSaved = await loadAutoSave();
          if (autoSaved) {
            setProjectTitle(autoSaved.title);
          }
        }
      }
    };
    
    initializeApp();
  }, []); // Usunięte zależności z tablicy

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await setVideo(file);
    }
  };

  const handleNewProject = () => {
    if (createNewProject()) {
      setProjectTitle("Untitled Project");
    }
  };

  const tabs: Tab[] = [
    { id: 'projects', path: '/', label: 'Projects', icon: FolderOpen },
    { id: 'video', path: '/video', label: 'Video', icon: Film },
    { id: 'story', path: '/story', label: 'Story', icon: GitBranch },
    { id: 'decisions', path: '/decisions', label: 'Decisions', icon: Sliders }
  ];

  const currentTab = tabs.find(tab => tab.path === location.pathname) || tabs[0];

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-[#1a1a1a]">
        {/* Header */}
        <Header
          projectTitle={projectTitle}
          setProjectTitle={setProjectTitle}
          mode={mode}
          lastAutoSave={lastAutoSave}
          onNewProject={handleNewProject}
        />

        {/* Tab Navigation */}
        <div className="h-12 bg-[#282828] border-b border-[#0a0a0a] flex items-center">
          <TabNavigation tabs={tabs} />

          {/* Quick actions */}
          <div className="flex-1 flex items-center justify-end px-4 gap-2">
            <QuickActions
              fileInputRef={fileInputRef}
              videoInputRef={videoInputRef}
              isImporting={isImporting}
              isExporting={isExporting}
              videoFile={videoFile}
              onTriggerImport={triggerImport}
              onHandleExport={handleExport}
              onHandleFileSelect={handleFileSelect}
              onHandleVideoSelect={handleVideoSelect}
              showActions={currentTab.id !== 'projects'}
            />
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
            console.log('Wideo załadowane pomyślnie');
          }}
        />
      </div>
    </ReactFlowProvider>
  );
};