// ------ src/App.tsx ------
import React, { useRef } from "react";
import { ReactFlowProvider } from "reactflow";
import { FlowCanvas } from "@/components/flow/FlowCanvas";
import { SidebarPanel } from "@/components/panels/SidebarPanel";
import { Button, Input, Label } from "@/components/ui";
import { useFlowStore } from "@/flowStore";
import { useGameStore } from "@/gameStore";
import { ProjectData } from "@/types";

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectTitle = useFlowStore((s) => s.projectTitle);
  const setProjectTitle = useFlowStore((s) => s.setProjectTitle);
  const exportProject = useFlowStore((s) => s.exportProject);
  const importProject = useFlowStore((s) => s.importProject);
  const resetProject = useFlowStore((s) => s.resetProject);
  const mode = useGameStore((s) => s.mode);

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
    
    // Reset input value to allow importing the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleNewProject = () => {
    if (confirm("Czy na pewno chcesz utworzyć nowy projekt? Wszystkie niezapisane zmiany zostaną utracone.")) {
      resetProject();
    }
  };

  return (
    <ReactFlowProvider>
      <div className="flex h-screen bg-zinc-50">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-white border-b z-10 px-4 py-2">
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

        {/* Main content */}
        <div className="flex-1 flex pt-14">
          {/* Flow canvas */}
          <div className="flex-1">
            <FlowCanvas />
          </div>

          {/* Sidebar panel */}
          <div className="w-96 border-l bg-white">
            <SidebarPanel />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}