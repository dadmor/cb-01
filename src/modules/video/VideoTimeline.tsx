import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
// @ts-ignore - WaveSurfer regions plugin doesn't have types
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import { VideoSegment } from '@/types';

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
  const waveformRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const isInternalUpdateRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!videoFile || !waveformRef.current || !videoRef.current) return;

    const videoUrl = URL.createObjectURL(videoFile);
    videoRef.current.src = videoUrl;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#3b82f6',
      progressColor: '#1e40af',
      height: 80,
      normalize: true,
      backend: 'MediaElement',
      mediaControls: false,
      plugins: [
        RegionsPlugin.create({
          dragSelection: { slop: 5 },
          color: 'rgba(59, 130, 246, 0.3)'
        })
      ]
    });

    ws.load(videoRef.current);
    wavesurferRef.current = ws;

    // Event handlers
    ws.on('ready', () => {
      setIsReady(true);
      setDuration(ws.getDuration());
      
      // Flag to prevent update loops during initialization
      isInternalUpdateRef.current = true;
      
      // Restore existing segments
      segments.forEach(segment => {
        ws.regions.add({
          id: segment.id,
          start: segment.start,
          end: segment.end,
          drag: true,
          resize: true,
          color: segment.id === selectedSegmentId ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)'
        });
      });
      
      // Reset flag after segments are loaded
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 100);
    });

    ws.on('audioprocess', (time: number) => {
      setCurrentTime(time);
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    // Region handlers
    const updateSegments = () => {
      if (isInternalUpdateRef.current) return;
      
      const regions = ws.regions.list;
      const newSegments: VideoSegment[] = Object.values(regions).map((region: any) => ({
        id: region.id,
        start: region.start,
        end: region.end,
        duration: region.end - region.start
      }));
      onSegmentsChange(newSegments);
    };

    ws.on('region-created', (region: any) => {
      if (!isInternalUpdateRef.current) {
        updateSegments();
      }
    });
    
    ws.on('region-updated', (region: any) => {
      if (!isInternalUpdateRef.current) {
        updateSegments();
      }
    });
    
    ws.on('region-removed', (region: any) => {
      if (!isInternalUpdateRef.current) {
        updateSegments();
      }
    });
    
    // Handle region clicks
    ws.on('region-click', (region: any) => {
      onSegmentSelect?.(region.id);
    });
    
    // Handle background click to deselect
    ws.on('click', (e: number) => {
      // If click was not on a region, deselect
      const clickedRegion = Object.values(ws.regions.list).find((r: any) => 
        e >= r.start && e <= r.end
      );
      if (!clickedRegion) {
        onSegmentSelect?.(null);
      }
    });

    return () => {
      ws.destroy();
      URL.revokeObjectURL(videoUrl);
    };
  }, [videoFile]); // Only reinitialize when video file changes

  // Update selected segment highlighting
  useEffect(() => {
    if (!wavesurferRef.current || !isReady) return;
    
    const regions = wavesurferRef.current.regions.list;
    Object.values(regions).forEach((region: any) => {
      region.update({
        color: region.id === selectedSegmentId ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)'
      });
    });
  }, [selectedSegmentId, isReady]);

  // Sync external segment changes with regions
  useEffect(() => {
    if (!wavesurferRef.current || !isReady) return;
    
    const ws = wavesurferRef.current;
    const existingRegions = ws.regions.list;
    const existingIds = Object.keys(existingRegions);
    const newIds = segments.map(s => s.id);
    
    // Mark as internal update to prevent loops
    isInternalUpdateRef.current = true;
    
    // Remove regions that no longer exist
    existingIds.forEach(id => {
      if (!newIds.includes(id)) {
        existingRegions[id].remove();
      }
    });
    
    // Add or update regions
    segments.forEach(segment => {
      if (existingRegions[segment.id]) {
        // Update existing region if needed
        const region = existingRegions[segment.id];
        if (region.start !== segment.start || region.end !== segment.end) {
          region.update({
            start: segment.start,
            end: segment.end
          });
        }
      } else {
        // Add new region only if it doesn't exist
        ws.regions.add({
          id: segment.id,
          start: segment.start,
          end: segment.end,
          drag: true,
          resize: true,
          color: segment.id === selectedSegmentId ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)'
        });
      }
    });
    
    // Reset flag after a short delay
    setTimeout(() => {
      isInternalUpdateRef.current = false;
    }, 100);
  }, [segments, selectedSegmentId, isReady]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playPause = () => {
    wavesurferRef.current?.playPause();
  };

  const addSegment = () => {
    if (!wavesurferRef.current) return;
    
    const current = wavesurferRef.current.getCurrentTime();
    const segmentDuration = Math.min(5, duration - current);
    
    // Check if there's enough space for a new segment
    if (current >= duration - 0.1) {
      console.warn('Cannot add segment at the end of video');
      return;
    }
    
    const newId = `segment-${Date.now()}`;
    const newSegment = {
      id: newId,
      start: current,
      end: Math.min(current + segmentDuration, duration),
      duration: Math.min(segmentDuration, duration - current)
    };
    
    // Add to WaveSurfer
    isInternalUpdateRef.current = true;
    wavesurferRef.current.regions.add({
      id: newId,
      start: newSegment.start,
      end: newSegment.end,
      drag: true,
      resize: true,
      color: 'rgba(59, 130, 246, 0.3)'
    });
    
    setTimeout(() => {
      isInternalUpdateRef.current = false;
    }, 100);
    
    // Update segments in store
    onSegmentsChange([...segments, newSegment]);
  };

  const clearSegments = () => {
    wavesurferRef.current?.regions.clear();
    onSegmentSelect?.(null);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={playPause}
            disabled={!isReady}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={addSegment}
            disabled={!isReady}
            className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-800 disabled:opacity-50"
          >
            Add Segment
          </button>
          
          {segments.length > 0 && (
            <button
              onClick={clearSegments}
              className="px-4 py-2 text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>
        
        <div className="text-sm font-medium">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-lg border border-zinc-200 p-4">
        <div ref={waveformRef} />
        <video 
          ref={videoRef}
          className="hidden"
          controls={false}
        />
      </div>
      
      <div className="mt-2 text-xs text-zinc-500 text-center">
        Click and drag on the waveform to create segments. Click a segment to select it.
      </div>
    </div>
  );
};