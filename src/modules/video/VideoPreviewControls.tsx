import React from 'react';
import { VideoSegment } from '@/types';

interface VideoPreviewControlsProps {
  segments: VideoSegment[];
  selectedSegmentId?: string;
  onSegmentSelect?: (segmentId: string) => void;
  onPlaySegment?: (segmentId: string) => void;
}

export const VideoPreviewControls: React.FC<VideoPreviewControlsProps> = ({
  segments,
  selectedSegmentId,
  onSegmentSelect,
  onPlaySegment
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-zinc-400">Quick Segment Access</h4>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {segments.map((segment, index) => (
          <div
            key={segment.id}
            onClick={() => onSegmentSelect?.(segment.id)}
            className={`
              p-2 rounded cursor-pointer transition-colors text-sm
              ${selectedSegmentId === segment.id 
                ? 'bg-blue-600/20 border border-blue-600/50 text-blue-300' 
                : 'bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-300'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Segment {index + 1}</span>
              {onPlaySegment && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlaySegment(segment.id);
                  }}
                  className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Play in Timeline
                </button>
              )}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              {formatTime(segment.start)} - {formatTime(segment.end)} ({Math.round(segment.duration)}s)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};