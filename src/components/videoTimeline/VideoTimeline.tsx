import WaveSurfer from 'wavesurfer.js';
// @ts-ignore - WaveSurfer 6.x nie ma pełnych typów dla pluginów
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import { Button } from '@/components/ui';
import { useEffect, useRef, useState } from 'react';

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
<div className="flex-1 flex flex-col">
{/* Compact controls integrated with timeline */}
<div className="flex-1 bg-zinc-50 p-2 flex flex-col">
{/* Timeline with integrated controls */}
<div className="flex-1 bg-white rounded-lg border border-zinc-200 p-3 flex flex-col">
  {/* Controls row */}
  <div className="flex items-center justify-between mb-3 pb-3 border-b">
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={playPause}
        disabled={!isReady}
        className="h-8"
      >
        {isPlaying ? 'Pauza' : 'Odtwórz'}
      </Button>
      
      <Button
        size="sm"
        variant="secondary"
        onClick={addSegment}
        disabled={!isReady}
        className="h-8"
      >
        + Segment
      </Button>
      
      {segments.length > 0 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={clearAllSegments}
          className="h-8 text-red-600 hover:text-red-700"
        >
          Wyczyść
        </Button>
      )}
    </div>
    
    <div className="text-sm font-medium text-zinc-700">
      {formatTime(currentTime)} / {formatTime(duration)}
    </div>
  </div>

  {/* Waveform */}
  <div className="flex-1 flex items-center">
    <div ref={waveformRef} className="w-full" />
  </div>
  
  {/* Hidden video element */}
  <video 
    ref={videoRef}
    src={videoUrl}
    className="hidden"
    controls={false}
  />
</div>

{/* Compact info */}
{isReady && (
  <div className="px-3 py-1.5 text-xs text-zinc-500 mt-1">
    💡 Kliknij i przeciągnij na timeline • Shift+klik dla precyzji
  </div>
)}
</div>
</div>
)}
</div>
);
};

export default VideoTimeline;