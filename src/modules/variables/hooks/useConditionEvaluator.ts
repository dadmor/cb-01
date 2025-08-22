// src/modules/variables/hooks/useConditionEvaluator.ts
import { useMemo } from 'react';
import { useVariablesStore } from '../stores/variablesStore';
import { VariablesManager } from '../services/variablesManager';
import { Condition } from '../types';

export const useConditionEvaluator = () => {
  const variables = useVariablesStore(s => s.variables);
  
  return useMemo(
    () => ({
      evaluate: (condition?: Condition) => 
        VariablesManager.evaluate(variables, condition)
    }),
    [variables]
  );
};