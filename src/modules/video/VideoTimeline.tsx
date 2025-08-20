import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
// @ts-ignore - WaveSurfer regions plugin doesn't have types
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import { VideoSegment } from '@/types';

interface VideoTimelineProps {
  videoFile: File;
  segments: VideoSegment[];
  onSegmentsChange: (segments: VideoSegment[]) => void;
}

export const VideoTimeline: React.FC<VideoTimelineProps> = ({
  videoFile,
  segments,
  onSegmentsChange
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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
    });

    ws.on('audioprocess', (time: number) => {
      setCurrentTime(time);
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    // Region handlers
    const updateSegments = () => {
      const regions = ws.regions.list;
      const newSegments: VideoSegment[] = Object.values(regions).map((region: any) => ({
        id: region.id,
        start: region.start,
        end: region.end,
        duration: region.end - region.start
      }));
      onSegmentsChange(newSegments);
    };

    ws.on('region-created', updateSegments);
    ws.on('region-updated', updateSegments);
    ws.on('region-removed', updateSegments);

    return () => {
      ws.destroy();
      URL.revokeObjectURL(videoUrl);
    };
  }, [videoFile, onSegmentsChange]);

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
    
    wavesurferRef.current.regions.add({
      start: current,
      end: current + segmentDuration,
      drag: true,
      resize: true
    });
  };

  const clearSegments = () => {
    wavesurferRef.current?.regions.clear();
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
        Click and drag on the waveform to create segments
      </div>
    </div>
  );
};