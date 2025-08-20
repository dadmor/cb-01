import { Node, Edge } from "reactflow";

// Core domain types
export interface Variable {
  name: string;
  value: number;
  initialValue: number;
  min?: number;
  max?: number;
}

export interface Condition {
  varName: string;
  op: "lt" | "lte" | "eq" | "neq" | "gte" | "gt";
  value: number;
}

export interface VideoSegment {
  id: string;
  start: number;
  end: number;
  duration: number;
}

// Node types
export interface SceneNodeData {
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
}

export interface ChoiceNodeData {
  label: string;
  effects: Record<string, number>;
  // Runtime state
  isAvailable?: boolean;
  onClick?: () => void;
}

export type SceneNode = Node<SceneNodeData, "scene">;
export type ChoiceNode = Node<ChoiceNodeData, "choice">;
export type StoryNode = SceneNode | ChoiceNode;
export type StoryEdge = Edge;

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