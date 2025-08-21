import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { VideoSegment } from '@/types';
import { useVideoStore } from '@/modules/video/store';

// Memoized waveform component to prevent re-renders
const Waveform = memo(() => {
  const [waveformData] = useState(() => 
    Array.from({ length: 100 }, () => 20 + Math.random() * 60)
  );

  return (
    <div className="absolute inset-0 opacity-30 pointer-events-none">
      {waveformData.map((height, i) => (
        <div
          key={i}
          className="absolute bg-zinc-600"
          style={{
            left: `${i}%`,
            width: '0.8%',
            height: `${height}%`,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
      ))}
    </div>
  );
});

// Memoized segment component
const TimelineSegment = memo<{
  segment: VideoSegment;
  duration: number;
  isPlaying: boolean;
  isSelected: boolean;
}>(({ segment, duration, isPlaying, isSelected }) => {
  return (
    <div
      className={`absolute top-0 bottom-0 border-2 ${
        isPlaying ? 'bg-red-500/30 border-red-500' :
        isSelected ? 'bg-blue-500/30 border-blue-500' :
        'bg-blue-400/20 border-blue-400'
      }`}
      style={{
        left: `${(segment.start / duration) * 100}%`,
        width: `${((segment.end - segment.start) / duration) * 100}%`,
        minWidth: '10px'
      }}
    >
      {/* Resize handles */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 bg-transparent hover:bg-blue-400 cursor-ew-resize"
        style={{ marginLeft: '-2px' }}
      />
      <div 
        className="absolute right-0 top-0 bottom-0 w-1 bg-transparent hover:bg-blue-400 cursor-ew-resize"
        style={{ marginRight: '-2px' }}
      />
      {/* Label */}
      {segment.label && (
        <div className="absolute top-1 left-1 text-xs text-white truncate pointer-events-none">
          {segment.label}
        </div>
      )}
    </div>
  );
});

interface VideoTimelineProps {
  videoFile: File;
  segments: VideoSegment[];
  selectedSegmentId?: string;
  onSegmentsChange: (segments: VideoSegment[]) => void;
  onSegmentSelect?: (segmentId: string | null) => void;
}

export const VideoTimeline: React.FC<VideoTimelineProps> = ({
  videoFile,
  segments,
  selectedSegmentId,
  onSegmentsChange,
  onSegmentSelect
}) => {
  const setTimelineController = useVideoStore(state => state.setTimelineController);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);
  const [loopSegment, setLoopSegment] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isCreatingSegment, setIsCreatingSegment] = useState(false);
  const [newSegmentStart, setNewSegmentStart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [draggedSegmentId, setDraggedSegmentId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartSegment, setDragStartSegment] = useState<VideoSegment | null>(null);

  // Setup video URL
  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  // Play segment function
  const playSegment = useCallback((segmentId: string) => {
    const video = videoRef.current;
    if (!video) return;

    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    setPlayingSegmentId(segmentId);
    video.currentTime = segment.start;
    video.play();
  }, [segments]);

  const seekToTime = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  // Register controller
  useEffect(() => {
    setTimelineController({ playSegment, seekToTime });
    return () => setTimelineController({});
  }, [playSegment, seekToTime, setTimelineController]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      
      if (playingSegmentId) {
        const segment = segments.find(s => s.id === playingSegmentId);
        if (segment && time >= segment.end) {
          if (loopSegment) {
            video.currentTime = segment.start;
          } else {
            video.pause();
            setPlayingSegmentId(null);
          }
        }
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [playingSegmentId, segments, loopSegment]);

  // Timeline interaction
  const getTimeFromX = (x: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const relativeX = x - rect.left;
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
    return percentage * duration;
  };

  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const clickTime = getTimeFromX(e.clientX);
    
    // Check if clicking on a segment handle or body
    for (const segment of segments) {
      const startX = (segment.start / duration) * rect.width;
      const endX = (segment.end / duration) * rect.width;
      
      // Check resize handles (5px areas at edges)
      if (Math.abs(mouseX - startX) < 5) {
        setIsDragging(true);
        setDragType('resize-start');
        setDraggedSegmentId(segment.id);
        setDragStartX(e.clientX);
        setDragStartSegment({...segment});
        onSegmentSelect?.(segment.id);
        e.preventDefault();
        return;
      } else if (Math.abs(mouseX - endX) < 5) {
        setIsDragging(true);
        setDragType('resize-end');
        setDraggedSegmentId(segment.id);
        setDragStartX(e.clientX);
        setDragStartSegment({...segment});
        onSegmentSelect?.(segment.id);
        e.preventDefault();
        return;
      } else if (mouseX >= startX && mouseX <= endX) {
        // Clicking in middle - move segment
        setIsDragging(true);
        setDragType('move');
        setDraggedSegmentId(segment.id);
        setDragStartX(e.clientX);
        setDragStartSegment({...segment});
        onSegmentSelect?.(segment.id);
        e.preventDefault();
        return;
      }
    }
    
    // If not clicking on segment, start creating new one
    setIsCreatingSegment(true);
    setNewSegmentStart(clickTime);
    if (videoRef.current) {
      videoRef.current.currentTime = clickTime;
    }
  };

  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    if (isDragging && draggedSegmentId && dragStartSegment && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartX;
      const deltaTime = (deltaX / rect.width) * duration;
      
      const newSegments = segments.map(seg => {
        if (seg.id !== draggedSegmentId) return seg;
        
        let newStart = seg.start;
        let newEnd = seg.end;
        
        if (dragType === 'move') {
          newStart = Math.max(0, Math.min(duration - seg.duration, dragStartSegment.start + deltaTime));
          newEnd = newStart + seg.duration;
        } else if (dragType === 'resize-start') {
          newStart = Math.max(0, Math.min(seg.end - 0.1, dragStartSegment.start + deltaTime));
        } else if (dragType === 'resize-end') {
          newEnd = Math.min(duration, Math.max(seg.start + 0.1, dragStartSegment.end + deltaTime));
        }
        
        return {
          ...seg,
          start: newStart,
          end: newEnd,
          duration: newEnd - newStart
        };
      });
      
      onSegmentsChange(newSegments);
    } else if (isCreatingSegment) {
      const currentTime = getTimeFromX(e.clientX);
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
      }
    }
  };

  const handleTimelineMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      setIsDragging(false);
      setDragType(null);
      setDraggedSegmentId(null);
      setDragStartSegment(null);
    } else if (isCreatingSegment) {
      const endTime = getTimeFromX(e.clientX);
      const start = Math.min(newSegmentStart, endTime);
      const end = Math.max(newSegmentStart, endTime);
      
      if (end - start > 0.1) { // Minimum segment duration
        const newSegment: VideoSegment = {
          id: `segment-${Date.now()}`,
          start,
          end,
          duration: end - start
        };
        onSegmentsChange([...segments, newSegment]);
      }
      
      setIsCreatingSegment(false);
    }
  };

  // Global mouse events for dragging
  useEffect(() => {
    if (!isDragging) return;
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && draggedSegmentId && dragStartSegment && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const deltaX = e.clientX - dragStartX;
        const deltaTime = (deltaX / rect.width) * duration;
        
        const newSegments = segments.map(seg => {
          if (seg.id !== draggedSegmentId) return seg;
          
          let newStart = seg.start;
          let newEnd = seg.end;
          
          if (dragType === 'move') {
            newStart = Math.max(0, Math.min(duration - seg.duration, dragStartSegment.start + deltaTime));
            newEnd = newStart + seg.duration;
          } else if (dragType === 'resize-start') {
            newStart = Math.max(0, Math.min(seg.end - 0.1, dragStartSegment.start + deltaTime));
          } else if (dragType === 'resize-end') {
            newEnd = Math.min(duration, Math.max(seg.start + 0.1, dragStartSegment.end + deltaTime));
          }
          
          return {
            ...seg,
            start: newStart,
            end: newEnd,
            duration: newEnd - newStart
          };
        });
        
        onSegmentsChange(newSegments);
      }
    };
    
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      setDraggedSegmentId(null);
      setDragStartSegment(null);
    };
    
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, draggedSegmentId, dragStartSegment, dragStartX, dragType, duration, segments, onSegmentsChange]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getCursorStyle = (e: React.MouseEvent): string => {
    if (!timelineRef.current || isDragging) return isDragging ? 'grabbing' : 'default';
    
    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Check if hovering over segment edges
    for (const segment of segments) {
      const startX = (segment.start / duration) * rect.width;
      const endX = (segment.end / duration) * rect.width;
      
      if (Math.abs(mouseX - startX) < 5 || Math.abs(mouseX - endX) < 5) {
        return 'ew-resize';
      } else if (mouseX >= startX && mouseX <= endX) {
        return 'grab';
      }
    }
    
    return 'crosshair'; // Default for creating new segments
  };

  const deleteSelectedSegment = () => {
    if (selectedSegmentId) {
      const newSegments = segments.filter(seg => seg.id !== selectedSegmentId);
      onSegmentsChange(newSegments);
      onSegmentSelect?.(null);
    }
  };

  return (
    <div className="h-full flex bg-zinc-900">
      {/* Video preview */}
      <div className="w-80 bg-black flex flex-col flex-shrink-0">
        <div className="flex-1 relative">
          <video 
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
          />
          {playingSegmentId && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                Playing Segment
              </div>
              <button
                onClick={() => setLoopSegment(!loopSegment)}
                className={`p-1.5 rounded ${
                  loopSegment ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-300'
                }`}
                title={loopSegment ? "Disable loop" : "Enable loop"}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* Video controls */}
        <div className="p-3 bg-zinc-850 border-t border-zinc-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => videoRef.current && (videoRef.current.currentTime -= 5)}
                className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded"
                title="Skip backward 5s"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.445 14.832A1 1 0 0010 14v-8a1 1 0 00-1.555-.832L5 8.101V6a1 1 0 00-2 0v8a1 1 0 002 0v-2.101l3.445 2.933z"/>
                </svg>
              </button>
              
              <button
                onClick={() => {
                  if (videoRef.current) {
                    if (videoRef.current.paused) {
                      videoRef.current.play();
                    } else {
                      videoRef.current.pause();
                      setPlayingSegmentId(null);
                    }
                  }
                }}
                className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                  </svg>
                )}
              </button>
              
              <button
                onClick={() => videoRef.current && (videoRef.current.currentTime += 5)}
                className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded"
                title="Skip forward 5s"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L8 11.899V14a1 1 0 002 0V6a1 1 0 00-2 0v2.101L4.555 5.168zM15 6v8a1 1 0 01-2 0V6a1 1 0 012 0z"/>
                </svg>
              </button>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          {/* Volume control */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"/>
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                const vol = parseInt(e.target.value);
                setVolume(vol);
                if (videoRef.current) {
                  videoRef.current.volume = vol / 100;
                }
              }}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Timeline area */}
      <div className="flex-1 flex flex-col bg-zinc-850">
        {/* Timeline toolbar */}
        <div className="h-10 bg-zinc-800 border-b border-zinc-700 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400">
              Click and drag on timeline to create segment
            </span>
            {selectedSegmentId && (
              <button
                onClick={deleteSelectedSegment}
                className="text-xs text-red-400 hover:text-red-300 hover:bg-zinc-700 px-2 py-1 rounded"
              >
                Delete Selected
              </button>
            )}
          </div>
        </div>

        {/* Waveform/Timeline */}
        <div className="flex-1 relative overflow-hidden p-4">
          <div 
            ref={timelineRef}
            className="relative h-16 bg-zinc-800 rounded"
            style={{ cursor: isDragging ? 'grabbing' : 'default' }}
            onMouseDown={handleTimelineMouseDown}
            onMouseMove={(e) => {
              e.currentTarget.style.cursor = getCursorStyle(e);
              handleTimelineMouseMove(e);
            }}
            onMouseUp={handleTimelineMouseUp}
            onMouseLeave={() => setIsCreatingSegment(false)}
          >
            {/* Memoized waveform background */}
            <Waveform />
            
            {/* Progress */}
            <div
              className="absolute top-0 bottom-0 bg-blue-600/20"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            
            {/* Segments */}
            {segments.map(segment => (
              <TimelineSegment
                key={segment.id}
                segment={segment}
                duration={duration}
                isPlaying={segment.id === playingSegmentId}
                isSelected={segment.id === selectedSegmentId}
              />
            ))}
            
            {/* Current segment being created */}
            {isCreatingSegment && (
              <div
                className="absolute top-0 bottom-0 bg-green-500/30 border-2 border-green-500"
                style={{
                  left: `${(Math.min(newSegmentStart, currentTime) / duration) * 100}%`,
                  width: `${(Math.abs(currentTime - newSegmentStart) / duration) * 100}%`
                }}
              />
            )}
            
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>

        {/* Status bar */}
        <div className="h-6 bg-zinc-800 border-t border-zinc-700 px-4 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-zinc-400">
            {segments.length} segments • {videoFile.name}
          </span>
          <span className="text-xs text-zinc-400">
            {duration > 0 ? 'Ready' : 'Loading...'}
          </span>
        </div>
      </div>
    </div>
  );
};