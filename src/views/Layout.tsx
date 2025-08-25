// src/views/Layout.tsx
import { Outlet, useLocation } from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { useProjectIO } from "@/modules/project";
import { useProjectStore } from "@/modules/project/store/useProjectStore";
import { TabNavigation, Tab } from "./layout";
import { FolderOpen, Film, GitBranch, Sliders, PlayCircle } from "lucide-react";

export const Layout: React.FC = () => {
  const location = useLocation();

  const projectTitle = useProjectStore((state) => state.projectTitle);
  const setProjectTitle = useProjectStore((state) => state.setProjectTitle);
  const exportProject = useProjectStore((state) => state.exportProject);
  const importProject = useProjectStore((state) => state.importProject);
  const newProject = useProjectStore((state) => state.newProject);

  const {
    fileInputRef,
    isImporting,
    isExporting,
    lastAutoSave,
    handleExport,
    handleFileSelect,
    triggerImport,
    createNewProject,
  } = useProjectIO(projectTitle, {
    confirmNewProject: true,
    autoSaveEnabled: true,
    autoSaveInterval: 30000,
    onImportSuccess: (projectData) => {
      importProject(projectData);
      alert(`Projekt "${projectData.title}" został wczytany pomyślnie!`);
    },
    onImportError: (error) => {
      alert(`Błąd wczytywania projektu: ${error.message}`);
    },
    onExportSuccess: () => {
      console.log("Projekt wyeksportowany pomyślnie");
    },
  });

  const handleNewProject = () => {
    if (createNewProject()) {
      newProject();
    }
  };

  const handleProjectExport = () => {
    exportProject();
    handleExport();
  };

  const tabs: Tab[] = [
    // { id: "projects", path: "/", label: "Projects", icon: FolderOpen },
    { id: "decisions", path: "/decisions", label: "Story Map", icon: GitBranch },
    { id: "story", path: "/story", label: "Screen Play", icon: Sliders },
    { id: "variables", path: "/variables", label: "Variables", icon: Sliders },
    { id: "video", path: "/video", label: "Video", icon: Film },
   
   
  
  
    { id: "play", path: "/play", label: "Play", icon: PlayCircle },
  ];

  const currentTab = tabs.find((tab) => tab.path === location.pathname) || tabs[0];

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-[#1a1a1a]">
        <header className="flex-shrink-0 h-10 bg-gradient-to-b from-[#2a2a2a] to-[#242424] border-b border-[#0a0a0a]">
          <div className="h-full flex items-center">
            <div className="px-3 h-full flex items-center border-r border-[#0a0a0a]">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" fill="#E84E36" />
                <path d="M8 8h16v16H8V8z" fill="white" fillOpacity="0.9" />
                <path d="M12 12h8v8h-8v-8z" fill="#E84E36" />
              </svg>
            </div>

            <div className="flex items-center h-full">
              {["File", "Edit", "Timeline", "Workspace", "Help"].map((menu) => (
                <button key={menu} className="px-4 h-full hover:bg-white/5 text-sm text-[#999]">
                  {menu}
                </button>
              ))}
            </div>

            <div className="flex-1 flex items-center justify-center">
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="bg-transparent text-center font-medium text-[#ccc] text-[13px] outline-none border-none"
              />
              {lastAutoSave && (
                <span className="ml-2 text-[10px] text-[#666]">
                  (auto-save: {lastAutoSave.toLocaleTimeString()})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 px-3">
              <button onClick={handleNewProject} className="p-1.5 hover:bg:white/5 rounded" title="New project">
                <svg className="w-4 h-4 text-[#999]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="h-12 bg-[#282828] border-b border-[#0a0a0a] flex items-center">
          <TabNavigation tabs={tabs} />
          <div className="flex-1 flex items-center justify-end px-4 gap-2">
            {currentTab.id !== "projects" && (
              <>
                <button
                  onClick={triggerImport}
                  disabled={isImporting}
                  className="px-3 py-1.5 text-xs font-medium bg-[#2a2a2a] text-[#999] border border-[#3a3a3a] transition-colors hover:bg-[#333] hover:text-white disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {isImporting ? "Importing..." : "Import"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={handleProjectExport}
                  disabled={isExporting}
                  className="px-3 py-1.5 text-xs font-medium bg-[#2a2a2a] text-[#999] border border-[#3a3a3a] transition-colors hover:bg-[#333] hover:text-white disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  {isExporting ? "Exporting..." : "Export"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </ReactFlowProvider>
  );
};
