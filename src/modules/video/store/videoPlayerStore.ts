// src/modules/video/store/videoPlayerStore.ts
import { create } from 'zustand';

interface VideoPlayerState {
  // Current video state
  currentVideoId: string | null;
  currentVideoFile: File | null;
  currentVideoUrl: string | null;
  
  // Player state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  
  // Actions
  setCurrentVideo: (id: string | null, file: File | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setIsLoading: (loading: boolean) => void;
  clearCurrentVideo: () => void;
}

export const useVideoPlayerStore = create<VideoPlayerState>((set, get) => ({
  // Initial state
  currentVideoId: null,
  currentVideoFile: null,
  currentVideoUrl: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 50,
  isLoading: false,
  
  // Actions
  setCurrentVideo: (id, file) => {
    const state = get();
    
    // Cleanup old URL
    if (state.currentVideoUrl) {
      URL.revokeObjectURL(state.currentVideoUrl);
    }
    
    if (!file) {
      set({
        currentVideoId: null,
        currentVideoFile: null,
        currentVideoUrl: null,
        currentTime: 0,
        duration: 0,
        isPlaying: false
      });
      return;
    }
    
    const url = URL.createObjectURL(file);
    set({
      currentVideoId: id,
      currentVideoFile: file,
      currentVideoUrl: url,
      currentTime: 0,
      isPlaying: false
    });
  },
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  clearCurrentVideo: () => {
    const state = get();
    if (state.currentVideoUrl) {
      URL.revokeObjectURL(state.currentVideoUrl);
    }
    set({
      currentVideoId: null,
      currentVideoFile: null,
      currentVideoUrl: null,
      currentTime: 0,
      duration: 0,
      isPlaying: false
    });
  }
}));