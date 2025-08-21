import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { VideoSegment } from '@/types';
import { useVideoStore } from '@/modules/video/store';

// Memoized waveform component
const Waveform = memo(() => {
  const [waveformData] = useState(() => 
    Array.from({ length: 100 }, () => 20 + Math.random() * 60)
  );

  return (
    <div className="absolute inset-0 opacity-30 pointer-events-none">
      {waveformData.map((height, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${i}%`,
            width: '0.8%',
            height: `${height}%`,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#3a3a3a'
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
      className="absolute top-0 bottom-0"
      style={{
        left: `${(segment.start / duration) * 100}%`,
        width: `${((segment.end - segment.start) / duration) * 100}%`,
        minWidth: '10px',
        backgroundColor: isPlaying ? '#E84E3680' : isSelected ? '#E84E3640' : '#2d374260',
        border: `2px solid ${isPlaying ? '#E84E36' : isSelected ? '#E84E36' : '#3a4753'}`,
        transition: 'all 0.15s ease'
      }}
    >
      {/* Resize handles */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize"
        style={{ 
          marginLeft: '-2px',
          backgroundColor: 'transparent',
          '&:hover': { backgroundColor: '#E84E36' }
        }}
      />
      <div 
        className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize"
        style={{ 
          marginRight: '-2px',
          backgroundColor: 'transparent',
          '&:hover': { backgroundColor: '#E84E36' }
        }}
      />
      {/* Label */}
      {segment.label && (
        <div style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          fontSize: '11px',
          color: '#ccc',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 'calc(100% - 8px)',
          pointerEvents: 'none'
        }}>
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
  const [volume, setVolume] = useState(50);
  const [isCreatingSegment, setIsCreatingSegment] = useState(false);
  const [newSegmentStart, setNewSegmentStart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [draggedSegmentId, setDraggedSegmentId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartSegment, setDragStartSegment] = useState<VideoSegment | null>(null);

  // DaVinci styles
  const davinciColors = {
    bg: '#1a1a1a',
    bgDark: '#0f0f0f',
    bgLight: '#252525',
    border: '#0a0a0a',
    borderLight: '#2a2a2a',
    text: '#ccc',
    textDim: '#666',
    accent: '#E84E36',
    trackBg: '#0f0f0f',
    rulerBg: '#1a1a1a'
  };

  const davinciButtonStyle = {
    backgroundColor: '#2a2a2a',
    border: '1px solid #3a3a3a',
    color: '#999',
    fontSize: '11px',
    fontWeight: 500,
    padding: '4px 8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  };

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

  const formatTimecode = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30); // Assuming 30fps
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
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
    <div className="h-full flex" style={{ backgroundColor: davinciColors.bg }}>
      {/* Left side - Timeline tracks */}
      <div className="flex-1 flex flex-col">
        {/* Timeline ruler */}
        <div style={{ 
          height: '32px',
          backgroundColor: davinciColors.rulerBg,
          borderBottom: `1px solid ${davinciColors.border}`,
          position: 'relative'
        }}>
          {/* Time markers */}
          {duration > 0 && Array.from({ length: Math.floor(duration) + 1 }, (_, i) => i).map(second => (
            <div
              key={second}
              style={{
                position: 'absolute',
                left: `${(second / duration) * 100}%`,
                top: 0,
                height: '100%',
                borderLeft: `1px solid ${davinciColors.borderLight}`,
                fontSize: '10px',
                color: davinciColors.textDim,
                paddingLeft: '4px',
                paddingTop: '2px'
              }}
            >
              {second % 5 === 0 && formatTime(second)}
            </div>
          ))}
        </div>

        {/* Timeline track area */}
        <div className="flex-1 relative" style={{ backgroundColor: davinciColors.trackBg }}>
          {/* Track labels */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '80px',
            height: '100%',
            backgroundColor: davinciColors.bgLight,
            borderRight: `1px solid ${davinciColors.border}`,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '8px',
              fontSize: '11px',
              color: davinciColors.textDim,
              borderBottom: `1px solid ${davinciColors.border}`
            }}>
              V1
            </div>
          </div>

          {/* Timeline content */}
          <div style={{ 
            marginLeft: '80px',
            height: '100%',
            position: 'relative',
            padding: '8px 0'
          }}>
            <div 
              ref={timelineRef}
              className="relative"
              style={{ 
                height: '60px',
                backgroundColor: davinciColors.bgDark,
                border: `1px solid ${davinciColors.borderLight}`,
                cursor: isDragging ? 'grabbing' : 'default'
              }}
              onMouseDown={handleTimelineMouseDown}
              onMouseMove={(e) => {
                e.currentTarget.style.cursor = getCursorStyle(e);
                handleTimelineMouseMove(e);
              }}
              onMouseUp={handleTimelineMouseUp}
              onMouseLeave={() => setIsCreatingSegment(false)}
            >
              {/* Waveform background */}
              <Waveform />
              
              {/* Progress */}
              <div
                className="absolute top-0 bottom-0"
                style={{ 
                  width: `${(currentTime / duration) * 100}%`,
                  backgroundColor: 'rgba(232, 78, 54, 0.1)'
                }}
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
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `${(Math.min(newSegmentStart, currentTime) / duration) * 100}%`,
                    width: `${(Math.abs(currentTime - newSegmentStart) / duration) * 100}%`,
                    backgroundColor: 'rgba(74, 222, 128, 0.3)',
                    border: '2px solid #4ade80'
                  }}
                />
              )}
              
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{ 
                  left: `${(currentTime / duration) * 100}%`,
                  width: '2px',
                  backgroundColor: davinciColors.accent,
                  boxShadow: '0 0 4px rgba(232, 78, 54, 0.5)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Transport controls */}
        <div style={{
          height: '48px',
          backgroundColor: davinciColors.bgLight,
          borderTop: `1px solid ${davinciColors.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: '8px'
        }}>
          <button
            onClick={() => videoRef.current && (videoRef.current.currentTime = 0)}
            style={{ ...davinciButtonStyle, padding: '6px' }}
            title="Go to start"
          >
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>
            </svg>
          </button>
          
          <button
            onClick={() => videoRef.current && (videoRef.current.currentTime -= 1)}
            style={{ ...davinciButtonStyle, padding: '6px' }}
            title="Previous frame"
          >
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
              <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
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
            style={{
              ...davinciButtonStyle,
              backgroundColor: davinciColors.accent,
              borderColor: davinciColors.accent,
              color: 'white',
              padding: '6px 12px'
            }}
          >
            {isPlaying ? (
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"/>
              </svg>
            ) : (
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
              </svg>
            )}
          </button>
          
          <button
            onClick={() => videoRef.current && (videoRef.current.currentTime += 1)}
            style={{ ...davinciButtonStyle, padding: '6px' }}
            title="Next frame"
          >
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/>
            </svg>
          </button>
          
          <button
            onClick={() => videoRef.current && (videoRef.current.currentTime = duration)}
            style={{ ...davinciButtonStyle, padding: '6px' }}
            title="Go to end"
          >
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z"/>
            </svg>
          </button>

          <div style={{ width: '1px', height: '20px', backgroundColor: davinciColors.borderLight, margin: '0 8px' }} />

          {/* Loop button */}
          <button
            onClick={() => setLoopSegment(!loopSegment)}
            style={{
              ...davinciButtonStyle,
              backgroundColor: loopSegment ? davinciColors.accent : '#2a2a2a',
              borderColor: loopSegment ? davinciColors.accent : '#3a3a3a',
              color: loopSegment ? 'white' : '#999'
            }}
            title={loopSegment ? "Disable loop" : "Enable loop"}
          >
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
            </svg>
          </button>

          {selectedSegmentId && (
            <>
              <div style={{ width: '1px', height: '20px', backgroundColor: davinciColors.borderLight, margin: '0 8px' }} />
              <button
                onClick={deleteSelectedSegment}
                style={{
                  ...davinciButtonStyle,
                  color: '#ef4444'
                }}
              >
                Delete Region
              </button>
            </>
          )}

          {/* Timecode display */}
          <div className="flex-1" />
          <div style={{
            fontFamily: 'monospace',
            fontSize: '14px',
            color: davinciColors.text,
            backgroundColor: davinciColors.bgDark,
            padding: '4px 8px',
            border: `1px solid ${davinciColors.borderLight}`
          }}>
            {formatTimecode(currentTime)}
          </div>
        </div>
      </div>

      {/* Right side - Video preview (matching inspector width) */}
      <div style={{ 
        width: '350px',
        backgroundColor: davinciColors.bgDark,
        borderLeft: `1px solid ${davinciColors.border}`,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Preview header */}
        <div style={{
          height: '32px',
          backgroundColor: davinciColors.bgLight,
          borderBottom: `1px solid ${davinciColors.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px'
        }}>
          <span style={{ fontSize: '11px', color: davinciColors.textDim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            SOURCE VIEWER
          </span>
        </div>

        {/* Video preview */}
        <div className="flex-1 relative bg-black">
          <video 
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
          />
          {playingSegmentId && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: davinciColors.accent,
              color: 'white',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 500
            }}>
              PLAYING SEGMENT
            </div>
          )}
        </div>
        
        {/* Video info */}
        <div style={{
          padding: '12px',
          backgroundColor: davinciColors.bgLight,
          borderTop: `1px solid ${davinciColors.border}`
        }}>
          <div style={{ fontSize: '11px', color: davinciColors.textDim, marginBottom: '8px' }}>
            {videoFile.name}
          </div>
          
          {/* Volume control */}
          <div className="flex items-center gap-2">
            <svg width="14" height="14" fill={davinciColors.textDim} viewBox="0 0 20 20">
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
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: davinciColors.borderLight,
                outline: 'none',
                WebkitAppearance: 'none'
              }}
            />
            <span style={{ fontSize: '11px', color: davinciColors.textDim, width: '30px', textAlign: 'right' }}>
              {volume}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};