// ------ src/gameStore.ts ------
import { create } from "zustand";

// ===== Types =====
export type Mode = "edit" | "play";

export type Op = "lt" | "lte" | "eq" | "neq" | "gte" | "gt";

export interface Condition {
  varName: string;
  op: Op;
  value: number;
}

export interface Variable {
  name: string;
  value: number;
  min?: number;
  max?: number;
}

export type VariablesArray = Variable[];

type Bounds = { min?: number; max?: number };

// ===== Variable Helpers (typed) =====
export const VARIABLES = {
  get: (vars: VariablesArray, name: string): Variable | undefined =>
    vars.find((v) => v.name === name),

  upsert: (vars: VariablesArray, name: string, value = 0, bounds?: Bounds): VariablesArray => {
    const exists = VARIABLES.get(vars, name);
    if (exists) {
      return vars.map((v) =>
        v.name === name
          ? {
              ...v,
              value,
              min: bounds?.min ?? v.min,
              max: bounds?.max ?? v.max,
            }
          : v
      );
    }
    return [...vars, { name, value, min: bounds?.min, max: bounds?.max }];
  },

  set: (vars: VariablesArray, name: string, value: number): VariablesArray =>
    vars.map((v) =>
      v.name === name ? { ...v, value: VARIABLES.clamp(value, v.min, v.max) } : v
    ),

  applyDeltas: (vars: VariablesArray, deltas?: Record<string, number>): VariablesArray => {
    if (!deltas) return vars;
    let next = [...vars];
    Object.entries(deltas).forEach(([name, delta]) => {
      const existing = VARIABLES.get(next, name);
      if (existing) {
        next = next.map((v) =>
          v.name === name
            ? { ...v, value: VARIABLES.clamp(v.value + delta, v.min, v.max) }
            : v
        );
      } else {
        next.push({ name, value: delta });
      }
    });
    return next;
  },

  evaluate: (vars: VariablesArray, cond?: Condition): boolean => {
    if (!cond) return true;
    const v = VARIABLES.get(vars, cond.varName);
    const val = v?.value ?? 0;
    const ops: Record<Op, boolean> = {
      lt: val < cond.value,
      lte: val <= cond.value,
      eq: val === cond.value,
      neq: val !== cond.value,
      gte: val >= cond.value,
      gt: val > cond.value,
    };
    return ops[cond.op];
  },

  clamp: (value: number, min?: number, max?: number): number => {
    if (typeof min === "number" && value < min) return min;
    if (typeof max === "number" && value > max) return max;
    return value;
  },
} as const;

// ===== Game Store (typed) =====
export interface GameState {
  mode: Mode;
  isGameOver: boolean;
  currentNodeId: string;
  lastDecision: string;
  variables: VariablesArray;
  initialVariables: VariablesArray;

  setMode: (m: Mode) => void;
  setGameOver: (v: boolean) => void;
  setCurrentNode: (id: string, lastDecision?: string) => void;
  setVariables: (updater: (vars: VariablesArray) => VariablesArray) => void;
  upsertVariable: (name: string, value?: number, bounds?: Bounds) => void;
  setVariableValue: (name: string, value: number) => void;
  takeInitialSnapshot: () => void;
  reset: (startNodeId: string) => void;
  startPlay: (startNodeId: string) => void;
  stopPlay: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  mode: "edit",
  isGameOver: false,
  currentNodeId: "",
  lastDecision: "—",
  variables: [
    { name: "klucz", value: 0, min: 0 },
    { name: "miecz", value: 0, min: 0 },
  ],
  initialVariables: [],

  setMode: (m) => set({ mode: m }),
  setGameOver: (v) => set({ isGameOver: v }),
  setCurrentNode: (id, lastDecision) =>
    set({
      currentNodeId: id,
      lastDecision: lastDecision ?? get().lastDecision,
    }),
  setVariables: (updater) => set((s) => ({ variables: updater(s.variables) })),
  upsertVariable: (name, value = 0, bounds) =>
    set((s) => ({ variables: VARIABLES.upsert(s.variables, name, value, bounds) })),
  setVariableValue: (name, value) =>
    set((s) => ({ variables: VARIABLES.set(s.variables, name, value) })),
  takeInitialSnapshot: () =>
    set((s) => ({ initialVariables: s.variables.map((v) => ({ ...v })) })),
  reset: (startNodeId) =>
    set((s) => ({
      variables: s.initialVariables.map((v) => ({ ...v })),
      currentNodeId: startNodeId,
      lastDecision: "—",
      isGameOver: false,
    })),
  startPlay: (startNodeId) => {
    const s = get();
    set({ mode: "play", initialVariables: s.variables.map((v) => ({ ...v })) });
    get().reset(startNodeId);
  },
  stopPlay: () => set({ mode: "edit", isGameOver: false }),
}));

