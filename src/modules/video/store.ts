import { create } from "zustand";
import { VideoSegment } from "@/types";

interface VideoStore {
  videoFile: File | null;
  videoUrl: string | null;
  segments: VideoSegment[];
  showTimeline: boolean;
  
  // Actions
  setVideo: (file: File | null) => void;
  toggleTimeline: () => void;
  updateSegments: (segments: VideoSegment[]) => void;
  clearVideo: () => void;
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  videoFile: null,
  videoUrl: null,
  segments: [],
  showTimeline: false,

  setVideo: (file) => {
    const state = get();
    // Clean up old URL
    if (state.videoUrl) {
      URL.revokeObjectURL(state.videoUrl);
    }
    
    set({
      videoFile: file,
      videoUrl: file ? URL.createObjectURL(file) : null,
      showTimeline: !!file
    });
  },

  toggleTimeline: () => set(state => ({ 
    showTimeline: !state.showTimeline 
  })),

  updateSegments: (segments) => set({ segments }),

  clearVideo: () => {
    const state = get();
    if (state.videoUrl) {
      URL.revokeObjectURL(state.videoUrl);
    }
    
    set({
      videoFile: null,
      videoUrl: null,
      segments: [],
      showTimeline: false
    });
  }
}));

// Cleanup helper
export const cleanupVideo = () => {
  const state = useVideoStore.getState();
  if (state.videoUrl) {
    URL.revokeObjectURL(state.videoUrl);
  }
};