// ------ src/gameStore.ts ------
import { create } from "zustand";
import { Variable, Condition } from "./types";

interface GameStore {
  // State
  mode: "edit" | "play";
  isGameOver: boolean;
  currentNodeId: string | null;
  lastDecisionLabel: string | null;
  variables: Variable[];

  // Actions
  startPlay: (startNodeId: string) => void;
  stopPlay: () => void;
  reset: (startNodeId: string) => void;
  setCurrentNode: (nodeId: string, decisionLabel?: string) => void;
  setGameOver: (gameOver: boolean) => void;
  setVariables: (updater: (vars: Variable[]) => Variable[]) => void;
  setVariableValue: (name: string, value: number) => void;
  upsertVariable: (name: string, value: number, initialValue?: number) => void;
  deleteVariable: (name: string) => void;
}

// Initial variables with initial values
const DEFAULT_VARIABLES: Variable[] = [
  { name: "zdrowie", value: 10, initialValue: 10, min: 0, max: 20 },
  { name: "energia", value: 5, initialValue: 5, min: 0, max: 10 },
];

export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  mode: "edit",
  isGameOver: false,
  currentNodeId: null,
  lastDecisionLabel: null,
  variables: DEFAULT_VARIABLES,

  // Start playing from a specific node
  startPlay: (startNodeId) => {
    set((state) => ({
      mode: "play",
      isGameOver: false,
      currentNodeId: startNodeId,
      lastDecisionLabel: null,
      // Reset variables to initial values when starting
      variables: state.variables.map((v) => ({ ...v, value: v.initialValue })),
    }));
  },

  // Stop playing and return to edit mode
  stopPlay: () => {
    set({
      mode: "edit",
      isGameOver: false,
      currentNodeId: null,
      lastDecisionLabel: null,
    });
  },

  // Reset game to start node with initial variable values
  reset: (startNodeId) => {
    set((state) => ({
      mode: "play",
      isGameOver: false,
      currentNodeId: startNodeId,
      lastDecisionLabel: null,
      // Reset variables to initial values
      variables: state.variables.map((v) => ({ ...v, value: v.initialValue })),
    }));
  },

  // Update current node
  setCurrentNode: (nodeId, decisionLabel) => {
    set({
      currentNodeId: nodeId,
      lastDecisionLabel: decisionLabel,
    });
  },

  // Set game over state
  setGameOver: (gameOver) => {
    set({ isGameOver: gameOver });
  },

  // Update variables with constraints
  setVariables: (updater) => {
    set((state) => ({
      variables: updater(state.variables).map((v) => {
        let value = v.value;
        if (v.min !== undefined) value = Math.max(v.min, value);
        if (v.max !== undefined) value = Math.min(v.max, value);
        return { ...v, value };
      }),
    }));
  },

  // Update single variable value (for edit mode)
  setVariableValue: (name, value) => {
    set((state) => ({
      variables: state.variables.map((v) => {
        if (v.name !== name) return v;
        const newValue = v.min !== undefined ? Math.max(v.min, value) : value;
        const finalValue =
          v.max !== undefined ? Math.min(v.max, newValue) : newValue;
        return { ...v, value: finalValue };
      }),
    }));
  },

  // Add or update variable (for edit mode)
  upsertVariable: (name, value, initialValue) => {
    set((state) => {
      const existing = state.variables.find((v) => v.name === name);
      if (existing) {
        return {
          variables: state.variables.map((v) =>
            v.name === name
              ? { ...v, value, initialValue: initialValue ?? value }
              : v
          ),
        };
      }
      return {
        variables: [
          ...state.variables,
          { name, value, initialValue: initialValue ?? value },
        ],
      };
    });
  },

  // Remove variable (for edit mode)
  deleteVariable: (name) => {
    set((state) => ({
      variables: state.variables.filter((v) => v.name !== name),
    }));
  },
}));

// Variable utilities
export const VARIABLES = {
  evaluate: (variables: Variable[], condition?: Condition): boolean => {
    if (!condition) return true;

    const variable = variables.find((v) => v.name === condition.varName);
    if (!variable) return false;

    const { value } = variable;
    const target = condition.value;

    switch (condition.op) {
      case "lt":
        return value < target;
      case "lte":
        return value <= target;
      case "eq":
        return value === target;
      case "neq":
        return value !== target;
      case "gte":
        return value >= target;
      case "gt":
        return value > target;
      default:
        return false;
    }
  },

  applyDeltas: (
    variables: Variable[],
    deltas?: Record<string, number>
  ): Variable[] => {
    if (!deltas) return variables;

    return variables.map((v) => {
      const delta = deltas[v.name] ?? 0;
      if (delta === 0) return v;

      let newValue = v.value + delta;
      if (v.min !== undefined) newValue = Math.max(v.min, newValue);
      if (v.max !== undefined) newValue = Math.min(v.max, newValue);

      return { ...v, value: newValue };
    });
  },
};
