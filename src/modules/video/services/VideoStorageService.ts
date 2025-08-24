// ============================================
// src/modules/video/services/VideoStorageService.ts
// ============================================
export interface StoredVideo {
  id: string;
  fileName: string;        // oryginalna nazwa
  fileSize: number;
  lastModified: number;
  mimeType: string;
  storedFileName: string;  // faktyczna nazwa w OPFS (z poprawnym rozszerzeniem)
  thumbnails?: string[];   // Data URLs for keyframes
}

type Subscriber = () => void;

export class VideoStorageService {
  private static instance: VideoStorageService;
  private root: FileSystemDirectoryHandle | null = null;
  private videosDir: FileSystemDirectoryHandle | null = null;
  private metadataCache: Map<string, StoredVideo> = new Map();
  private subscribers: Set<Subscriber> = new Set();

  private constructor() {}

  static getInstance(): VideoStorageService {
    if (!VideoStorageService.instance) {
      VideoStorageService.instance = new VideoStorageService();
    }
    return VideoStorageService.instance;
  }

  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }
  private notify() {
    this.subscribers.forEach(cb => {
      try { cb(); } catch {}
    });
  }

  async initialize(): Promise<boolean> {
    try {
      if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
        console.warn('OPFS not supported');
        return false;
      }

      this.root = await navigator.storage.getDirectory();
      this.videosDir = await this.root.getDirectoryHandle('videos', { create: true });
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
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'bin';
    const storedFileName = `${videoId}.${ext}`;
    
    try {
      const fileHandle = await this.videosDir.getFileHandle(storedFileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();

      const metadata: StoredVideo = {
        id: videoId,
        fileName: file.name,
        fileSize: file.size,
        lastModified: file.lastModified,
        mimeType: file.type,
        storedFileName
      };

      await this.saveMetadata(videoId, metadata);
      this.metadataCache.set(videoId, metadata);

      // thumbnails w tle
      this.generateThumbnails(videoId, file).catch(console.error);

      this.notify();
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

      const fileHandle = await this.videosDir.getFileHandle(metadata.storedFileName);
      const file = await fileHandle.getFile();
      return new File([file], metadata.fileName, { type: metadata.mimeType });
    } catch (error) {
      console.error('Failed to retrieve video:', error);
      return null;
    }
  }

  async deleteVideo(videoId: string): Promise<void> {
    if (!this.videosDir) throw new Error('Storage not initialized');

    try {
      const metadata = this.metadataCache.get(videoId);
      const storedFileName = metadata?.storedFileName ?? `${videoId}.mp4`; // wsteczna zgodność

      // usuń plik wideo
      await this.videosDir.removeEntry(storedFileName).catch(() => {});
      // usuń metadata
      await this.videosDir.removeEntry(`${videoId}.json`).catch(() => {});
      // usuń miniatury
      const thumbsDir = await this.videosDir.getDirectoryHandle('thumbnails', { create: false }).catch(() => null);
      if (thumbsDir) {
        for await (const [name] of (thumbsDir as any).entries()) {
          if (typeof name === 'string' && name.startsWith(videoId)) {
            await thumbsDir.removeEntry(name).catch(() => {});
          }
        }
      }

      this.metadataCache.delete(videoId);
      this.notify();
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
    video.playsInline = true;

    await new Promise<void>(resolve => {
      video.onloadedmetadata = () => resolve();
    });

    const duration = Math.max(0, video.duration || 0);
    const keyframes = duration > 0
      ? [0, duration * 0.25, duration * 0.5, duration * 0.75]
      : [0];

    const thumbnails: string[] = [];

    canvas.width = 320;
    canvas.height = 180;

    for (const time of keyframes) {
      await new Promise<void>((resolve) => {
        video.currentTime = time;
        video.onseeked = () => resolve();
      });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      thumbnails.push(canvas.toDataURL('image/jpeg', 0.7));
    }

    URL.revokeObjectURL(video.src);

    const metadata = this.metadataCache.get(videoId);
    if (metadata) {
      metadata.thumbnails = thumbnails;
      await this.saveMetadata(videoId, metadata);
      this.metadataCache.set(videoId, metadata);
      this.notify();
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
      // TS lib.dom nie zawsze ma .values()/.keys(); .entries() jest wspierane
      for await (const [name, handle] of (this.videosDir as any).entries()) {
        const fileHandle = handle as FileSystemFileHandle;
        if ((fileHandle as any).kind === 'file' && typeof name === 'string' && name.endsWith('.json')) {
          const file = await fileHandle.getFile();
          const text = await file.text();
          const parsed = JSON.parse(text) as Partial<StoredVideo>;
          const storedFileName = parsed.storedFileName ?? `${parsed.id}.mp4`;
          const metadata: StoredVideo = {
            id: parsed.id!,
            fileName: parsed.fileName!,
            fileSize: parsed.fileSize!,
            lastModified: parsed.lastModified!,
            mimeType: parsed.mimeType!,
            storedFileName,
            thumbnails: parsed.thumbnails ?? []
          };
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
    let unsubscribe: (() => void) | null = null;

    storage.initialize().then(async (success) => {
      setIsInitialized(success);
      if (success) {
        setVideos(await storage.listVideos());
        unsubscribe = storage.subscribe(async () => {
          setVideos(await storage.listVideos());
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const storeVideo = async (file: File) => {
    const id = await storage.storeVideo(file);
    setVideos(await storage.listVideos());
    return id;
  };

  const retrieveVideo = (videoId: string) => storage.retrieveVideo(videoId);
  const deleteVideo = async (videoId: string) => {
    await storage.deleteVideo(videoId);
    setVideos(await storage.listVideos());
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
