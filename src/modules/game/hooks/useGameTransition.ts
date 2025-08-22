// src/modules/game/hooks/useGameTransition.ts
import { useCallback } from 'react';
import { useGameMode, useIsGameOver } from '../stores/gameStateStore';
import { GameService } from '../services/gameService';

export const useGameTransition = () => {
  const mode = useGameMode();
  const isGameOver = useIsGameOver();
  
  return useCallback((nodeId: string, effects?: Record<string, number>) => {
    if (mode !== "play" || isGameOver) return;
    GameService.transition(nodeId, effects);
  }, [mode, isGameOver]);
};