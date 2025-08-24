// src/modules/variables/logic.ts
import type { Variable, Condition } from "./types";

export const getVarValue = (variables: Variable[], name: string): number | undefined =>
  variables.find(v => v.name === name)?.value;

export const clampToBounds = (v: Variable, next: number): number => {
  let val = next;
  if (typeof v.min === "number") val = Math.max(val, v.min);
  if (typeof v.max === "number") val = Math.min(val, v.max);
  return val;
};

export const evalCondition = (cond: Condition, variables: Variable[]): boolean => {
  const current = getVarValue(variables, cond.varName);
  if (typeof current !== "number") return false;
  switch (cond.op) {
    case "lt":  return current <  cond.value;
    case "lte": return current <= cond.value;
    case "eq":  return current === cond.value;
    case "neq": return current !== cond.value;
    case "gte": return current >= cond.value;
    case "gt":  return current >  cond.value;
    default:    return true;
  }
};

export const evalConditions = (conds: Condition[] | undefined, vars: Variable[]): boolean => {
  if (!conds || conds.length === 0) return true;
  return conds.every(c => evalCondition(c, vars));
};

export const conditionLabel = (cond: Condition): string => {
  const symbol = { lt: "<", lte: "≤", eq: "=", neq: "≠", gte: "≥", gt: ">" }[cond.op];
  return `${cond.varName} ${symbol} ${cond.value}`;
};

export const applyEffects = (
  effects: Record<string, number>,
  variables: Variable[]
): Variable[] => {
  return variables.map(v => {
    const delta = effects[v.name] ?? 0;
    if (delta === 0) return v;
    const next = clampToBounds(v, v.value + delta);
    return { ...v, value: next };
  });
};
