import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
// @ts-ignore - WaveSurfer 6.x nie ma pełnych typów dla pluginów
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import { Button } from '@/components/ui';

interface Segment {
  id: string;
  start: number;
  end: number;
  duration: number;
  color?: string;
  index: number;
}

interface VideoTimelineProps {
  videoFile: File | null;
  onSegmentsChange?: (segments: Segment[]) => void;
  waveColor?: string;
  progressColor?: string;
  regionColor?: string;
}

const VideoTimeline: React.FC<VideoTimelineProps> = ({ 
  videoFile, 
  onSegmentsChange,
  waveColor = '#3b82f6',
  progressColor = '#1e40af',
  regionColor = 'rgba(59, 130, 246, 0.3)'
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(true);

  // Tworzenie URL dla wideo
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoFile]);

  // Inicjalizacja WaveSurfer
  useEffect(() => {
    if (!videoUrl || !waveformRef.current || !videoRef.current) return;

    // Czyszczenie poprzedniej instancji
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    // Tworzenie nowej instancji WaveSurfer
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: waveColor,
      progressColor: progressColor,
      height: 64,
      normalize: true,
      minPxPerSec: 100,
      backend: 'MediaElement',
      mediaControls: false,
      plugins: [
        RegionsPlugin.create({
          dragSelection: {
            slop: 5
          },
          color: regionColor
        })
      ]
    });

    // Ładowanie wideo
    ws.load(videoRef.current);
    wavesurferRef.current = ws;

    // Event listeners
    ws.on('ready', () => {
      setIsReady(true);
      setDuration(ws.getDuration());
    });

    ws.on('audioprocess', (time: number) => {
      setCurrentTime(time);
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    // Obsługa regionów
    ws.on('region-created', () => {
      updateSegments();
    });

    ws.on('region-updated', () => {
      updateSegments();
    });

    ws.on('region-removed', () => {
      updateSegments();
    });

    return () => {
      ws.destroy();
    };
  }, [videoUrl, waveColor, progressColor, regionColor]);

  const updateSegments = () => {
    if (!wavesurferRef.current) return;
    
    const regions = wavesurferRef.current.regions.list;
    const segmentsData: Segment[] = Object.values(regions).map((region: any, index: number) => ({
      id: region.id,
      start: region.start,
      end: region.end,
      duration: region.end - region.start,
      color: region.color,
      index: index
    }));
    
    setSegments(segmentsData);
    if (onSegmentsChange) {
      onSegmentsChange(segmentsData);
    }
  };

  const playPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const addSegment = () => {
    if (!wavesurferRef.current) return;
    
    const currentTime = wavesurferRef.current.getCurrentTime();
    const segmentDuration = Math.min(5, duration - currentTime);
    
    wavesurferRef.current.regions.add({
      start: currentTime,
      end: currentTime + segmentDuration,
      color: regionColor,
      drag: true,
      resize: true
    });
  };

  const clearAllSegments = () => {
    if (!wavesurferRef.current) return;
    
    wavesurferRef.current.regions.clear();
    setSegments([]);
    if (onSegmentsChange) {
      onSegmentsChange([]);
    }
  };

  const removeSegment = (id: string) => {
    if (!wavesurferRef.current) return;
    
    const region = wavesurferRef.current.regions.list[id];
    if (region) {
      region.remove();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex">
      {videoUrl && (
        <>
          {/* Left side - Video and Controls */}
          <div className={`${showVideo ? 'w-96' : 'w-0'} transition-all duration-300 overflow-hidden border-r bg-zinc-50`}>
            <div className="h-full flex flex-col p-4">
              {/* Video Player */}
              <div className="bg-black rounded-lg overflow-hidden mb-4">
                <video 
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-52 object-contain"
                  controls={false}
                />
              </div>

              {/* Segments List */}
              <div className="flex-1 overflow-y-auto">
                <h3 className="text-sm font-semibold text-zinc-700 mb-2">
                  Segmenty ({segments.length})
                </h3>
                {segments.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    Kliknij i przeciągnij na timeline lub użyj przycisku "Dodaj segment"
                  </p>
                ) : (
                  <div className="space-y-1">
                    {segments.map((segment, index) => (
                      <div 
                        key={segment.id}
                        className="flex items-center justify-between p-2 bg-white rounded border border-zinc-200 text-sm hover:border-zinc-300 transition-colors"
                      >
                        <div>
                          <span className="font-medium">Segment {index + 1}</span>
                          <span className="text-zinc-600 ml-2">
                            {formatTime(segment.start)} - {formatTime(segment.end)}
                          </span>
                        </div>
                        <button
                          onClick={() => removeSegment(segment.id)}
                          className="text-red-600 hover:text-red-700 text-xs px-2 py-1"
                        >
                          Usuń
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Timeline and Controls */}
          <div className="flex-1 flex flex-col">
            {/* Top Controls Bar */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowVideo(!showVideo)}
                  title={showVideo ? "Ukryj wideo" : "Pokaż wideo"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showVideo ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    )}
                  </svg>
                </Button>

                <div className="w-px h-6 bg-zinc-200" />

                <Button
                  size="sm"
                  onClick={playPause}
                  disabled={!isReady}
                >
                  {isPlaying ? 'Pauza' : 'Odtwórz'}
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={addSegment}
                  disabled={!isReady}
                >
                  + Dodaj segment
                </Button>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={clearAllSegments}
                  disabled={!isReady || segments.length === 0}
                >
                  Wyczyść wszystko
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-zinc-700">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
            </div>

            {/* Waveform Timeline */}
            <div className="flex-1 bg-zinc-50 p-4">
              <div className="h-full bg-white rounded-lg border border-zinc-200 p-4 flex items-center">
                <div ref={waveformRef} className="w-full" />
              </div>
            </div>

            {/* Info Bar */}
            {isReady && (
              <div className="px-4 py-2 bg-zinc-100 border-t text-xs text-zinc-600">
                💡 Wskazówka: Kliknij i przeciągnij na timeline, aby zaznaczyć fragment. Użyj Shift+klik dla precyzyjnego zaznaczania.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VideoTimeline;