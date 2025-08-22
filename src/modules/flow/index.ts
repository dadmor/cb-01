// src/modules/flow/index.ts

// WAŻNE: Kolejność exportów ma znaczenie!
// Najpierw eksportuj typy, potem store, potem komponenty

// Export types and type guards
export type {
    SceneNodeData,
    ChoiceNodeData,
    SceneNode,
    ChoiceNode,
    StoryNode,
    StoryEdge
  } from './types';
  
  export { isSceneNode, isChoiceNode } from './types';
  
  // Export store and hooks
  export {
    useFlowStore,
    useNodes,
    useEdges,
    useSelectedNodeId,
    useSelectedNode,
    START_NODE_ID
  } from './store';
  
  // Export components
  export { FlowCanvas } from './FlowCanvas';
  export { SceneNode as SceneNodeComponent } from './nodes/SceneNode';
  export { ChoiceNode as ChoiceNodeComponent } from './nodes/ChoiceNode';
  
  // Export utilities
  export * from './blockSnippets';
  export * from './gridHelpers';