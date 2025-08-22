// src/modules/game/stores/gameStateStore.ts
import { create } from "zustand";

interface GameStateStore {
  mode: "edit" | "play";
  currentNodeId: string | null;
  isGameOver: boolean;
}

const useGameStateStore = create<GameStateStore>()((set) => ({
  mode: "edit",
  currentNodeId: null,
  isGameOver: false,
}));

// Eksportuj selektory
export const useGameMode = () => useGameStateStore(s => s.mode);
export const useCurrentNodeId = () => useGameStateStore(s => s.currentNodeId);
export const useIsGameOver = () => useGameStateStore(s => s.isGameOver);

export { useGameStateStore };
export const setGameState = (partial: Partial<GameStateStore>) => 
  useGameStateStore.setState(partial);