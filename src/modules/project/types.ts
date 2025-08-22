// src/modules/project/types.ts
import { StoryNode, StoryEdge } from '@/modules/flow/types';
import { Variable } from '@/modules/variables/types';
import { VideoSegment } from '@/modules/video/types';

export interface ProjectData {
  title: string;
  nodes: StoryNode[];
  edges: StoryEdge[];
  variables: Variable[];
  videoSegments: VideoSegment[];
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
  hasVideo: boolean;
}