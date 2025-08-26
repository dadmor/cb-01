// src/views/Layout.tsx
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { useProjectIO } from "@/modules/project";
import { useProjectStore } from "@/modules/project/store/useProjectStore";
import { TabNavigation, Tab, Logo } from "./layout";
import { GitBranch, Sliders, Film, PlayCircle, Plus, Upload, Download } from "lucide-react";

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const projectTitle = useProjectStore((state) => state.projectTitle);
  const setProjectTitle = useProjectStore((state) => state.setProjectTitle);

  const {
    fileInputRef,
    isImporting,
    isExporting,
    handleExport,
    handleFileSelect,
    triggerImport,
    createNewProject,
  } = useProjectIO({
    confirmNewProject: true,
    onImportSuccess: (projectData) => {
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
    // Hook sam wywołuje ProjectService.createNewProject(); nie dublujemy tego w store
    createNewProject();
  };

  const handleProjectExport = () => {
    handleExport();
  };

  const tabs: Tab[] = [
    { id: "storymap", path: "/storymap", label: "Story Map", icon: GitBranch },
    { id: "story", path: "/story", label: "Screen Play", icon: Sliders },
    { id: "variables", path: "/variables", label: "Variables", icon: Sliders },
    { id: "video", path: "/video", label: "Video", icon: Film },
    { id: "play", path: "/play", label: "Play", icon: PlayCircle },
  ];

  const currentTab = tabs.find((tab) => tab.path === location.pathname) || tabs[0];

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-zinc-900 select-none">
        {/* Header */}
        <header className="flex-shrink-0 h-10 bg-gradient-to-b from-zinc-950 to-zinc-900 border-b border-zinc-900">
          <div className="h-full flex items-center">
            {/* Film Strip Logo */}
            <button 
              onClick={() => navigate('/')}
              className="px-3 h-full flex items-center border-r border-zinc-900 hover:bg-zinc-800 transition-colors group"
              title="Go to Projects"
            >
             <Logo/>
            </button>

            {/* Menu */}
            <div className="flex items-center h-full">
              {["File", "Edit", "Timeline", "Workspace", "Help"].map((menu) => (
                <button key={menu} className="px-4 h-full hover:bg-zinc-800 text-sm text-zinc-400">
                  {menu}
                </button>
              ))}
            </div>

            {/* Tytuł projektu */}
            <div className="flex-1 flex items-center justify-center">
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="bg-transparent text-center font-medium text-zinc-200 text-[13px] outline-none border-none"
              />
            </div>

            {/* Akcje po prawej */}
            <div className="flex items-center gap-2 px-3">
              <button
                onClick={handleNewProject}
                className="p-1.5 hover:bg-zinc-800 rounded"
                title="New project"
              >
                <Plus className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Pasek kart + akcje Import/Export */}
        <div className="h-12 bg-zinc-800 border-b border-zinc-900 flex items-center">
          <TabNavigation tabs={tabs} />
          <div className="flex-1 flex items-center justify-end px-4 gap-2">
            {currentTab.id !== "projects" && (
              <>
                <button
                  onClick={triggerImport}
                  disabled={isImporting}
                  className="px-3 py-1.5 text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50 flex items-center gap-2"
                >
                  <Upload className="w-3 h-3" />
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
                  className="px-3 py-1.5 text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50 flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  {isExporting ? "Exporting..." : "Export"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Treść */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </ReactFlowProvider>
  );
};