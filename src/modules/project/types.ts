// src/modules/project/types.ts
import type { Edge } from '@xyflow/react';
import { StoryNode } from '@/modules/flow/types';
import { Variable } from '@/modules/variables/types';

export interface ProjectData {
  title: string;
  nodes: StoryNode[];
  edges: Edge[];           // ▲ używamy bezpośrednio Edge z @xyflow/react
  variables: Variable[];
  version: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectMetadata {
  title: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  edgeCount: number;
}
