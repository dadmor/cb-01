export interface Variable {
  name: string;
  value: number;
  initialValue: number;
  min?: number;
  max?: number;
}

export type ConditionOperator = "lt" | "lte" | "eq" | "neq" | "gte" | "gt";

export interface Condition {
  varName: string;
  op: ConditionOperator;
  value: number;
}

// (usunięto ConditionOperators, isConditionOperator i nieużywane VariablesStore)
