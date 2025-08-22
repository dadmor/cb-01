// src/modules/variables/hooks/useVariables.ts
import { useCallback } from 'react';
import { useVariablesStore } from '../stores/variablesStore';
import { VariablesManager } from '../services/variablesManager';

export const useVariables = () => {
  const variables = useVariablesStore(state => state.variables);
  const updateVariable = useVariablesStore(state => state.updateVariable);
  
  const setVariable = useCallback((name: string, value: number) => {
    updateVariable(name, value);
  }, [updateVariable]);
  
  const applyEffects = useCallback((effects: Record<string, number>) => {
    const updatedVariables = VariablesManager.applyEffects(variables, effects);
    useVariablesStore.setState({ variables: updatedVariables });
  }, [variables]);

  const evaluateCondition = useCallback((condition?: any) => {
    return VariablesManager.evaluate(variables, condition);
  }, [variables]);

  return {
    variables,
    setVariable,
    applyEffects,
    evaluateCondition
  };
};