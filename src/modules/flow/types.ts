// src/modules/flow/types.ts
import { Node, Edge, NodeChange, EdgeChange } from "@xyflow/react";
import { Condition } from "@/modules/variables";

// Flow-specific types only
export interface SceneNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  durationSec: number;
  condition?: Condition;  // Import from variables module
  defaultChoiceId?: string;
  videoSegmentId?: string;
  // Runtime state
  isUnlocked?: boolean;
  isCurrent?: boolean;
  remainingMs?: number;
  hasCondition?: boolean;
}

export interface ChoiceNodeData extends Record<string, unknown> {
  label: string;
  effects: Record<string, number>;
  // Runtime state
  isAvailable?: boolean;
  onClick?: () => void;
  id?: string;
}

// Node Types
export type SceneNode = Node<SceneNodeData, "scene">;
export type ChoiceNode = Node<ChoiceNodeData, "choice">;
export type StoryNode = SceneNode | ChoiceNode;
export type StoryEdge = Edge;

// Type Guards
export const isSceneNode = (node: StoryNode): node is SceneNode => 
  node.type === "scene";
export const isChoiceNode = (node: StoryNode): node is ChoiceNode => 
  node.type === "choice";

// React Flow Helpers
export type StoryNodeChange = NodeChange;
export type StoryEdgeChange = EdgeChange;