// src/modules/game/types.ts

export interface GameState {
    mode: "edit" | "play";
    currentNodeId: string | null;
    isGameOver: boolean;
  }
  
  export interface GameStateStore extends GameState {
    // Store interface includes the state
  }
  
  // Game Events for event-driven architecture
  export interface GameEvents {
    'game:started': { nodeId: string };
    'game:stopped': void;
    'game:ended': { reason: 'timeout' | 'no-choices' | 'manual' };
    'node:entered': { nodeId: string };
    'node:selected': { nodeId: string };
    'choice:made': { choiceId: string; targetNodeId: string };
    'variable:changed': { name: string; value: number; oldValue: number };
  }
  
  // Game transition options
  export interface GameTransitionOptions {
    effects?: Record<string, number>;
    skipConditionCheck?: boolean;
  }