// src/modules/flow/types.ts
import { Node, Edge } from "@xyflow/react";
import { Condition } from "@/modules/variables/types";

// ============= DATA TYPES =============
export type SceneNodeData = {
  label: string;
  description?: string;
  durationSec: number;
  condition?: Condition;
  defaultChoiceId?: string;
  videoSegmentId?: string;
  // Runtime state
  isUnlocked?: boolean;
  isCurrent?: boolean;
  remainingMs?: number;
  hasCondition?: boolean;
}

export type ChoiceNodeData = {
  label: string;
  effects: Record<string, number>;
  // Runtime state
  isAvailable?: boolean;
  onClick?: () => void;
  id?: string;
}

// ============= NODE TYPES =============
export type SceneNode = Node<SceneNodeData, "scene">;
export type ChoiceNode = Node<ChoiceNodeData, "choice">;
export type StoryNode = SceneNode | ChoiceNode;

// ============= EDGE TYPE =============
export type StoryEdge = Edge;

// ============= TYPE GUARDS =============
export const isSceneNode = (node: StoryNode): node is SceneNode => 
  node.type === "scene";

export const isChoiceNode = (node: StoryNode): node is ChoiceNode => 
  node.type === "choice";