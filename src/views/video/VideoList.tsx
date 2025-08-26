// src/views/video/VideoList.tsx
import React, { useRef } from 'react';
import { Film, Upload, HardDrive, X } from 'lucide-react';
import { useVideoPlayerStore, useVideoStorage } from '@/modules/video';
import { 
  Panel, 
  PanelHeader, 
  PanelContent, 
  PanelFooter,
  Button,
  Card
} from '@/components/ui';

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
        if (videos.length === 0 && !currentVideoId) {
          handleSelectVideo(id);
        }
      } catch (error) {
        console.error('Failed to store video:', error);
        alert(`Failed to store ${file.name}. Storage might be full.`);
      }
    }
    
    setUploadingCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectVideo = async (videoId: string) => {
    if (currentVideoId === videoId) return;
    setIsLoading(true);
    try {
      const file = await retrieveVideo(videoId);
      if (file) setCurrentVideo(videoId, file);
    } catch (error) {
      console.error('Failed to load video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Delete this video from storage?')) return;
    await deleteVideo(id);
    if (currentVideoId === id) {
      clearCurrentVideo();
      const remaining = videos.filter(v => v.id !== id);
      if (remaining.length > 0) handleSelectVideo(remaining[0].id);
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
    <Panel className="w-80 border-r border-zinc-800 flex flex-col">
      <PanelHeader 
        title="Media Pool" 
        actions={
          <Button
            variant="ghost"
            size="xs"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            disabled={!isInitialized || uploadingCount > 0}
          >
            {uploadingCount > 0 ? `Uploading ${uploadingCount}...` : 'Import'}
          </Button>
        }
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Storage indicator */}
      {isInitialized && (
        <div className="px-3 py-2 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-1 text-[10px]">
            <span className="flex items-center gap-1 text-zinc-600">
              <HardDrive className="w-3 h-3" />
              Browser Storage
            </span>
            <span className="text-zinc-600">
              {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
            </span>
          </div>
          <div className="h-1 bg-zinc-950 rounded overflow-hidden">
            <div 
              className="h-full bg-orange-600 transition-all"
              style={{ width: `${(storageInfo.usage / storageInfo.quota) * 100}%` }}
            />
          </div>
        </div>
      )}

      <PanelContent className="flex-1 overflow-y-auto">
        {!isInitialized ? (
          <div className="text-center py-12">
            <div className="animate-pulse">
              <HardDrive className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-600 text-xs">Initializing storage...</p>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <Film className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-600 text-xs mb-4">No videos in storage</p>
            <Button
              variant="default"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingCount > 0}
            >
              Import Videos
            </Button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {videos.map((video) => (
              <Card
                key={video.id}
                selected={currentVideoId === video.id}
                compact
                className="relative cursor-pointer"
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteVideo(video.id);
                  }}
                  className="absolute top-1 right-1 p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
                  title="Delete video"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Kliknięcie w treść = wybór wideo */}
                <div onClick={() => handleSelectVideo(video.id)}>
                  <div className="flex items-center gap-2 mb-1">
                    <Film className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                    <p className="text-xs text-zinc-300 truncate">{video.fileName}</p>
                  </div>

                  <div className="flex items-center gap-3 text-zinc-600 text-[10px]">
                    <span>{formatBytes(video.fileSize)}</span>
                  </div>
                  
                  {/* Miniaturki */}
                  {video.thumbnails && video.thumbnails.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {video.thumbnails.slice(0, 4).map((thumb, idx) => (
                        <div
                          key={idx}
                          className="w-1/4 aspect-video bg-zinc-900 overflow-hidden rounded"
                        >
                          <img
                            src={thumb}
                            alt=""
                            className="w-full h-full object-cover opacity-70"
                            draggable={false}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </PanelContent>

      <PanelFooter>
        <span className="text-[10px]">
          {videos.length} video{videos.length !== 1 ? 's' : ''} stored
        </span>
      </PanelFooter>
    </Panel>
  );
};
