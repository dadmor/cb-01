// src/modules/variables/store/useVariablesStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Variable } from "../types";

interface VariablesState {
  variables: Variable[];
  updateVariable: (name: string, value: number) => void;
  addVariable: (name: string) => void;
  removeVariable: (name: string) => void;
  reset: () => void;
  loadVariables: (variables: Variable[]) => void;
}

const DEFAULT_VARIABLES: Variable[] = [
  { name: "health", value: 10, initialValue: 10 },
  { name: "energy", value: 5, initialValue: 5 },
];

export const useVariablesStore = create<VariablesState>()(
  persist(
    (set) => ({
      variables: DEFAULT_VARIABLES,
      
      updateVariable: (name, value) =>
        set((state) => ({
          variables: state.variables.map((v) =>
            v.name === name ? { ...v, value } : v
          ),
        })),
        
      addVariable: (name) =>
        set((state) => ({
          variables: [...state.variables, {
            name,
            value: 0,
            initialValue: 0
          }]
        })),
        
      removeVariable: (name) =>
        set((state) => ({
          variables: state.variables.filter(v => v.name !== name)
        })),
        
      reset: () => set({ variables: DEFAULT_VARIABLES }),
      
      loadVariables: (variables) => set({ variables }),
    }),
    {
      name: "variables-storage",
    }
  )
);