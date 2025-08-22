// src/modules/video/types.ts

export interface VideoSegment {
    id: string;
    start: number;
    end: number;
    duration: number;
    label?: string;
  }
  
  export interface VideoMetadata {
    fileName: string;
    fileSize: number;
    lastModified: number;
    mimeType: string;
    storageId?: string; // ID in OPFS storage
  }
  
  export interface TimelineController {
    playSegment?: (segmentId: string) => void;
    seekToTime?: (time: number) => void;
  }
  
  export interface VideoStore {
    videoFile: File | null;
    videoUrl: string | null;
    videoMetadata: VideoMetadata | null;
    segments: VideoSegment[];
    selectedSegmentId: string | null;
    showTimeline: boolean;
    
    // Storage support
    supportsOPFS: boolean;
    isStorageInitialized: boolean;
    
    // Timeline communication
    timelineController: TimelineController;
    
    // Actions
    initializeStorage: () => Promise<void>;
    setVideo: (file: File | null, saveToStorage?: boolean) => Promise<void>;
    toggleTimeline: () => void;
    updateSegments: (segments: VideoSegment[]) => void;
    addSegment: (segment: VideoSegment) => void;
    updateSegment: (segmentId: string, updates: Partial<VideoSegment>) => void;
    removeSegment: (segmentId: string) => void;
    selectSegment: (segmentId: string | null) => void;
    clearVideo: () => void;
    tryRestoreVideo: () => Promise<boolean>;
    
    // Timeline controller methods
    setTimelineController: (controller: TimelineController) => void;
    playSegmentInTimeline: (segmentId: string) => void;
  }
  
  // Video Timeline Props
  export interface VideoTimelineProps {
    videoFile: File;
    segments: VideoSegment[];
    selectedSegmentId?: string;
    onSegmentsChange: (segments: VideoSegment[]) => void;
    onSegmentSelect?: (segmentId: string | null) => void;
  }