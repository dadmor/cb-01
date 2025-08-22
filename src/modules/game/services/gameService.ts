// src/modules/game/services/gameService.ts
import { useGameStateStore } from '../stores/gameStateStore';
import { useVariablesStore } from '@/modules/variables/stores/variablesStore';
import { VariablesManager } from '@/modules/variables/services/variablesManager';

export class GameService {
  static startGame(startNodeId: string) {
    useGameStateStore.setState({
      mode: "play",
      currentNodeId: startNodeId,
      isGameOver: false
    });
    
    const { variables } = useVariablesStore.getState();
    useVariablesStore.setState({
      variables: VariablesManager.resetToInitial(variables)
    });
  }

  static stopGame() {
    useGameStateStore.setState({
      mode: "edit",
      currentNodeId: null,
      isGameOver: false
    });
  }

  static transition(nodeId: string, effects?: Record<string, number>) {
    const { mode, isGameOver } = useGameStateStore.getState();
    if (mode !== "play" || isGameOver) return false;
    
    if (effects) {
      const { variables } = useVariablesStore.getState();
      useVariablesStore.setState({
        variables: VariablesManager.applyEffects(variables, effects)
      });
    }
    
    useGameStateStore.setState({ currentNodeId: nodeId });
    return true;
  }
}