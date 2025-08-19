import { create } from "zustand";

// ===== Variable Helpers =====
export const VARIABLES = {
  get: (vars, name) => vars.find((v) => v.name === name),

  upsert: (vars, name, value = 0, bounds) => {
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

  set: (vars, name, value) =>
    vars.map((v) =>
      v.name === name
        ? { ...v, value: VARIABLES.clamp(value, v.min, v.max) }
        : v
    ),

  applyDeltas: (vars, deltas) => {
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

  evaluate: (vars, cond) => {
    if (!cond) return true;
    const v = VARIABLES.get(vars, cond.varName);
    const val = v?.value ?? 0;
    const ops = {
      lt: val < cond.value,
      lte: val <= cond.value,
      eq: val === cond.value,
      neq: val !== cond.value,
      gte: val >= cond.value,
      gt: val > cond.value,
    };
    return ops[cond.op] ?? true;
  },

  clamp: (value, min, max) => {
    if (typeof min === "number" && value < min) return min;
    if (typeof max === "number" && value > max) return max;
    return value;
  },
};

// ===== Game Store =====
export const useGameStore = create((set, get) => ({
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
  upsertVariable: (name, value) =>
    set((s) => ({ variables: VARIABLES.upsert(s.variables, name, value) })),
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
