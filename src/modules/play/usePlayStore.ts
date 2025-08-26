/* ============================================
   src/modules/play/usePlayStore.ts
   ============================================ */
   import { create } from "zustand";
   import { START_NODE_ID } from "@/modules/flow/store/useFlowStore";
   import { useFlowStore } from "@/modules/flow/store/useFlowStore";
   import { useVideoPlayerStore } from "@/modules/video/store/videoPlayerStore";
   import { VideoStorageService } from "@/modules/video/services/VideoStorageService";
   
   interface PlayState {
     currentSceneId: string | null;
     start: () => void;
     goTo: (sceneId: string) => void;
     reset: () => void;
   
     /** Wywołaj z playera po zakończeniu odtwarzania wideo */
     onVideoEnded: () => void;
   }
   
   let autoAdvanceTimer: number | null = null;
   
   export const usePlayStore = create<PlayState>((set, get) => {
     const clearTimer = () => {
       if (autoAdvanceTimer) {
         window.clearTimeout(autoAdvanceTimer);
         autoAdvanceTimer = null;
       }
     };
   
     const loadSceneVideo = async (sceneId: string) => {
       const { nodes } = useFlowStore.getState();
       const scene = nodes.find((n) => n.id === sceneId && n.type === "scene");
       const videoId = (scene?.data as any)?.videoId as string | undefined;
   
       const player = useVideoPlayerStore.getState();
   
       if (!videoId) {
         player.clearCurrentVideo();
         return;
       }
   
       const storage = VideoStorageService.getInstance();
       await storage.initialize();
       const file = await storage.retrieveVideo(videoId);
   
       if (file) {
         player.setCurrentVideo(videoId, file);
         // autoplay zostawiamy komponentowi video (controls/autoplay tam)
       } else {
         player.clearCurrentVideo();
       }
     };
   
     const scheduleAutoAdvance = (sceneId: string) => {
       clearTimer();
   
       const flow = useFlowStore.getState();
       const node = flow.nodes.find((n) => n.id === sceneId && n.type === "scene");
       const data = (node?.data as any) || {};
   
       // Jeśli scena ma wideo → NIE ustawiamy timera.
       // Przejście wykona onVideoEnded() z playera.
       if (data.videoId) return;
   
       const durationSec = data.durationSec ?? 0;
       if (!durationSec || durationSec <= 0) return;
   
       autoAdvanceTimer = window.setTimeout(() => {
         const { nodes, edges } = useFlowStore.getState();
   
         const outgoing = edges.filter((e) => e.source === sceneId);
         const targets = outgoing
           .map((e) => nodes.find((n) => n.id === e.target))
           .filter(Boolean) as { id: string; type: string }[];
   
         // jeśli są Choice — czekamy na wybór
         if (targets.some((t) => t.type === "choice")) return;
   
         // bezpośrednia Scene → przejdź
         const nextScene = targets.find((t) => t.type === "scene");
         if (nextScene) {
           get().goTo(nextScene.id);
         }
       }, Math.max(0, durationSec * 1000));
     };
   
     const advanceAfterEnd = () => {
       const sceneId = get().currentSceneId;
       if (!sceneId) return;
   
       const { nodes, edges } = useFlowStore.getState();
       const outgoing = edges.filter((e) => e.source === sceneId);
       const targets = outgoing
         .map((e) => nodes.find((n) => n.id === e.target))
         .filter(Boolean) as { id: string; type: string }[];
   
       // Jeśli są Choice — stop (gracz musi wybrać).
       if (targets.some((t) => t.type === "choice")) return;
   
       // W innym razie przejdź do pierwszej sceny
       const nextScene = targets.find((t) => t.type === "scene");
       if (nextScene) {
         get().goTo(nextScene.id);
       }
     };
   
     return {
       currentSceneId: null,
   
       start: () => {
         const id = START_NODE_ID;
         set({ currentSceneId: id });
         loadSceneVideo(id);
         scheduleAutoAdvance(id);
       },
   
       goTo: (sceneId) => {
         set({ currentSceneId: sceneId });
         loadSceneVideo(sceneId);
         scheduleAutoAdvance(sceneId);
       },
   
       reset: () => {
         clearTimer();
         const id = START_NODE_ID;
         set({ currentSceneId: id });
         loadSceneVideo(id);
         scheduleAutoAdvance(id);
       },
   
       onVideoEnded: advanceAfterEnd,
     };
   });
   