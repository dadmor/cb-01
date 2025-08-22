// src/modules/variables/services/variablesManager.ts
import { Variable, Condition } from "@/types";

export class VariablesManager {
  static evaluate(variables: Variable[], condition?: Condition): boolean {
    if (!condition) return true;
    
    const variable = variables.find(v => v.name === condition.varName);
    if (!variable) return false;
    
    const { value } = variable;
    const target = condition.value;
    
    switch (condition.op) {
      case "lt": return value < target;
      case "lte": return value <= target;
      case "eq": return value === target;
      case "neq": return value !== target;
      case "gte": return value >= target;
      case "gt": return value > target;
      default: return false;
    }
  }

  static applyEffects(
    variables: Variable[], 
    effects?: Record<string, number>
  ): Variable[] {
    if (!effects) return variables;
    
    return variables.map(v => {
      const delta = effects[v.name] ?? 0;
      if (delta === 0) return v;
      
      let newValue = v.value + delta;
      if (v.min !== undefined) newValue = Math.max(v.min, newValue);
      if (v.max !== undefined) newValue = Math.min(v.max, newValue);
      
      return { ...v, value: newValue };
    });
  }

  static resetToInitial(variables: Variable[]): Variable[] {
    return variables.map(v => ({ ...v, value: v.initialValue }));
  }

  static createVariable(
    name: string, 
    initialValue: number, 
    min?: number, 
    max?: number
  ): Variable {
    return { name, value: initialValue, initialValue, min, max };
  }
}