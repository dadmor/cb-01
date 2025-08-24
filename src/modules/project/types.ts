// src/modules/project/types.ts
import { StoryNode, StoryEdge } from '@/modules/flow/types';
import { Variable } from '@/modules/variables/types';

export interface ProjectData {
  title: string;
  nodes: StoryNode[];
  edges: StoryEdge[];
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