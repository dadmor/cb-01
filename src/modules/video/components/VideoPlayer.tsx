// src/modules/video/components/VideoPlayer.tsx
import React, { useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useVideoPlayerStore } from '../store/videoPlayerStore';

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

  // Setup video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Set initial volume
    video.volume = volume / 100;

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [currentVideoUrl, volume]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const seek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  return (
    <div className="flex-1 flex flex-col bg-black">
      {/* Video Display */}
      <div className="flex-1 flex items-center justify-center">
        <video
          ref={videoRef}
          src={currentVideoUrl}
          className="max-w-full max-h-full"
        />
      </div>

      {/* Controls */}
      <div className="h-24 bg-[#252525] border-t border-[#0a0a0a] p-3">
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center gap-2 text-[10px] text-[#666] mb-1">
            <span>{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 bg-[#1a1a1a] relative">
              <div
                className="absolute h-full bg-[#E84E36]"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => seek(0)}
              className="p-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#999] hover:bg-[#333] hover:text-white transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-2 bg-[#E84E36] text-white hover:bg-[#d63d2a] transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => seek(duration)}
              className="p-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#999] hover:bg-[#333] hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#666]">Vol</span>
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
              className="w-24"
              style={{
                height: '4px',
                backgroundColor: '#1a1a1a',
                outline: 'none'
              }}
            />
            <span className="text-[10px] text-[#666] w-8 text-right">{volume}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};