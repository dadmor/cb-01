import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { VideoSegment } from "@/types";
import { VideoStorageService } from "@/services/VideoStorageService";

interface VideoMetadata {
  fileName: string;
  fileSize: number;
  lastModified: number;
  mimeType: string;
  storageId?: string; // ID in OPFS storage
}

interface VideoStore {
  videoFile: File | null;
  videoUrl: string | null;
  videoMetadata: VideoMetadata | null;
  segments: VideoSegment[];
  selectedSegmentId: string | null;
  showTimeline: boolean;
  
  // Storage support
  supportsOPFS: boolean;
  isStorageInitialized: boolean;
  
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
}

const storage = VideoStorageService.getInstance();

export const useVideoStore = create<VideoStore>()(
  persist(
    (set, get) => ({
      videoFile: null,
      videoUrl: null,
      videoMetadata: null,
      segments: [],
      selectedSegmentId: null,
      showTimeline: false,
      supportsOPFS: false,
      isStorageInitialized: false,

      initializeStorage: async () => {
        const initialized = await storage.initialize();
        set({ 
          supportsOPFS: initialized,
          isStorageInitialized: initialized 
        });
      },

      setVideo: async (file, saveToStorage = true) => {
        const state = get();
        
        // Clean up old URL
        if (state.videoUrl) {
          URL.revokeObjectURL(state.videoUrl);
        }
        
        if (!file) {
          set({
            videoFile: null,
            videoUrl: null,
            videoMetadata: null,
            showTimeline: false,
            selectedSegmentId: null
          });
          return;
        }

        const metadata: VideoMetadata = {
          fileName: file.name,
          fileSize: file.size,
          lastModified: file.lastModified,
          mimeType: file.type,
          // Preserve existing storageId if we're not saving to storage
          storageId: saveToStorage ? undefined : state.videoMetadata?.storageId
        };

        // Try to save to OPFS if supported
        if (saveToStorage && state.supportsOPFS) {
          try {
            const storageId = await storage.storeVideo(file);
            metadata.storageId = storageId;
            console.log('Video saved to OPFS with ID:', storageId);
          } catch (error) {
            console.error('Failed to save video to OPFS:', error);
          }
        }
        
        set({
          videoFile: file,
          videoUrl: URL.createObjectURL(file),
          videoMetadata: metadata,
          showTimeline: true,
          selectedSegmentId: null
        });
      },

      tryRestoreVideo: async () => {
        const state = get();
        
        if (!state.videoMetadata?.storageId || !state.supportsOPFS) {
          return false;
        }

        try {
          const file = await storage.retrieveVideo(state.videoMetadata.storageId);
          if (file) {
            // Set video without re-saving to storage (it's already there!)
            await state.setVideo(file, false);
            console.log('Video restored from OPFS:', state.videoMetadata.storageId);
            return true;
          }
        } catch (error) {
          console.error('Failed to restore video from OPFS:', error);
        }
        
        return false;
      },

      toggleTimeline: () => set(state => ({ 
        showTimeline: !state.showTimeline 
      })),

      updateSegments: (segments) => set({ segments }),

      addSegment: (segment) => set(state => ({
        segments: [...state.segments, segment]
      })),

      updateSegment: (segmentId, updates) => set(state => ({
        segments: state.segments.map(seg => 
          seg.id === segmentId ? { ...seg, ...updates } : seg
        )
      })),

      removeSegment: (segmentId) => set(state => ({
        segments: state.segments.filter(seg => seg.id !== segmentId),
        selectedSegmentId: state.selectedSegmentId === segmentId ? null : state.selectedSegmentId
      })),

      selectSegment: (segmentId) => set({ selectedSegmentId: segmentId }),

      clearVideo: async () => {
        const state = get();
        
        if (state.videoUrl) {
          URL.revokeObjectURL(state.videoUrl);
        }
        
        // Delete from OPFS if stored
        if (state.videoMetadata?.storageId && state.supportsOPFS) {
          try {
            await storage.deleteVideo(state.videoMetadata.storageId);
          } catch (error) {
            console.error('Failed to delete video from OPFS:', error);
          }
        }
        
        set({
          videoFile: null,
          videoUrl: null,
          videoMetadata: null,
          segments: [],
          selectedSegmentId: null,
          showTimeline: false
        });
      }
    }),
    {
      name: 'video-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        videoMetadata: state.videoMetadata,
        segments: state.segments,
        selectedSegmentId: state.selectedSegmentId,
        showTimeline: state.showTimeline
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeStorage();
        }
      }
    }
  )
);

// Cleanup helper
export const cleanupVideo = () => {
  const state = useVideoStore.getState();
  if (state.videoUrl) {
    URL.revokeObjectURL(state.videoUrl);
  }
};