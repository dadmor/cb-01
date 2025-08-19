// ------ src/types.ts ------
import { Node, Edge } from "reactflow";

// Extended Variable with initial value
export interface Variable {
  name: string;
  value: number;
  initialValue: number;
  min?: number;
  max?: number;
}

// Project format for import/export
export interface ProjectData {
  title: string;
  description?: string;
  variables: Variable[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  version: string;
  createdAt?: string;
  updatedAt?: string;
}

// Conditions
export type Op = "lt" | "lte" | "eq" | "neq" | "gte" | "gt";

export interface Condition {
  varName: string;
  op: Op;
  value: number;
}

// Node data types
export interface MainNodeData {
  label: string;
  durationSec: number;
  condition?: Condition;
  defaultDecisionId?: string;
  // Runtime state (added by FlowCanvas)
  isUnlocked?: boolean;
  isCurrent?: boolean;
  remainingMs?: number;
}

export interface DecisionNodeData {
  label: string;
  deltas: Record<string, number>;
  // Runtime state (added by FlowCanvas)
  isAvailable?: boolean;
  onClick?: () => void;
}

// Node types
export type MainNode = Node<MainNodeData, "main">;
export type DecisionNode = Node<DecisionNodeData, "decision">;
export type FlowNode = MainNode | DecisionNode;
export type FlowEdge = Edge;

// Props types
export interface MainNodeProps {
  data: MainNodeData;
  selected?: boolean;
}

export interface DecisionNodeProps {
  data: DecisionNodeData;
  selected?: boolean;
}

// Function types
export type IsNodeUnlockedFn = (node: FlowNode) => boolean;
export type TraverseDecisionFn = (decisionNodeId: string) => void;

export interface NodeRuntimeResult {
  remainingMs: number;
}