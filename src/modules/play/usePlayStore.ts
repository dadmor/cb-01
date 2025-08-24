// src/modules/play/usePlayStore.ts
import { create } from "zustand";
import { START_NODE_ID } from "@/modules/flow/store/useFlowStore";

interface PlayState {
  currentSceneId: string | null;
  start: () => void;
  goTo: (sceneId: string) => void;
  reset: () => void;
}

export const usePlayStore = create<PlayState>((set) => ({
  currentSceneId: null,
  start: () => set({ currentSceneId: START_NODE_ID }),
  goTo: (sceneId) => set({ currentSceneId: sceneId }),
  reset: () => set({ currentSceneId: START_NODE_ID }),
}));
