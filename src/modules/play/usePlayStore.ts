/* ============================================
   src/modules/play/usePlayStore.ts
   
   SYSTEM PRZEPŁYWU NARRACJI - KLUCZOWA LOGIKA
   
   Ten moduł zarządza CAŁĄ logiką przepływu między scenami w czasie odtwarzania.
   
   KOMPONENTY SYSTEMU:
   - Scene nodes: bloki narracji z wideo/czasem, mogą mieć warunki (conditions) i priorytet (isPriority)
   - Choice nodes: decyzje gracza, aplikują efekty (effects) na zmienne (variables)
   - Variables: stan gry modyfikowany przez Choice.effects
   - Edges: połączenia między węzłami (Scene→Scene, Scene→Choice→Scene)
   
   LOGIKA PRZEPŁYWU PO ZAKOŃCZENIU WIDEO/CZASU:
   
   1. System sprawdza WSZYSTKIE wychodzące połączenia
   2. Filtruje dostępne opcje:
      - Scene są dostępne TYLKO gdy spełniają conditions (warunki są ABSOLUTNE)
      - Choice są dostępne TYLKO gdy prowadzą do dostępnych Scene
   
   3. PRIORYTETY DECYZYJNE:
      a) Jeśli są dostępne Choice → STOP, czekamy na wybór gracza (Choice ZAWSZE ma priorytet)
      b) Jeśli są tylko Scene → automatyczne przejście według priorytetów:
         - Pierwszeństwo: scena z isPriority=true (spośród DOSTĘPNYCH)
         - Domyślnie: pierwsza dostępna scena
      c) Jeśli nic nie jest dostępne → STOP (koniec ścieżki)
   
   LOGIKA CHOICE (wykonywana przez executeChoice):
   - Aplikuje effects na variables
   - Znajduje WSZYSTKIE sceny za Choice
   - Filtruje dostępne (spełniające conditions)
   - Wybiera scenę z isPriority=true LUB pierwszą dostępną
   - Przechodzi automatycznie do wybranej sceny
   
   KRYTYCZNE ZASADY:
   - Warunki (conditions) są ABSOLUTNE - niespełniony warunek = brak połączenia
   - isPriority działa TYLKO wśród scen SPEŁNIAJĄCYCH warunki
   - Choice ZAWSZE przerywa automatyczny przepływ
   - Po kliknięciu Choice system SAM wybiera scenę docelową według priorytetów
   ============================================ */
   import { create } from "zustand";
   import { START_NODE_ID } from "@/modules/flow/store/useFlowStore";
   import { useFlowStore } from "@/modules/flow/store/useFlowStore";
   import { useVideoPlayerStore } from "@/modules/video/store/videoPlayerStore";
   import { VideoStorageService } from "@/modules/video/services/VideoStorageService";
   import { evalConditions, applyEffects } from "@/modules/variables/logic";
   import { useVariablesStore } from "@/modules/variables/store/useVariablesStore";
   import { SceneNode, ChoiceNode, isSceneNode, isChoiceNode } from "@/modules/flow/types";
   
   interface PlayState {
     currentSceneId: string | null;
     start: () => void;
     goTo: (sceneId: string) => void;
     reset: () => void;
   
     /** Wywołaj z playera po zakończeniu odtwarzania wideo */
     onVideoEnded: () => void;
     
     /** 
      * Wykonuje Choice - aplikuje efekty i automatycznie wybiera scenę docelową.
      * @param choiceId - ID Choice node do wykonania
      * @returns true jeśli przejście się powiodło, false w przeciwnym razie
      */
     executeChoice: (choiceId: string) => boolean;
     
     /**
      * Zwraca dostępne Choice nodes dla obecnej sceny.
      * Choice jest dostępny tylko gdy prowadzi do przynajmniej jednej dostępnej sceny.
      */
     getAvailableChoices: () => ChoiceNode[];
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
       } else {
         player.clearCurrentVideo();
       }
     };
   
     /**
      * Znajduje następną scenę do automatycznego przejścia.
      * Używana TYLKO dla automatycznych przejść po zakończeniu wideo.
      */
     const findNextScene = (currentSceneId: string): string | null => {
       const { nodes, edges } = useFlowStore.getState();
       const { variables } = useVariablesStore.getState();
   
       // Znajdź wszystkie wychodzące krawędzie
       const outgoing = edges.filter((e) => e.source === currentSceneId);
       
       // Pobierz węzły docelowe
       const targets = outgoing
         .map((e) => nodes.find((n) => n.id === e.target))
         .filter((n): n is NonNullable<typeof n> => n !== undefined);
   
       // Podziel na Choice i Scene
       const choices = targets.filter((n): n is ChoiceNode => isChoiceNode(n));
       const scenes = targets.filter((n): n is SceneNode => isSceneNode(n));
   
       // 1. Jeśli są dostępne Choice (prowadzące do dostępnych scen)
       if (choices.length > 0) {
         // Sprawdź czy jakikolwiek Choice prowadzi do dostępnej sceny
         const hasAvailableChoice = choices.some(choice => {
           const choiceOutgoing = edges.filter(e => e.source === choice.id);
           const choiceTargets = choiceOutgoing
             .map(e => nodes.find(n => n.id === e.target))
             .filter((n): n is SceneNode => n !== undefined && isSceneNode(n));
           
           // Czy jest jakaś scena za tym Choice spełniająca warunki?
           return choiceTargets.some(scene => 
             evalConditions(scene.data.conditions, variables)
           );
         });
   
         if (hasAvailableChoice) {
           // Zatrzymaj - czekamy na wybór gracza
           return null;
         }
       }
   
       // 2. Filtruj tylko dostępne sceny (spełniające warunki)
       const availableScenes = scenes.filter(scene => 
         evalConditions(scene.data.conditions, variables)
       );
   
       if (availableScenes.length === 0) {
         // Brak dostępnych ścieżek
         return null;
       }
   
       // 3. Wybierz scenę według priorytetu
       const priorityScene = availableScenes.find(scene => scene.data.isPriority);
       if (priorityScene) {
         return priorityScene.id;
       }
   
       // 4. Jeśli nie ma priorytetu, wybierz pierwszą dostępną
       return availableScenes[0].id;
     };
   
     /**
      * Znajduje scenę docelową dla Choice według priorytetów.
      * KLUCZOWA FUNKCJA - wybiera scenę z isPriority lub pierwszą dostępną.
      */
     const findTargetSceneForChoice = (choiceId: string): string | null => {
       const { nodes, edges } = useFlowStore.getState();
       const { variables } = useVariablesStore.getState();
       
       // Znajdź wszystkie sceny za tym Choice
       const outgoingEdges = edges.filter(e => e.source === choiceId);
       const targetScenes = outgoingEdges
         .map(e => nodes.find(n => n.id === e.target))
         .filter((n): n is SceneNode => n !== undefined && isSceneNode(n));
       
       // Filtruj tylko dostępne (spełniające warunki)
       const availableScenes = targetScenes.filter(scene => 
         evalConditions(scene.data.conditions, variables)
       );
       
       if (availableScenes.length === 0) {
         return null;
       }
       
       // PRIORYTET: wybierz scenę z isPriority=true lub pierwszą dostępną
       const priorityScene = availableScenes.find(s => s.data.isPriority);
       return priorityScene ? priorityScene.id : availableScenes[0].id;
     };
   
     const scheduleAutoAdvance = (sceneId: string) => {
       clearTimer();
   
       const flow = useFlowStore.getState();
       const node = flow.nodes.find((n) => n.id === sceneId && n.type === "scene");
       const data = (node?.data as any) || {};
   
       // Jeśli scena ma wideo → NIE ustawiamy timera
       if (data.videoId) return;
   
       const durationSec = data.durationSec ?? 0;
       if (!durationSec || durationSec <= 0) return;
   
       autoAdvanceTimer = window.setTimeout(() => {
         const nextSceneId = findNextScene(sceneId);
         if (nextSceneId) {
           get().goTo(nextSceneId);
         }
       }, Math.max(0, durationSec * 1000));
     };
   
     const advanceAfterEnd = () => {
       const sceneId = get().currentSceneId;
       if (!sceneId) return;
   
       const nextSceneId = findNextScene(sceneId);
       if (nextSceneId) {
         get().goTo(nextSceneId);
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
   
       executeChoice: (choiceId: string): boolean => {
         const { nodes } = useFlowStore.getState();
         const { variables, loadVariables } = useVariablesStore.getState();
         
         // Znajdź Choice node
         const choice = nodes.find(n => n.id === choiceId);
         if (!choice || !isChoiceNode(choice)) {
           return false;
         }
         
         // Znajdź scenę docelową według priorytetów
         const targetSceneId = findTargetSceneForChoice(choiceId);
         if (!targetSceneId) {
           return false;
         }
         
         // Aplikuj efekty Choice na zmienne
         const nextVars = applyEffects(choice.data.effects || {}, variables);
         loadVariables(nextVars);
         
         // Przejdź do wybranej sceny
         get().goTo(targetSceneId);
         return true;
       },
       
       getAvailableChoices: (): ChoiceNode[] => {
         const currentSceneId = get().currentSceneId;
         if (!currentSceneId) return [];
         
         const { nodes, edges } = useFlowStore.getState();
         const { variables } = useVariablesStore.getState();
         
         // Znajdź Choice nodes wychodzące z obecnej sceny
         const outgoing = edges.filter(e => e.source === currentSceneId);
         const choices = outgoing
           .map(e => nodes.find(n => n.id === e.target))
           .filter((n): n is ChoiceNode => n !== undefined && isChoiceNode(n));
         
         // Filtruj tylko te Choice które prowadzą do dostępnych scen
         return choices.filter(choice => {
           const choiceOutgoing = edges.filter(e => e.source === choice.id);
           const choiceTargets = choiceOutgoing
             .map(e => nodes.find(n => n.id === e.target))
             .filter((n): n is SceneNode => n !== undefined && isSceneNode(n));
           
           // Czy jest jakaś dostępna scena za tym Choice?
           return choiceTargets.some(scene => 
             evalConditions(scene.data.conditions, variables)
           );
         });
       }
     };
   });