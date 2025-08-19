// ------ src/types.ts ------
import { Node, Edge, NodeProps, Connection } from "reactflow";

// ===== Game Types =====
export type Mode = "edit" | "play";
export type Op = "lt" | "lte" | "eq" | "neq" | "gte" | "gt";

export interface Condition {
  varName: string;
  op: Op;
  value: number;
}

export interface Variable {
  name: string;
  value: number;
  min?: number;
  max?: number;
}

export type VariablesArray = Variable[];
export type Bounds = { min?: number; max?: number };
export type DeltasRecord = Record<string, number>;

// ===== Node Data Types =====
export interface MainNodeData {
  label: string;
  durationSec: number;
  condition?: Condition;
  defaultDecisionId?: string;
  // Runtime data (added by FlowCanvas)
  isUnlocked?: boolean;
  isCurrent?: boolean;
  remainingMs?: number;
}

export interface DecisionNodeData {
  label: string;
  deltas: DeltasRecord;
  // Runtime data (added by FlowCanvas)
  isAvailable?: boolean;
  onClick?: () => void;
}

// ===== Node Types =====
export type MainNode = Node<MainNodeData, "main">;
export type DecisionNode = Node<DecisionNodeData, "decision">;
export type FlowNode = MainNode | DecisionNode;

// ===== Edge Types =====
export interface FlowEdgeData {
  animated?: boolean;
}

export type FlowEdge = Edge<FlowEdgeData>;

// ===== Node Props Types (for components) =====
export interface MainNodeProps extends NodeProps<MainNodeData> {
  selected: boolean;
}

export interface DecisionNodeProps extends NodeProps<DecisionNodeData> {
  selected: boolean;
}

// ===== Hook Types =====
export type IsNodeUnlockedFn = (node: FlowNode) => boolean;
export type TraverseDecisionFn = (decisionNodeId: string) => void;

export interface NodeRuntimeResult {
  remainingMs: number;
}

// ===== Helper to extract node data type =====
export type NodeData<T extends FlowNode> = T extends Node<infer D> ? D : never;