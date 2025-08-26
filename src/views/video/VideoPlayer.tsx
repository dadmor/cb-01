// src/views/video/VideoPlayer.tsx
import React, { useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useVideoPlayerStore } from '@/modules/video';
import { usePlayStore } from '@/modules/play/usePlayStore';

export const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    currentVideoUrl,
    isPlaying,
    currentTime,
    duration,
    volume,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume
  } = useVideoPlayerStore();

  const onVideoEnded = usePlayStore((s) => s.onVideoEnded);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => setDuration(video.duration || 0);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onVideoEnded();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    video.volume = volume / 100;

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentVideoUrl, volume, setDuration, setCurrentTime, setIsPlaying, onVideoEnded]);

  const togglePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const seek = (time: number) => {
    const v = videoRef.current;
    if (!v) return;
    const total = Number.isFinite(duration) ? duration : (v.duration || 0);
    v.currentTime = Math.max(0, Math.min(time, total));
  };

  const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds)) return '0:00';
    const secs = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(secs / 60);
    const rest = secs % 60;
    return `${mins}:${rest.toString().padStart(2, '0')}`;
  };

  if (!currentVideoUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-[#444]">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
          <p className="text-[#666] text-sm">Select a video to preview</p>
        </div>
      </div>
    );
  }

  // Fit bez cropa, niezależnie od proporcji.
  const fitClass = 'object-contain';

  return (
    <div className="flex-1 flex flex-col bg-black min-h-0">
      {/* Video Display */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={currentVideoUrl}
          className={`w-full h-full max-w-full max-h-full ${fitClass}`}
          playsInline
          autoPlay
          controls={false}
          preload="metadata"
        />
      </div>

      {/* Controls (stała wysokość kontrolek OK) */}
      <div className="h-24 shrink-0 bg-[#252525] border-t border-[#0a0a0a] p-3">
        <div className="mb-3">
          <div className="flex items-center gap-2 text-[10px] text-[#666] mb-1">
            <span>{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 bg-[#1a1a1a] relative">
              <div
                className="absolute h-full bg-[#E84E36]"
                style={{
                  width: `${
                    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
                  }%`
                }}
              />
              <input
                type="range"
                min={0}
                max={Math.max(0, duration || 0)}
                value={Math.min(currentTime, duration || 0)}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                aria-label="Seek"
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => seek(0)}
              className="p-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#999] hover:bg-[#333] hover:text-white transition-colors"
              aria-label="Restart"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-2 bg-[#E84E36] text-white hover:bg-[#d63d2a] transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => seek(duration || 0)}
              className="p-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#999] hover:bg-[#333] hover:text-white transition-colors"
              aria-label="End"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#666]">Vol</span>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => {
                const vol = parseInt(e.target.value, 10);
                setVolume(vol);
                if (videoRef.current) {
                  videoRef.current.volume = vol / 100;
                }
              }}
              className="w-24"
              style={{ height: "4px", backgroundColor: "#1a1a1a", outline: "none" }}
              aria-label="Volume"
            />
            <span className="text-[10px] text-[#666] w-8 text-right">{volume}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
