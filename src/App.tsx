// src/App.tsx
import React, { useRef, useState } from "react";
import { ReactFlowProvider } from "reactflow";
import { FlowCanvas } from "@/components/flow/FlowCanvas";
import { SidebarPanel } from "@/components/panels/SidebarPanel";
import { Button, Input, Label } from "@/components/ui";
import { useFlowStore } from "@/flowStore";
import { useGameStore } from "@/gameStore";
import { ProjectData } from "@/types";
import VideoTimeline from "./components/videoTimeline/VideoTimeline";

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  
  const projectTitle = useFlowStore((s) => s.projectTitle);
  const setProjectTitle = useFlowStore((s) => s.setProjectTitle);
  const exportProject = useFlowStore((s) => s.exportProject);
  const importProject = useFlowStore((s) => s.importProject);
  const resetProject = useFlowStore((s) => s.resetProject);
  const mode = useGameStore((s) => s.mode);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setShowTimeline(true);
    }
  };

  const handleSegmentsChange = (segments: any[]) => {
    console.log('Segmenty wideo:', segments);
  };

  const handleExport = () => {
    const projectData = exportProject();
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${projectTitle.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const projectData = JSON.parse(content) as ProjectData;
        importProject(projectData);
        alert(`Projekt "${projectData.title}" został zaimportowany pomyślnie.`);
      } catch (error) {
        alert("Błąd podczas importowania projektu. Sprawdź czy plik jest w prawidłowym formacie.");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleNewProject = () => {
    if (confirm("Czy na pewno chcesz utworzyć nowy projekt? Wszystkie niezapisane zmiany zostaną utracone.")) {
      resetProject();
      setVideoFile(null);
      setShowTimeline(false);
    }
  };

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-zinc-50">
        {/* Header */}
        <div className="bg-white border-b z-10 px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Label htmlFor="projectTitle" className="text-sm">Tytuł projektu:</Label>
              <Input
                id="projectTitle"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                disabled={mode === "play"}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => videoInputRef.current?.click()}
              >
                {videoFile ? 'Zmień wideo' : 'Wybierz wideo'}
              </Button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
              
              {showTimeline && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowTimeline(!showTimeline)}
                >
                  {showTimeline ? 'Ukryj timeline' : 'Pokaż timeline'}
                </Button>
              )}
              
              <div className="w-px h-6 bg-zinc-200 mx-1" />
              
              <Button size="sm" variant="outline" onClick={handleNewProject}>
                Nowy projekt
              </Button>
              <Button size="sm" variant="outline" onClick={handleExport}>
                Eksportuj
              </Button>
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Importuj
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas and Timeline container */}
          <div className="flex-1 flex flex-col">
            {/* Flow Canvas */}
            <div className={showTimeline && videoFile ? "flex-1" : "h-full"}>
              <FlowCanvas />
            </div>

            {/* Video Timeline */}
            {showTimeline && videoFile && (
              <div className="h-80 border-t bg-white overflow-hidden flex-shrink-0">
                <VideoTimeline
                  videoFile={videoFile}
                  onSegmentsChange={handleSegmentsChange}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-96 border-l bg-white flex-shrink-0">
            <SidebarPanel />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}