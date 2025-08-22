// src/modules/variables/stores/variablesStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Variable } from "@/types";

interface VariablesStore {
  variables: Variable[];
  updateVariable: (name: string, value: number) => void;
}

// Default variables
export const DEFAULT_VARIABLES: Variable[] = [
  { name: "health", value: 10, initialValue: 10, min: 0, max: 20 },
  { name: "energy", value: 5, initialValue: 5, min: 0, max: 10 },
];

export const useVariablesStore = create<VariablesStore>()(
  persist(
    (set) => ({
      variables: DEFAULT_VARIABLES,
      updateVariable: (name, value) => set(state => ({
        variables: state.variables.map(v => 
          v.name === name ? { ...v, value } : v
        )
      })),
    }),
    {
      name: 'variables-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

// Granularne selektory
export const useVariable = (name: string) => 
  useVariablesStore(s => s.variables.find(v => v.name === name));

export const useVariableValue = (name: string) => 
  useVariablesStore(s => s.variables.find(v => v.name === name)?.value ?? 0);