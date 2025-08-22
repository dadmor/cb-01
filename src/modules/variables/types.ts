export interface Variable {
    name: string;
    value: number;
    initialValue: number;
    min?: number;
    max?: number;
  }
  
  export const ConditionOperators = ["lt", "lte", "eq", "neq", "gte", "gt"] as const;
  export type ConditionOperator = typeof ConditionOperators[number];
  
  export interface Condition {
    varName: string;
    op: ConditionOperator;
    value: number;
  }
  
  // Type Guards
  export const isConditionOperator = (value: string): value is ConditionOperator =>
    ConditionOperators.includes(value as ConditionOperator);
  
  // Variable Store Types
  export interface VariablesStore {
    variables: Variable[];
    updateVariable: (name: string, value: number) => void;
  }