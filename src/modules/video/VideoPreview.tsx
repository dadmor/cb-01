import React, { useRef, useState, useEffect } from 'react';
import { VideoSegment } from '@/types';

interface VideoPreviewProps {
  videoUrl: string;
  segments: VideoSegment[];
  selectedSegmentId?: string;
  onSegmentSelect?: (segmentId: string) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  segments,
  selectedSegmentId,
  onSegmentSelect
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState<VideoSegment | null>(null);
  
  useEffect(() => {
    const segment = segments.find(s => s.id === selectedSegmentId);
    setCurrentSegment(segment || null);
    
    if (videoRef.current && segment) {
      videoRef.current.currentTime = segment.start;
    }
  }, [selectedSegmentId, segments]);

  const playSegment = (segment: VideoSegment) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = segment.start;
    videoRef.current.play();
    setIsPlaying(true);
    
    // Auto-pause at segment end
    const checkTime = setInterval(() => {
      if (videoRef.current && videoRef.current.currentTime >= segment.end) {
        videoRef.current.pause();
        setIsPlaying(false);
        clearInterval(checkTime);
      }
    }, 100);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      {/* Video player */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-48 object-contain"
          controls={false}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Overlay controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex items-center justify-between text-white">
            <button
              onClick={() => {
                if (videoRef.current) {
                  if (isPlaying) {
                    videoRef.current.pause();
                  } else {
                    videoRef.current.play();
                  }
                }
              }}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            {currentSegment && (
              <span className="text-xs">
                {formatTime(currentSegment.start)} - {formatTime(currentSegment.end)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Segments list */}
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {segments.map((segment, index) => (
          <div
            key={segment.id}
            onClick={() => {
              onSegmentSelect?.(segment.id);
              playSegment(segment);
            }}
            className={`
              p-2 rounded cursor-pointer transition-colors text-sm
              ${selectedSegmentId === segment.id 
                ? 'bg-blue-100 border border-blue-300' 
                : 'bg-zinc-50 border border-zinc-200 hover:border-zinc-300'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Segment {index + 1}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playSegment(segment);
                }}
                className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Play
              </button>
            </div>
            <div className="text-xs text-zinc-600 mt-0.5">
              {formatTime(segment.start)} - {formatTime(segment.end)} ({Math.round(segment.duration)}s)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};