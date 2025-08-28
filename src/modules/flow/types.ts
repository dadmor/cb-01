// ============================================
// src/modules/flow/types.ts
// ============================================
import { Node } from "@xyflow/react";
import { Condition } from "@/modules/variables/types";

// ============= DATA TYPES =============
export type SceneNodeData = {
  label: string;
  description?: string;
  durationSec: number;       
  conditions?: Condition[];
  videoId?: string;
  isPriority?: boolean;    
  coverImage?: string;    
};

export type ChoiceNodeData = {
  label: string;
  effects: Record<string, number>;
};

// ============= NODE TYPES =============
export type SceneNode = Node<SceneNodeData, "scene">;
export type ChoiceNode = Node<ChoiceNodeData, "choice">;
export type StoryNode = SceneNode | ChoiceNode;

// ============= TYPE GUARDS =============
export const isSceneNode = (node: StoryNode): node is SceneNode =>
  node.type === "scene";

export const isChoiceNode = (node: StoryNode): node is ChoiceNode =>
  node.type === "choice";