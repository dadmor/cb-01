import { create } from "zustand";
import { GameState, Variable } from "@/types";
import { DEFAULT_VARIABLES, VariablesManager } from "@/modules/variables";

interface GameStore extends GameState {
  // Actions
  startGame: (startNodeId: string) => void;
  stopGame: () => void;
  resetGame: (startNodeId: string) => void;
  setCurrentNode: (nodeId: string) => void;
  setGameOver: (isOver: boolean) => void;
  
  // Variable management
  updateVariables: (updater: (vars: Variable[]) => Variable[]) => void;
  setVariable: (name: string, value: number) => void;
  addVariable: (variable: Variable) => void;
  removeVariable: (name: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  mode: "edit",
  currentNodeId: null,
  isGameOver: false,
  variables: DEFAULT_VARIABLES,

  // Game control
  startGame: (startNodeId) => set(state => ({
    mode: "play",
    currentNodeId: startNodeId,
    isGameOver: false,
    variables: VariablesManager.resetToInitial(state.variables)
  })),

  stopGame: () => set({
    mode: "edit",
    currentNodeId: null,
    isGameOver: false
  }),

  resetGame: (startNodeId) => set(state => ({
    mode: "play",
    currentNodeId: startNodeId,
    isGameOver: false,
    variables: VariablesManager.resetToInitial(state.variables)
  })),

  setCurrentNode: (nodeId) => set({ currentNodeId: nodeId }),
  
  setGameOver: (isOver) => set({ isGameOver: isOver }),

  // Variable management
  updateVariables: (updater) => set(state => ({
    variables: updater(state.variables)
  })),

  setVariable: (name, value) => set(state => ({
    variables: state.variables.map(v => 
      v.name === name ? { ...v, value } : v
    )
  })),

  addVariable: (variable) => set(state => ({
    variables: [...state.variables, variable]
  })),

  removeVariable: (name) => set(state => ({
    variables: state.variables.filter(v => v.name !== name)
  }))
}));