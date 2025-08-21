// src/services/VideoStorageService.ts
export interface StoredVideo {
    id: string;
    fileName: string;
    fileSize: number;
    lastModified: number;
    mimeType: string;
    thumbnails?: string[]; // Data URLs for keyframes
  }
  
  export class VideoStorageService {
    private static instance: VideoStorageService;
    private root: FileSystemDirectoryHandle | null = null;
    private videosDir: FileSystemDirectoryHandle | null = null;
    private metadataCache: Map<string, StoredVideo> = new Map();
  
    private constructor() {}
  
    static getInstance(): VideoStorageService {
      if (!VideoStorageService.instance) {
        VideoStorageService.instance = new VideoStorageService();
      }
      return VideoStorageService.instance;
    }
  
    async initialize(): Promise<boolean> {
      try {
        // Check if OPFS is supported
        if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
          console.warn('OPFS not supported');
          return false;
        }
  
        this.root = await navigator.storage.getDirectory();
        this.videosDir = await this.root.getDirectoryHandle('videos', { create: true });
        
        // Load metadata
        await this.loadMetadata();
        
        return true;
      } catch (error) {
        console.error('Failed to initialize OPFS:', error);
        return false;
      }
    }
  
    async storeVideo(file: File): Promise<string> {
      if (!this.videosDir) throw new Error('Storage not initialized');
  
      const videoId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        // Store the actual video file
        const fileHandle = await this.videosDir.getFileHandle(`${videoId}.mp4`, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();
  
        // Store metadata
        const metadata: StoredVideo = {
          id: videoId,
          fileName: file.name,
          fileSize: file.size,
          lastModified: file.lastModified,
          mimeType: file.type
        };
  
        await this.saveMetadata(videoId, metadata);
        this.metadataCache.set(videoId, metadata);
  
        // Generate thumbnails in background
        this.generateThumbnails(videoId, file).catch(console.error);
  
        return videoId;
      } catch (error) {
        console.error('Failed to store video:', error);
        throw error;
      }
    }
  
    async retrieveVideo(videoId: string): Promise<File | null> {
      if (!this.videosDir) throw new Error('Storage not initialized');
  
      try {
        const metadata = this.metadataCache.get(videoId);
        if (!metadata) {
          console.warn('No metadata found for video:', videoId);
          return null;
        }
  
        const fileHandle = await this.videosDir.getFileHandle(`${videoId}.mp4`);
        const file = await fileHandle.getFile();
        
        console.log('Retrieved video from OPFS:', videoId, 'size:', file.size);
        
        // Create a new File with the original name
        return new File([file], metadata.fileName, { type: metadata.mimeType });
      } catch (error) {
        console.error('Failed to retrieve video:', error);
        return null;
      }
    }
  
    async deleteVideo(videoId: string): Promise<void> {
      if (!this.videosDir) throw new Error('Storage not initialized');
  
      try {
        // Delete video file
        await this.videosDir.removeEntry(`${videoId}.mp4`);
        
        // Delete metadata
        await this.videosDir.removeEntry(`${videoId}.json`);
        
        // Delete thumbnails
        const thumbsDir = await this.videosDir.getDirectoryHandle('thumbnails', { create: false }).catch(() => null);
        if (thumbsDir) {
          const entries: string[] = [];
          for await (const entry of thumbsDir.keys()) {
            entries.push(entry);
          }
          for (const name of entries) {
            if (name.startsWith(videoId)) {
              await thumbsDir.removeEntry(name);
            }
          }
        }
  
        this.metadataCache.delete(videoId);
      } catch (error) {
        console.error('Failed to delete video:', error);
      }
    }
  
    async listVideos(): Promise<StoredVideo[]> {
      return Array.from(this.metadataCache.values());
    }
  
    async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
      if ('estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0
        };
      }
      return { usage: 0, quota: 0 };
    }
  
    private async generateThumbnails(videoId: string, file: File): Promise<void> {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
  
      video.src = URL.createObjectURL(file);
      video.muted = true;
  
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });
  
      const duration = video.duration;
      const keyframes = [0, duration * 0.25, duration * 0.5, duration * 0.75];
      const thumbnails: string[] = [];
  
      canvas.width = 320;
      canvas.height = 180;
  
      for (const time of keyframes) {
        video.currentTime = time;
        await new Promise(resolve => {
          video.onseeked = resolve;
        });
  
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        thumbnails.push(canvas.toDataURL('image/jpeg', 0.7));
      }
  
      URL.revokeObjectURL(video.src);
  
      // Update metadata with thumbnails
      const metadata = this.metadataCache.get(videoId);
      if (metadata) {
        metadata.thumbnails = thumbnails;
        await this.saveMetadata(videoId, metadata);
      }
    }
  
    private async saveMetadata(videoId: string, metadata: StoredVideo): Promise<void> {
      if (!this.videosDir) return;
  
      const metadataHandle = await this.videosDir.getFileHandle(`${videoId}.json`, { create: true });
      const writable = await metadataHandle.createWritable();
      await writable.write(JSON.stringify(metadata));
      await writable.close();
    }
  
    private async loadMetadata(): Promise<void> {
      if (!this.videosDir) return;
  
      try {
        for await (const entry of this.videosDir.values()) {
          if (entry.kind === 'file' && entry.name.endsWith('.json')) {
            const file = await entry.getFile();
            const text = await file.text();
            const metadata = JSON.parse(text) as StoredVideo;
            this.metadataCache.set(metadata.id, metadata);
          }
        }
      } catch (error) {
        console.error('Failed to load metadata:', error);
      }
    }
  }
  
  // Helper hook for React
  import { useEffect, useState } from 'react';
  
  export function useVideoStorage() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [videos, setVideos] = useState<StoredVideo[]>([]);
    const storage = VideoStorageService.getInstance();
  
    useEffect(() => {
      storage.initialize().then(success => {
        setIsInitialized(success);
        if (success) {
          storage.listVideos().then(setVideos);
        }
      });
    }, []);
  
    const storeVideo = async (file: File) => {
      const id = await storage.storeVideo(file);
      const updatedVideos = await storage.listVideos();
      setVideos(updatedVideos);
      return id;
    };
  
    const retrieveVideo = (videoId: string) => storage.retrieveVideo(videoId);
    
    const deleteVideo = async (videoId: string) => {
      await storage.deleteVideo(videoId);
      const updatedVideos = await storage.listVideos();
      setVideos(updatedVideos);
    };
  
    return {
      isInitialized,
      videos,
      storeVideo,
      retrieveVideo,
      deleteVideo,
      getStorageEstimate: () => storage.getStorageEstimate()
    };
  }