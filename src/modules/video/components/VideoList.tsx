// src/modules/video/components/VideoList.tsx
import React, { useRef } from 'react';
import { Film, Upload, X, HardDrive } from 'lucide-react';
import { useVideoStorage } from '../services/VideoStorageService';
import { useVideoPlayerStore } from '../store/videoPlayerStore';

export const VideoList: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    isInitialized, 
    videos, 
    storeVideo, 
    retrieveVideo, 
    deleteVideo,
    getStorageEstimate 
  } = useVideoStorage();

  const {
    currentVideoId,
    setCurrentVideo,
    setIsLoading,
    clearCurrentVideo
  } = useVideoPlayerStore();

  const [storageInfo, setStorageInfo] = React.useState({ usage: 0, quota: 0 });
  const [uploadingCount, setUploadingCount] = React.useState(0);

  // Update storage info
  React.useEffect(() => {
    if (isInitialized) {
      getStorageEstimate().then(setStorageInfo);
    }
  }, [isInitialized, videos, getStorageEstimate]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    setUploadingCount(videoFiles.length);
    
    for (const file of videoFiles) {
      try {
        const id = await storeVideo(file);
        
        // Auto-select first video
        if (videos.length === 0 && !currentVideoId) {
          handleSelectVideo(id);
        }
      } catch (error) {
        console.error('Failed to store video:', error);
        alert(`Failed to store ${file.name}. Storage might be full.`);
      }
    }
    
    setUploadingCount(0);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectVideo = async (videoId: string) => {
    if (currentVideoId === videoId) return;
    
    setIsLoading(true);
    try {
      const file = await retrieveVideo(videoId);
      if (file) {
        setCurrentVideo(videoId, file);
      }
    } catch (error) {
      console.error('Failed to load video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (confirm('Delete this video from storage?')) {
      await deleteVideo(id);
      
      if (currentVideoId === id) {
        clearCurrentVideo();
        // Auto-select next video
        const remaining = videos.filter(v => v.id !== id);
        if (remaining.length > 0) {
          handleSelectVideo(remaining[0].id);
        }
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-80 bg-[#1e1e1e] border-r border-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="h-8 bg-[#252525] border-b border-[#0a0a0a] flex items-center justify-between px-3">
        <span className="text-xs text-[#999] font-medium">MEDIA POOL</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!isInitialized || uploadingCount > 0}
          className="text-xs text-[#999] hover:text-white transition-colors disabled:opacity-50"
        >
          {uploadingCount > 0 ? (
            <span className="text-[10px]">Uploading {uploadingCount}...</span>
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Storage indicator */}
      {isInitialized && (
        <div className="px-3 py-2 bg-[#1a1a1a] border-b border-[#0a0a0a]">
          <div className="flex items-center justify-between text-[10px] text-[#666] mb-1">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              Browser Storage
            </span>
            <span>{formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}</span>
          </div>
          <div className="h-1 bg-[#0a0a0a] rounded overflow-hidden">
            <div 
              className="h-full bg-[#E84E36] transition-all"
              style={{ width: `${(storageInfo.usage / storageInfo.quota) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Video list */}
      <div className="flex-1 overflow-y-auto p-2">
        {!isInitialized ? (
          <div className="text-center py-12">
            <div className="animate-pulse">
              <HardDrive className="w-12 h-12 mx-auto mb-4 text-[#444]" />
              <p className="text-[#666] text-xs">Initializing storage...</p>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <Film className="w-12 h-12 mx-auto mb-4 text-[#444]" />
            <p className="text-[#666] text-xs mb-4">No videos in storage</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingCount > 0}
              className="px-4 py-2 bg-[#2a2a2a] text-[#999] text-xs border border-[#3a3a3a] hover:bg-[#333] hover:text-white transition-colors disabled:opacity-50"
            >
              Import Videos
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {videos.map((video) => (
              <div
                key={video.id}
                onClick={() => handleSelectVideo(video.id)}
                className={`p-3 bg-[#1a1a1a] border-2 cursor-pointer transition-all ${
                  currentVideoId === video.id
                    ? 'border-[#E84E36]'
                    : 'border-transparent hover:border-[#3a3a3a]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Film className="w-4 h-4 text-[#666] flex-shrink-0" />
                      <p className="text-xs text-[#ccc] truncate">{video.fileName}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[#666]">
                      <span>{formatBytes(video.fileSize)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVideo(video.id);
                    }}
                    className="p-1 hover:bg-[#2a2a2a] transition-colors"
                  >
                    <X className="w-3 h-3 text-[#666] hover:text-red-500" />
                  </button>
                </div>
                
                {/* Thumbnails preview */}
                {video.thumbnails && video.thumbnails.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {video.thumbnails.slice(0, 4).map((thumb, idx) => (
                      <img 
                        key={idx} 
                        src={thumb} 
                        className="w-1/4 h-auto opacity-50"
                        alt=""
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-6 bg-[#1a1a1a] border-t border-[#0a0a0a] flex items-center px-3">
        <span className="text-[10px] text-[#666]">
          {videos.length} video{videos.length !== 1 ? 's' : ''} stored
        </span>
      </div>
    </div>
  );
};