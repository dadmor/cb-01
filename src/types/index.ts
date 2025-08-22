import { Node, Edge, NodeChange, EdgeChange } from "reactflow";

// Core domain types
export interface Variable {
  name: string;
  value: number;
  initialValue: number;
  min?: number;
  max?: number;
}

export const ConditionOperators = ["lt", "lte", "eq", "neq", "gte", "gt"] as const;
export type ConditionOperator = typeof ConditionOperators[number];

export interface Condition {
  varName: string;
  op: ConditionOperator;
  value: number;
}

export interface VideoSegment {
  id: string;
  start: number;
  end: number;
  duration: number;
  label?: string;
}

// Node types
export interface SceneNodeData {
  label: string;
  description?: string;
  durationSec: number;
  condition?: Condition;
  defaultChoiceId?: string; // ID of choice to auto-select on timeout
  videoSegmentId?: string; // ID of associated video segment
  // Runtime state - only present during play mode
  isUnlocked?: boolean;
  isCurrent?: boolean;
  remainingMs?: number;
}

export interface ChoiceNodeData {
  label: string;
  effects: Record<string, number>;
  // Runtime state - only present during play mode
  isAvailable?: boolean;
  onClick?: () => void;
}

export type SceneNode = Node<SceneNodeData, "scene">;
export type ChoiceNode = Node<ChoiceNodeData, "choice">;
export type StoryNode = SceneNode | ChoiceNode;
export type StoryEdge = Edge;

// Type guards
export const isSceneNode = (node: StoryNode): node is SceneNode => 
  node.type === "scene";

export const isChoiceNode = (node: StoryNode): node is ChoiceNode => 
  node.type === "choice";

export const isConditionOperator = (value: string): value is ConditionOperator =>
  ConditionOperators.includes(value as ConditionOperator);

// App state
export interface GameState {
  mode: "edit" | "play";
  currentNodeId: string | null;
  isGameOver: boolean;
  variables: Variable[];
}

export interface ProjectData {
  title: string;
  nodes: StoryNode[];
  edges: StoryEdge[];
  variables: Variable[];
  videoSegments: VideoSegment[];
  version: string;
}

// Event types for better type safety
export interface GameEvents {
  'game:started': { nodeId: string };
  'game:stopped': void;
  'node:selected': { nodeId: string };
  'segment:selected': { segmentId: string };
  'variable:changed': { name: string; value: number };
}

// Controller types
export interface TimelineController {
  playSegment: (segmentId: string) => void;
  seekToTime: (time: number) => void;
}

// React Flow type helpers
export type StoryNodeChange = NodeChange;
export type StoryEdgeChange = EdgeChange;

// Utility types
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;