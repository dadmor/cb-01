import React, { useState } from 'react';
import { useVideoStore } from '@/modules/video/store';

interface VideoReloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoSelected: () => void;
}

export const VideoReloadModal: React.FC<VideoReloadModalProps> = ({ 
  isOpen, 
  onClose,
  onVideoSelected 
}) => {
  const videoMetadata = useVideoStore(state => state.videoMetadata);
  const tryRestoreVideo = useVideoStore(state => state.tryRestoreVideo);
  const supportsOPFS = useVideoStore(state => state.supportsOPFS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !videoMetadata) return null;

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await tryRestoreVideo();
      
      if (success) {
        onVideoSelected();
        onClose();
      } else {
        setError('Failed to load video from browser storage. The file may have been cleared.');
      }
    } catch (err) {
      setError('An error occurred while loading the video.');
      console.error('Video restore error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasStoredVideo = videoMetadata.storageId && supportsOPFS;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">
          {hasStoredVideo ? 'Synchronize Video' : 'Video Required'}
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-3">
            {hasStoredVideo ? 
              "Your project video is stored in browser memory. Click synchronize to load it." :
              "This project requires a video file that couldn't be found in browser storage."
            }
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="font-medium text-sm">{videoMetadata.fileName}</p>
            <p className="text-xs text-gray-500">
              Size: {formatBytes(videoMetadata.fileSize)}
            </p>
          </div>

          {hasStoredVideo && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Video found in browser storage
              </p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          {hasStoredVideo ? (
            <button
              onClick={handleSync}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Loading...
                </>
              ) : (
                'Synchronize Video'
              )}
            </button>
          ) : (
            <p className="text-red-600 text-sm">
              Video not found in browser storage. Please reload the project with the video file.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};