// src/videoStore.ts
import { create } from "zustand";

export interface VideoSegment {
  id: string;
  start: number;
  end: number;
  duration: number;
  color?: string;
  index: number;
}

interface VideoState {
  // Video file
  videoFile: File | null;
  videoUrl: string | null;
  
  // Timeline visibility
  showTimeline: boolean;
  
  // Video segments
  segments: VideoSegment[];
  
  // Selected segment for preview
  selectedSegmentId: string | null;
}

interface VideoActions {
  // Video file management
  setVideoFile: (file: File | null) => void;
  
  // Timeline visibility
  setShowTimeline: (show: boolean) => void;
  toggleTimeline: () => void;
  
  // Segments management
  setSegments: (segments: VideoSegment[]) => void;
  addSegment: (segment: VideoSegment) => void;
  removeSegment: (id: string) => void;
  clearSegments: () => void;
  
  // Selected segment
  selectSegment: (id: string | null) => void;
  
  // Reset everything
  resetVideo: () => void;
}

type VideoStore = VideoState & VideoActions;

const initialState: VideoState = {
  videoFile: null,
  videoUrl: null,
  showTimeline: false,
  segments: [],
  selectedSegmentId: null,
};

export const useVideoStore = create<VideoStore>((set, get) => ({
  ...initialState,

  setVideoFile: (file) => {
    const currentState = get();
    // Clean up old URL
    if (currentState.videoUrl) {
      URL.revokeObjectURL(currentState.videoUrl);
    }
    
    set({
      videoFile: file,
      videoUrl: file ? URL.createObjectURL(file) : null,
      showTimeline: !!file, // Show timeline when video is loaded
    });
  },

  setShowTimeline: (show) => set({ showTimeline: show }),

  toggleTimeline: () => set((state) => ({ showTimeline: !state.showTimeline })),

  setSegments: (segments) => set({ segments }),

  addSegment: (segment) => 
    set((state) => ({ segments: [...state.segments, segment] })),

  removeSegment: (id) =>
    set((state) => ({
      segments: state.segments.filter((s) => s.id !== id),
      selectedSegmentId: state.selectedSegmentId === id ? null : state.selectedSegmentId,
    })),

  clearSegments: () => set({ segments: [], selectedSegmentId: null }),

  selectSegment: (id) => set({ selectedSegmentId: id }),

  resetVideo: () => {
    const currentState = get();
    // Clean up URL
    if (currentState.videoUrl) {
      URL.revokeObjectURL(currentState.videoUrl);
    }
    
    set(initialState);
  },
}));

// Cleanup function for component unmount
export const cleanupVideoStore = () => {
  const state = useVideoStore.getState();
  if (state.videoUrl) {
    URL.revokeObjectURL(state.videoUrl);
  }
};