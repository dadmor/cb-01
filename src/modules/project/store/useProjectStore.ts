// src/modules/project/store/useProjectStore.ts
import { create } from "zustand";
import { useFlowStore } from "@/modules/flow/store/useFlowStore";
import { useVariablesStore } from "@/modules/variables/store/useVariablesStore";
import { useVideoPlayerStore } from "@/modules/video/store/videoPlayerStore";
import type { ProjectData } from "../types";

interface ProjectState {
  projectTitle: string;
  lastSaved: Date | null;
  isDirty: boolean;
  
  setProjectTitle: (title: string) => void;
  markAsSaved: () => void;
  markAsDirty: () => void;
  
  // Project operations
  exportProject: () => ProjectData;
  importProject: (data: ProjectData) => void;
  newProject: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectTitle: "Untitled Project",
  lastSaved: null,
  isDirty: false,
  
  setProjectTitle: (title) => set({ projectTitle: title, isDirty: true }),
  markAsSaved: () => set({ lastSaved: new Date(), isDirty: false }),
  markAsDirty: () => set({ isDirty: true }),
  
  exportProject: () => {
    const flowState = useFlowStore.getState();
    const variablesState = useVariablesStore.getState();
    const { projectTitle } = get();
    
    return {
      title: projectTitle,
      nodes: flowState.nodes,
      edges: flowState.edges,
      variables: variablesState.variables,
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
  
  importProject: (data) => {
    // Load data into individual stores
    useFlowStore.getState().loadNodes(data.nodes);
    useFlowStore.getState().loadEdges(data.edges);
    useVariablesStore.getState().loadVariables(data.variables);
    
    // Update project metadata
    set({
      projectTitle: data.title,
      lastSaved: null,
      isDirty: false,
    });
  },
  
  newProject: () => {
    // Reset all stores
    useFlowStore.getState().reset();
    useVariablesStore.getState().reset();
    useVideoPlayerStore.getState().clearCurrentVideo();
    
    // Reset project metadata
    set({
      projectTitle: "Untitled Project",
      lastSaved: null,
      isDirty: false,
    });
  },
}));